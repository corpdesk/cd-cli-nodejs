/* eslint-disable style/brace-style */
import type { ICdResponse, ISessResp } from '../../base/IBase';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import config from '../../../../config';
import { environment } from '../../../../environments/environment'; // Import the environment config
import { HttpService } from '../../base/http.service';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import { logg, logger } from '../../cd-comm/controllers/cd-winston';
import {
  DEFAULT_ENVELOPE_LOGIN,
  SESSION_FILE_STORE,
} from '../models/user.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UserController {
  svServer = new HttpService();
  private sessionFilePath = path.join(__dirname, SESSION_FILE_STORE);

  /**
   * Authenticate the user and manage session.
   */
  async auth(userName: string, password: string): Promise<void> {
    const consumerGuid = environment.clientContext.consumerToken;

    // If password is not provided, prompt for it
    if (!password) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Please enter your password:',
          mask: '*', // Mask the input
        },
      ]);
      password = answers.password;
    }

    // Use DEFAULT_ENVELOPE_LOGIN to setup payload
    const payload = DEFAULT_ENVELOPE_LOGIN;
    payload.dat.f_vals[0].data.userName = userName;
    payload.dat.f_vals[0].data.password = password;
    payload.dat.f_vals[0].data.consumerGuid = consumerGuid;

    try {
      logger.info('Authenticating...');
      logger.info('Payload:', payload); // Simplified logging of the payload

      // Send the request to the server
      const response: ICdResponse = await this.svServer.proc(payload);

      logger.info('Response:', response);

      // Check if the login is successful
      if (response.app_state?.success) {
        // If successful, save session data
        if (response.app_state?.sess) {
          // logger.info('Session data:', response.app_state.sess);
          this.saveSession(response.app_state.sess);

          // Fetch and save profiles after successful login
          const cdToken = response.app_state.sess.cd_token;
          const profileController = new CdCliProfileController();
          if (cdToken) {
            await profileController.fetchAndSaveProfiles(cdToken); // Fetch and save profiles
          } else {
            logger.error('could not save the profile due to invalid session');
          }
        }
      } else {
        // If not successful, log an error and stop the process
        logger.error(
          'Login failed:',
          response.app_state?.info || { error: 'Unknown error' },
        );
        throw new Error(
          'Login failed. Please check your credentials and try again.',
        );
      }
    } catch (error: any) {
      logger.error('Error during login:', error.message);
    }
  }

  // Login wizard method with retry attempts
  async loginWithRetry() {
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;
        logger.info(`Attempt ${attempts} of 3: Please log in.`);

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
          logg.success('Login successful!');
          return; // Exit login retry loop if successful
        } else {
          logger.error('Login failed. Please try again.');
        }
      } catch (error: any) {
        logger.error('Error during login attempt:', error.message);
      }

      // If the user exceeds 3 attempts, exit with an error message
      if (attempts >= 3) {
        logger.error('Too many failed login attempts. Exiting.');
        break;
      }
    }
  }

  /**
   * Save session details to a file.
   */
  private saveSession(session: ISessResp | null): void {
    logger.info(`session:${session}`);
    logger.info(`sessionFilePath:${this.sessionFilePath}`);
    if (session) {
      // Update session in config
      config.cdSession = session;
    }

    // Save session to file
    fs.writeFileSync(this.sessionFilePath, JSON.stringify(session, null, 2));
    logger.info('Session saved.');
    logger.info(`sessionFilePath:${this.sessionFilePath}`);
  }

  /**
   * Log out by clearing the session.
   */
  logout(): void {
    if (fs.existsSync(this.sessionFilePath)) {
      fs.unlinkSync(this.sessionFilePath);
      logger.info('Logged out successfully.');
    } else {
      logger.info('No active session found.');
    }
  }

  /**
   * Get the current session.
   */
  getSession(): ISessResp | null {
    // if (config.cdSession.cd_token) {
    //   return config.cdSession;
    // }
    if (fs.existsSync(this.sessionFilePath)) {
      return JSON.parse(fs.readFileSync(this.sessionFilePath, 'utf-8'));
    }
    return null;
  }

  /**
   * Check if the session is valid.
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    if (session) {
      const now = Math.floor(Date.now() / 1000);
      return now < session.ttl;
    }
    return false;
  }
}
