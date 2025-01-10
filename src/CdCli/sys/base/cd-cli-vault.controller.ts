/* eslint-disable antfu/if-newline */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable node/prefer-global/buffer */
/* eslint-disable node/prefer-global/process */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import CdLogg from '../cd-comm/controllers/cd-logger.controller';

export const VAULT_DIRECTORY = path.join(process.env.HOME || '~/', '.cd-cli');

// Interfaces
export interface CdVault {
  name: string; // Unique identifier for the vault entry
  description: string; // Description of the vault entry
  value: string | null; // Value if not encrypted
  encryptedValue: string | null; // Encrypted data
  isEncrypted: boolean; // Indicates if the data is encrypted
  encryptionMeta: EncryptionMeta; // Metadata for the encryption
}

export interface EncryptionMeta {
  name: string; // Identifier for the encryption configuration
  algorithm: string; // Encryption algorithm (e.g., 'aes-256-cbc')
  encoding: BufferEncoding; // Encoding format (e.g., 'hex', 'base64')
  ivLength: number; // Length of the initialization vector
  iv?: string; // Add 'iv' as an optional property
  keyDerivationMethod?: string; // Optional: Method used to derive the key
  keySalt?: string; // Optional: Salt used for key derivation
  additionalAuthenticatedData?: string; // Optional: For AEAD algorithms
  encryptedAt?: string; // Optional: Timestamp when encryption occurred
}

// Encryption configurations
export const ENCRYPTION_CONFIGS: EncryptionMeta[] = [
  {
    name: 'default',
    algorithm: 'aes-256-cbc',
    encoding: 'hex',
    ivLength: 16,
  },
  {
    name: 'optional-aes-gcm',
    algorithm: 'aes-256-gcm',
    encoding: 'base64',
    ivLength: 12,
    additionalAuthenticatedData: 'auth-data',
  },
];

// Ensure the vault directory exists
if (!fs.existsSync(VAULT_DIRECTORY)) {
  fs.mkdirSync(VAULT_DIRECTORY, { recursive: true });
}

class CdCliVaultController {
  private static getEncryptionKey(): Buffer {
    const encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;
    if (!encryptionKey) {
      throw new Error(
        'CD_CLI_ENCRYPT_KEY is not defined in environment variables.',
      );
    }
    return Buffer.from(encryptionKey, 'hex');
  }

  private static getEncryptionMetaByName(name: string): EncryptionMeta {
    const config = ENCRYPTION_CONFIGS.find((config) => config.name === name);
    if (!config) {
      throw new Error(`Encryption configuration '${name}' not found.`);
    }
    return config;
  }

  // private static encrypt(text: string, metaName: string): CdVault {
  //   const meta = this.getEncryptionMetaByName(metaName);
  //   const iv = crypto.randomBytes(meta.ivLength);
  //   const cipher = crypto.createCipheriv(
  //     meta.algorithm,
  //     this.getEncryptionKey(),
  //     iv,
  //   );

  //   let encrypted = cipher.update(
  //     text,
  //     'utf8',
  //     meta.encoding as BufferEncoding,
  //   );
  //   encrypted += cipher.final(meta.encoding as BufferEncoding);

  //   return {
  //     name: 'encrypted-data',
  //     description: 'Encrypted data',
  //     encryptedValue: encrypted,
  //     isEncrypted: true,
  //     encryptionMeta: {
  //       ...meta,
  //       iv: iv.toString(meta.encoding), // Add 'iv' dynamically
  //       encryptedAt: new Date().toISOString(),
  //     } as EncryptionMeta & { iv: string; encryptedAt: string }, // Extend metadata
  //   };
  // }
  private static encrypt(text: string, metaName: string): CdVault {
    const meta = this.getEncryptionMetaByName(metaName);
    const iv = crypto.randomBytes(meta.ivLength);
    const cipher = crypto.createCipheriv(
      meta.algorithm,
      this.getEncryptionKey(),
      iv,
    );

    let encrypted = cipher.update(
      text,
      'utf8',
      meta.encoding as BufferEncoding,
    );
    encrypted += cipher.final(meta.encoding as BufferEncoding);

    return {
      name: 'encrypted-data',
      description: 'Encrypted data',
      value: null, // Clear plain value after encryption
      encryptedValue: encrypted,
      isEncrypted: true,
      encryptionMeta: {
        ...meta,
        iv: iv.toString(meta.encoding),
        encryptedAt: new Date().toISOString(),
      } as EncryptionMeta & { iv: string; encryptedAt: string },
    };
  }

  /**
   * Usage:
   * Below is an example of encrypting from a value hosted in CdVault object.
   * This facility is not designed for production enviornment by special cases during development.
   *
   * let vaultEntry: CdVault = {
      name: 'gitHubToken',
      description: 'GitHub access token',
      value: 'plain-text-token',
      encryptedValue: null,
      isEncrypted: false,
      encryptionMeta: {} as EncryptionMeta, // Will be populated after encryption
    };

    // Encrypt the plain text
    vaultEntry = CdCliVaultController.encryptValue(vaultEntry);
    console.log('Encrypted Vault Entry:', vaultEntry);
   * @param vault
   * @param metaName
   * @returns
   */
  static encryptValue(vault: CdVault, metaName = 'default'): CdVault {
    if (vault.isEncrypted || !vault.value) {
      throw new Error(
        `Vault entry '${vault.name}' is already encrypted or has no plain value.`,
      );
    }

    const encryptedVault = this.encrypt(vault.value, metaName);

    return {
      ...vault,
      value: null, // Clear plain text value after encryption
      encryptedValue: encryptedVault.encryptedValue,
      isEncrypted: true,
      encryptionMeta: encryptedVault.encryptionMeta,
    };
  }

