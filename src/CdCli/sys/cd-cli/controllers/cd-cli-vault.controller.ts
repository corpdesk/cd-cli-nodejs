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
import fs, { existsSync, mkdirSync } from 'node:fs';
import path, { join } from 'node:path';
import { loadCdCliConfig } from '@/config';
import axios from 'axios';
import inquirer from 'inquirer';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import {
  ENCRYPTION_CONFIGS,
  VAULT_DIRECTORY,
} from '../models/cd-cli-vault.model';

// Ensure the vault directory exists
if (!existsSync(VAULT_DIRECTORY)) {
  mkdirSync(VAULT_DIRECTORY, { recursive: true });
}

class CdCliVaultController {
  /**
   * Retrieves the encryption key from the environment variables.
   * If the key is missing, it triggers the creation of a new key.
   * @returns {Buffer} - The encryption key as a Buffer.
   */
  // static getEncryptionKey(): Buffer {
  //   let encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;

  //   if (!encryptionKey) {
  //     CdLogg.warning(
  //       'Encryption key not found in environment variables. Generating a new key...',
  //     );
  //     encryptionKey = this.createEncryptionKey();
  //   }

  //   // Validate the key length
  //   if (encryptionKey.length !== 64) {
  //     throw new Error(
  //       `Invalid encryption key length: ${encryptionKey.length}. Expected a 64-character hex string.`,
  //     );
  //   }

  //   return Buffer.from(encryptionKey, 'hex');
  // }

  // static async getEncryptionKey(): Promise<Buffer> {
  //   let encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;

  //   if (!encryptionKey) {
  //     CdLogg.warning('Encryption key not found in environment variables.');

  //     // Prompt user for action
  //     const answers = await inquirer.prompt([
  //       {
  //         type: 'confirm',
  //         name: 'provideKey',
  //         message:
  //           'Encryption key not found. Do you want to provide an existing key?',
  //         default: true,
  //       },
  //     ]);

  //     if (answers.provideKey) {
  //       // Prompt for existing encryption key
  //       const keyInput = await inquirer.prompt([
  //         {
  //           type: 'password',
  //           name: 'encryptionKey',
  //           message: 'Enter your existing encryption key:',
  //           mask: '*',
  //           validate: (input) =>
  //             input.length === 64 || 'Key must be a 64-character hex string.',
  //         },
  //       ]);
  //       encryptionKey = keyInput.encryptionKey;

  //       // Set the environment variable for subsequent use
  //       process.env.CD_CLI_ENCRYPT_KEY = encryptionKey;
  //     } else {
  //       // Ask if the user wants to generate a new key
  //       const generateNewKey = await inquirer.prompt([
  //         {
  //           type: 'confirm',
  //           name: 'generateKey',
  //           message:
  //             'Do you want to generate a new encryption key? (This will make previous data inaccessible)',
  //           default: false,
  //         },
  //       ]);

  //       if (generateNewKey.generateKey) {
  //         encryptionKey = this.createEncryptionKey();
  //       } else {
  //         throw new Error('Operation aborted: No encryption key provided.');
  //       }
  //     }
  //   }

  //   // Validate the key length
  //   if (encryptionKey?.length !== 64) {
  //     throw new Error(
  //       `Invalid encryption key length: ${encryptionKey?.length}. Expected a 64-character hex string.`,
  //     );
  //   }

