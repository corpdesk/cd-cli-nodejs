/* eslint-disable style/indent */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable antfu/if-newline */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable node/prefer-global/buffer */
/* eslint-disable node/prefer-global/process */

import type { ProfileModel } from '../models/cd-cli-profile.model';
import type { CdVault, EncryptionMeta } from '../models/cd-cli-vault.model';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadCdCliConfig } from '@/config';
import axios from 'axios';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import {
  ENCRYPTION_CONFIGS,
  VAULT_DIRECTORY,
} from '../models/cd-cli-vault.model';

// Ensure the vault directory exists
if (!fs.existsSync(VAULT_DIRECTORY)) {
  fs.mkdirSync(VAULT_DIRECTORY, { recursive: true });
}

class CdCliVaultController {
  /**
   * Retrieves the encryption key from the environment variables.
   * If the key is missing, it triggers the creation of a new key.
   * @returns {Buffer} - The encryption key as a Buffer.
   */
  private static getEncryptionKey(): Buffer {
    let encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;

    if (!encryptionKey) {
      CdLogg.warning(
        'Encryption key not found in environment variables. Generating a new key...',
      );
      encryptionKey = this.createEncryptionKey();
    }

    // Validate the key length
    if (encryptionKey.length !== 64) {
      throw new Error(
        `Invalid encryption key length: ${encryptionKey.length}. Expected a 64-character hex string.`,
      );
    }

    return Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Creates a new encryption key and saves it using `saveEncryptionKey`.
   * @returns {string} - The newly generated encryption key.
   */
  private static createEncryptionKey(): string {
    const newKey = crypto.randomBytes(32).toString('hex');
    this.saveEncryptionKey(newKey);
    CdLogg.success('New encryption key created and saved.');
    return newKey;
  }

  /**
   * Saves the encryption key to a secure location.
   * Current implementation saves to the `.env` file.
   * Future implementations may include Web3 and cloud-based options.
   * @param {string} encryptionKey - The encryption key to save.
   */
  private static saveEncryptionKey(encryptionKey: string): void {
    const envFilePath = path.join(VAULT_DIRECTORY, '.env');

    // Ensure the .env file exists or create it
    if (!fs.existsSync(envFilePath)) {
      CdLogg.info('Creating .env file for storing the encryption key...');
      fs.writeFileSync(envFilePath, '');
    }

    // Append or update the encryption key in the .env file
    const envFileContent = fs.readFileSync(envFilePath, 'utf-8');
    const updatedContent = envFileContent.includes('CD_CLI_ENCRYPT_KEY=')
      ? envFileContent.replace(
          /CD_CLI_ENCRYPT_KEY=.*/,
          `CD_CLI_ENCRYPT_KEY=${encryptionKey}`,
        )
      : `${envFileContent}\nCD_CLI_ENCRYPT_KEY=${encryptionKey}`.trim();

    fs.writeFileSync(envFilePath, updatedContent, 'utf-8');
    CdLogg.success('Encryption key saved to .env file.');
  }

  /**
   * Example usage of getEncryptionKey().
   */
  static exampleUsage(): void {
    try {
      const encryptionKeyBuffer = this.getEncryptionKey();
      console.log('Encryption Key Buffer:', encryptionKeyBuffer);
    } catch (error) {
      CdLogg.error(
        `Error fetching encryption key: ${(error as Error).message}`,
      );
    }
  }

  // export default CdCliVaultController;

  private static getEncryptionMetaByName(name: string): EncryptionMeta {
    const config = ENCRYPTION_CONFIGS.find((config) => config.name === name);
    if (!config) {
      throw new Error(`Encryption configuration '${name}' not found.`);
    }
    return config;
  }

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

  static decrypt(
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

  async encryptionKeyWizard(): Promise<void> {
    const encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;
    if (!encryptionKey) {
      console.log('Encryption key not found. Generating a new key...');
      const newKey = crypto.randomBytes(32).toString('hex');
      process.env.CD_CLI_ENCRYPT_KEY = newKey;
      console.log('New encryption key generated.');
    } else {
      console.log('Encryption key exists. Validating...');
      // Add validation logic here.
    }

    // Add backup logic
    console.log('Checking backup configurations...');
    // Report backup status and suggestions.
  }

  async encryptionValidator(
    profileName: string | null = null,
    jPath: string | null = null,
  ): Promise<void> {
    const cdCliConfig = loadCdCliConfig();

    if (!profileName && !jPath) {
      console.log('Validating all profiles...');
      for (const profile of cdCliConfig.items) {
        await this.validateCdVaultEntries(profile);
      }
    } else if (profileName) {
      const profile = cdCliConfig.items.find(
        (p) => p.cdCliProfileName === profileName,
      );
      if (!profile) {
        console.error(`Profile '${profileName}' not found.`);
        return;
      }
      await this.validateCdVaultEntries(profile);
    } else if (jPath) {
      console.log(`Validating field at path '${jPath}'...`);
      // Add logic to validate specific field.
    }
  }

  private async validateCdVaultEntries(profile: ProfileModel): Promise<void> {
    const { cdVault, details } = profile.cdCliProfileData || {};
    if (!cdVault) {
      console.log(
        `No cdVault entries for profile: ${profile.cdCliProfileName}`,
      );
      return;
    }

    for (const vaultItem of cdVault) {
      if (!vaultItem.isEncrypted) {
        console.log(`Encrypting and adding '${vaultItem.name}' to cdVault...`);
        // Encrypt and update vaultItem.
      } else {
        console.log(`Validating encrypted entry '${vaultItem.name}'...`);
        // Validate encryption metadata and re-encrypt if necessary.
      }
    }
  }
}

export default CdCliVaultController;