  private static decrypt(
    encryptionMeta: EncryptionMeta & { iv: string },
    encryptedValue: string,
  ): string {
    if (!encryptionMeta.iv) {
      throw new Error(
        'Initialization vector (iv) is missing in the encryption metadata.',
      );
    }

    const iv = Buffer.from(encryptionMeta.iv, encryptionMeta.encoding);

    const decipher = crypto.createDecipheriv(
      encryptionMeta.algorithm,
      this.getEncryptionKey(),
      iv,
    );

    let decrypted = decipher.update(
      encryptedValue,
      encryptionMeta.encoding as BufferEncoding,
      'utf8',
    );
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static storeSensitiveData(
    filePath: string,
    data: string,
    metaName = 'default',
  ): void {
    const vault = this.encrypt(data, metaName);
    fs.writeFileSync(filePath, JSON.stringify(vault, null, 2));
  }

  // static getSensitiveData(vault: CdVault): string {
  //   if (!vault.isEncrypted) {
  //     throw new Error(`Vault entry '${vault.name}' is not encrypted.`);
  //   }

  //   if (!vault.encryptedValue || !vault.encryptionMeta) {
  //     throw new Error(
  //       `Vault entry '${vault.name}' is missing required encryption data.`,
  //     );
  //   }

  //   const encryptionMeta = vault.encryptionMeta;

  //   if (!encryptionMeta.iv) {
  //     throw new Error(
  //       `Vault entry '${vault.name}' is missing the 'iv' property in its encryption metadata.`,
  //     );
  //   }

  //   // Assert that encryptionMeta includes iv as a required field
  //   return this.decrypt(
  //     { ...encryptionMeta, iv: encryptionMeta.iv } as EncryptionMeta & {
  //       iv: string;
  //     },
  //     vault.encryptedValue,
  //   );
  // }
  /**
   * Usage:
   * Retrieve encrypted data:
   * const decryptedValue = CdCliVaultController.getSensitiveData(vaultEntry);
     console.log('Decrypted Value:', decryptedValue);

   * @param vault
   * @returns
   */
  static getSensitiveData(vault: CdVault): string {
    if (!vault.isEncrypted) {
      if (vault.value) return vault.value;
      throw new Error(`Vault entry '${vault.name}' is not encrypted.`);
    }

    if (!vault.encryptedValue || !vault.encryptionMeta) {
      throw new Error(
        `Vault entry '${vault.name}' is missing required encryption data.`,
      );
    }

    const encryptionMeta = vault.encryptionMeta;

    if (!encryptionMeta.iv) {
      throw new Error(
        `Vault entry '${vault.name}' is missing the 'iv' property in its encryption metadata.`,
      );
    }

    return this.decrypt(
      { ...encryptionMeta, iv: encryptionMeta.iv } as EncryptionMeta & {
        iv: string;
      },
      vault.encryptedValue,
    );
  }

  public static saveProfileData(profileData: any): void {
    if (profileData.github?.token) {
      profileData.github.token = this.encrypt(
        profileData.github.token,
        'default',
      );
    }
    const configFilePath = path.join(VAULT_DIRECTORY, 'cd-cli.config.json');
    fs.writeFileSync(configFilePath, JSON.stringify(profileData, null, 2));
  }

  public static readProfileData(): any {
    const configFilePath = path.join(VAULT_DIRECTORY, 'cd-cli.config.json');
    const profileData = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

    if (
      profileData.github?.token?.encryptedValue &&
      profileData.github?.token?.encryptionMeta
    ) {
      const { encryptedValue, encryptionMeta } = profileData.github.token;

      // Pass both encryptionMeta and encryptedValue to decrypt
      profileData.github.token = this.decrypt(encryptionMeta, encryptedValue);
    }

    return profileData;
  }

  public static async fetchAndSaveProfiles(cdToken: string): Promise<void> {
    if (!cdToken) {
      CdLogg.error('No valid cdToken found. Cannot fetch profiles.');
      return;
    }

    const q = { where: { userId: -1 } };

    try {
      const response = await axios.post('API_ENDPOINT', q, {
        headers: { Authorization: `Bearer ${cdToken}` },
      });

      if (response.data.success) {
        const profiles = response.data.profiles || { items: [], count: 0 };
        const profilesPath = path.join(VAULT_DIRECTORY, 'profile.json');
        this.storeSensitiveData(profilesPath, JSON.stringify(profiles));
        CdLogg.success('Profiles saved successfully.');
      } else {
        CdLogg.error(`Failed to fetch profiles: ${response.data.message}`);
      }
    } catch (error) {
      CdLogg.error('Error fetching profiles:', {
        error: (error as Error).message,
      });
    }
  }
}

export default CdCliVaultController;