  //   return Buffer.from(encryptionKey, 'hex');
  // }
  static async getEncryptionKey(): Promise<Buffer> {
    let encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;

    if (!encryptionKey) {
      CdLogg.warning('Encryption key not found in environment variables.');

      // Prompt user for action
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'provideKey',
          message:
            'Encryption key not found. Do you want to provide an existing key?',
          default: true,
        },
      ]);

      if (answers.provideKey) {
        // Prompt for existing encryption key
        const keyInput = await inquirer.prompt([
          {
            type: 'password',
            name: 'encryptionKey',
            message: 'Enter your existing encryption key:',
            mask: '*',
            validate: (input) =>
              input.length === 64 || 'Key must be a 64-character hex string.',
          },
        ]);
        encryptionKey = keyInput.encryptionKey;

        // Set the environment variable for subsequent use
        process.env.CD_CLI_ENCRYPT_KEY = encryptionKey;
      } else {
        // Ask if the user wants to generate a new key
        const generateNewKey = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'generateKey',
            message:
              'Do you want to generate a new encryption key? (This will make previous data inaccessible)',
            default: false,
          },
        ]);

        if (generateNewKey.generateKey) {
          encryptionKey = this.createEncryptionKey();
        } else {
          throw new Error('Operation aborted: No encryption key provided.');
        }
      }
    }

    // Validate the key length
    if (encryptionKey?.length !== 64) {
      throw new Error(
        `Invalid encryption key length: ${encryptionKey?.length}. Expected a 64-character hex string.`,
      );
    }

    return Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Creates a new encryption key and saves it using `saveEncryptionKey`.
   * @returns {string} - The newly generated encryption key.
   */
  static createEncryptionKey(): string {
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
  static saveEncryptionKey(encryptionKey: string): void {
    const envFilePath = join(VAULT_DIRECTORY, '.env');

    // Ensure the .env file exists or create it
    if (!existsSync(envFilePath)) {
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

  static getEncryptionMetaByName(name: string): EncryptionMeta {
    const config = ENCRYPTION_CONFIGS.find((config) => config.name === name);
    if (!config) {
      throw new Error(`Encryption configuration '${name}' not found.`);
    }
    return config;
  }

  static async encrypt(
    text: string,
    metaName: string,
  ): Promise<CdVault | null> {
    CdLogg.debug('starting CdCliVaultController::encrypt()');
    try {
      const meta = this.getEncryptionMetaByName(metaName);
      CdLogg.debug('CdCliVaultController::encrypt()/meta:', meta);
      const iv = crypto.randomBytes(meta.ivLength);
      CdLogg.debug('CdCliVaultController::encrypt()/iv:', iv);
      const cipher = crypto.createCipheriv(
        meta.algorithm,
        await this.getEncryptionKey(),
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
    } catch (e) {
      CdLogg.error(`Could not complete encryption: ${(e as Error).message}`);
      return null;
    }
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
  static async encryptValue(
    vault: CdVault,
    metaName = 'default',
  ): Promise<CdVault | null> {
    CdLogg.debug('starting CdCliVaultController::encryptValue()');
    CdLogg.debug('CdCliVaultController::encryptValue()/vault:', vault);
    CdLogg.debug('CdCliVaultController::encryptValue()/metaName:', {
      mn: metaName,
    });
    if (vault.isEncrypted || !vault.value) {
      throw new Error(
        `Vault entry '${vault.name}' is already encrypted or has no plain value.`,
      );
    }

    const encryptedVault = await this.encrypt(vault.value, metaName);
    CdLogg.debug('CdCliVaultController::encryptValue()/encryptedVault:', {
      encryptV: encryptedVault,
    });

    if (encryptedVault) {
      return {
        ...vault,
        value: null, // Clear plain text value after encryption
        encryptedValue: encryptedVault.encryptedValue,
        isEncrypted: true,
        encryptionMeta: encryptedVault.encryptionMeta,
      };
    } else {
      return null;
    }
  }

  // static async decrypt(
  //   encryptionMeta: EncryptionMeta & { iv: string },
  //   encryptedValue: string,
  // ): Promise<string | null> {
  //   CdLogg.debug('starting CdCliValutController::decrypt()');
  //   CdLogg.debug(
  //     'CdCliValutController::decrypt()/encryptionMeta:',
  //     encryptionMeta,
  //   );
  //   CdLogg.debug('CdCliValutController::decrypt()/encryptedValue:', {
  //     e: encryptedValue,
  //   });

  //   try {
  //     if (!encryptionMeta.iv) {
  //       // CdLogg.debug('CdCliValutController::decrypt()/02');
  //       throw new Error(
  //         'Initialization vector (iv) is missing in the encryption metadata.',
  //       );
  //     }

  //     // CdLogg.debug('CdCliValutController::decrypt()/03');
  //     const iv = Buffer.from(encryptionMeta.iv, encryptionMeta.encoding);
  //     CdLogg.debug('CdCliValutController::decrypt()/iv:', { vector: iv });

  //     const decipher = crypto.createDecipheriv(
  //       encryptionMeta.algorithm,
  //       await this.getEncryptionKey(),
  //       iv,
  //     );
  //     CdLogg.debug('CdCliValutController::decrypt()/decipher:', decipher);
  //     // CdLogg.debug('CdCliValutController::decrypt()/05');
  //     let decrypted = decipher.update(
  //       encryptedValue,
  //       encryptionMeta.encoding as BufferEncoding,
  //       'utf8',
  //     );
  //     CdLogg.debug('CdCliValutController::decrypt()/06');
  //     decrypted += decipher.final('utf8');
  //     CdLogg.debug('CdCliValutController::decrypt()/07');

  //     return decrypted;
  //   } catch (e) {
  //     CdLogg.error('Error at CdCliValutController::decrypt()/e:', {
  //       e: (e as Error).message,
  //     });
  //     return null;
  //   }
  // }
  static async decrypt(
    encryptionMeta: EncryptionMeta & { iv: string },
    encryptedValue: string,
  ): Promise<string | null> {
    CdLogg.debug('starting CdCliValutController::decrypt()');
    CdLogg.debug(
      'CdCliValutController::decrypt()/encryptionMeta:',
      encryptionMeta,
    );
    CdLogg.debug('CdCliValutController::decrypt()/encryptedValue:', {
      e: encryptedValue,
    });

    try {
      if (!encryptionMeta.iv) {
        throw new Error(
          'Initialization vector (iv) is missing in the encryption metadata.',
        );
      }

      const iv = Buffer.from(encryptionMeta.iv, encryptionMeta.encoding);
      CdLogg.debug('CdCliValutController::decrypt()/iv:', { vector: iv });

      const encryptionKey = await this.getEncryptionKey();
      const decipher = crypto.createDecipheriv(
        encryptionMeta.algorithm,
        encryptionKey,
        iv,
      );
      CdLogg.debug('CdCliValutController::decrypt()/decipher:', decipher);

      let decrypted = decipher.update(
        encryptedValue,
        encryptionMeta.encoding as BufferEncoding,
        'utf8',
      );
      decrypted += decipher.final('utf8');
      CdLogg.debug('CdCliValutController::decrypt()/07');

      return await decrypted;
    } catch (e) {
      CdLogg.error('Error at CdCliValutController::decrypt()/e:', {
        e: (e as Error).message,
      });
      return await null;
    }
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
  static async getSensitiveData(vault: CdVault): Promise<string | null> {
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

    return await this.decrypt(
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
    const configFilePath = join(VAULT_DIRECTORY, 'cd-cli.config.json');
    fs.writeFileSync(configFilePath, JSON.stringify(profileData, null, 2));
  }

  public static readProfileData(): any {
    const configFilePath = join(VAULT_DIRECTORY, 'cd-cli.config.json');
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
        const profilesPath = join(VAULT_DIRECTORY, 'profile.json');
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
