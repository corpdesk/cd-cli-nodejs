/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { ICdResponse, ISessResp } from '../../base/IBase';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import config, {
  CONFIG_FILE_PATH,
  DEFAULT_SESS,
  loadCdCliConfig,
} from '../../../../config';
import { environment } from '../../../../environments/environment'; // Import the environment config
import { HttpService } from '../../base/http.service';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '../../cd-cli/controllers/cd-cli-vault.controller';
import { VAULT_DIRECTORY } from '../../cd-cli/models/cd-cli-vault.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { logg, logger } from '../../cd-comm/controllers/cd-winston';
import { DEFAULT_ENVELOPE_LOGIN } from '../models/user.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UserController {
  svServer = new HttpService();
  // private SESSION_FILE_STORE = path.join(__dirname, SESSION_FILE_STORE);

  init(debugLevel) {
    CdLogg.setDebugLevel(debugLevel);
  }

  /**
   * Authenticate the user and manage session.
   */
  async auth(userName: string, password: string): Promise<void> {
    try {
      // Load the configuration file
      const cdCliConfig = loadCdCliConfig();

      // Find the profile named 'cd-api-local'
      const profile = cdCliConfig.items.find(
        (item: any) => item.cdCliProfileName === 'cd-api-local',
      );

      if (!profile || !profile.cdCliProfileData?.details?.consumerToken) {
        throw new Error(
          `Profile 'cd-api-local' with 'consumerToken' not found in configuration.`,
        );
      }

      // Handle deferred value in consumerToken
      let consumerGuid = profile.cdCliProfileData.details.consumerToken;
      if (
        typeof consumerGuid === 'string' &&
        consumerGuid.startsWith('#cdVault[')
      ) {
        const vaultName = consumerGuid.match(/#cdVault\['(.+)'\]/)?.[1];
        if (!vaultName) {
          throw new Error(
            `Invalid cdVault reference in consumerToken: ${consumerGuid}`,
          );
        }

        // Find the matching cdVault item
        const cdVaultItem = profile.cdCliProfileData.details.cdVault?.find(
          (vault: any) => vault.name === vaultName,
        );

        if (!cdVaultItem) {
          throw new Error(`cdVault item '${vaultName}' not found.`);
        }

        // Extract value or decrypt if encrypted
        if (cdVaultItem.isEncrypted && cdVaultItem.encryptedValue) {
          consumerGuid = CdCliVaultController.getSensitiveData(cdVaultItem);
        } else {
          consumerGuid = cdVaultItem.value;
        }

        if (!consumerGuid) {
          throw new Error(
            `ConsumerToken could not be resolved for '${vaultName}'.`,
          );
        }
      }

      // Prompt for password if not provided
      if (!password) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Please enter your password:',
            mask: '*',
          },
        ]);
        password = answers.password;
      }

      // Prepare payload using DEFAULT_ENVELOPE_LOGIN
      const payload = DEFAULT_ENVELOPE_LOGIN;
      payload.dat.f_vals[0].data.userName = userName;
      payload.dat.f_vals[0].data.password = password;
      payload.dat.f_vals[0].data.consumerGuid = consumerGuid;

      CdLogg.info('Authenticating...');
      CdLogg.info('Payload:', payload);

      // Ensure HttpService is properly initialized before making requests
      const httpService = new HttpService();
      await httpService.init('cd-api-local'); // Ensure axiosInstance is set with preferred profile

      const response: ICdResponse = await httpService.proc(payload);

      CdLogg.info('Response:', response);

      if (response.app_state?.success) {
        if (response.app_state?.sess) {
          this.saveSession(response.app_state.sess);

          const cdToken = response.app_state.sess.cd_token;
          const profileController = new CdCliProfileController();
          CdLogg.debug('cdToken:', { token: cdToken });
          if (cdToken) {
            await profileController.fetchAndSaveProfiles(cdToken);
          } else {
            CdLogg.error('Could not save profiles due to an invalid session.');
          }
        }
      } else {
        CdLogg.error(
          'Login failed:',
          response.app_state?.info || { error: 'Unknown error' },
        );
        throw new Error(
          'Login failed. Please check your credentials and try again.',
        );
      }
    } catch (error: any) {
      CdLogg.error('Error during login:', error.message);
    }
  }

  // Login wizard method with retry attempts
  async loginWithRetry() {
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;

        CdLogg.info(`Attempt ${attempts} of 3: Please log in.`);

        // Prompt for username
        const usernameAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'userName',
            message: 'Enter your username:',
          },
        ]);

        // Call auth method from UserController to handle login
        await this.auth(usernameAnswer.userName, '');

        // Check if login was successful by verifying session
        if (this.getSession()) {
          CdLogg.success('Login successful!');
          return; // Exit login retry loop if successful
        } else {
          CdLogg.error('Login failed. Please try again.');
        }
      } catch (error: any) {
        CdLogg.error('Error during login attempt:', error.message);
      }

      // If the user exceeds 3 attempts, exit with an error message
      if (attempts >= 3) {
        CdLogg.error('Too many failed login attempts. Exiting.');
        break;
      }
    }
  }

  /**
   * Save session details to a file.
   */
  // Save the session data
  public saveSession(session: any): void {
    const sessionData = JSON.stringify(session);
    CdCliVaultController.storeSensitiveData(
      path.join(VAULT_DIRECTORY, 'session.json'),
      sessionData,
    );
    CdLogg.success('Session saved.');
  }

  /**
   * Get the current session.
   */
  public getSession(): ISessResp | null {
    try {
      // Check if the config file exists
      if (!fs.existsSync(CONFIG_FILE_PATH)) {
        throw new Error(`Config file not found at: ${CONFIG_FILE_PATH}`);
      }

      // Read the content of the config file
      const configData = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));

      // Extract session data from the config file
      const sessionData = configData.session;

      // Optionally, decrypt the session token or any other sensitive data if required
      if (sessionData) {
        // Decrypt the session token if it's sensitive (uncomment if necessary)
        // sessionData.token = CdCliVaultController.decrypt(sessionData.token);

        return sessionData;
      } else {
        throw new Error('Session data not found in the config file.');
      }
    } catch (error) {
      console.error(`Error retrieving session: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Log out by clearing the session.
   */
  logout(): void {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
        // Clear session section from config
        config.session = { ...DEFAULT_SESS }; // Set session to default

        // Write updated config to file
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        CdLogg.info('Logged out successfully and session cleared.');
      } else {
        CdLogg.error('Config file not found.');
      }
    } catch (error) {
      CdLogg.error(`Error during logout: ${(error as Error).message}`);
    }
  }

  /**
   * Check if the session is valid.
   */
  // Method to check if session is valid
  isSessionValid(): boolean {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
        const session = config.session || DEFAULT_SESS;

        // Validate session based on cd_token and expiration time (ttl)
        if (session && session.cd_token) {
          const now = Math.floor(Date.now() / 1000); // Current time in seconds
          return session.ttl && now < session.ttl;
        }
      }
      return false;
    } catch (error) {
      CdLogg.error(
        `Error checking session validity: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
