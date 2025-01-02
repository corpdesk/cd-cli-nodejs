/* eslint-disable style/brace-style */
import type { ICdResponse, ISessResp } from '../../base/IBase';
import fs from 'node:fs';
import https from 'node:https'; // Use `import` instead of `require`
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../../../../config';
import { HttpService } from '../../base/http.service';
import Logger from '../../cd-comm/controllers/notifier.controller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UserController {
  svServer = new HttpService();
  private sessionFilePath = path.join(__dirname, 'session.json');

  /**
   * Authenticate the user and manage session.
   */
  async auth(userName: string, password: string): Promise<void> {
    const payload = {
      ctx: 'Sys',
      m: 'User',
      c: 'User',
      a: 'Login',
      dat: {
        f_vals: [
          {
            data: {
              userName,
              password,
              consumerGuid: 'B0B3DA99-1859-A499-90F6-1E3F69575DCD',
            },
          },
        ],
        token: null,
      },
      args: null,
    };

    try {
      Logger.info('Authenticating...');
      Logger.info('Payload:', payload); // Simplified logging of the payload

      // Send the request to the server
      const response: ICdResponse = await this.svServer.proc(payload);

      // Log the response data (avoid logging the entire response object to prevent circular references)
      // Logger.info('Response data:', response.data);
      // Logger.info('Full response:', response);
      // Logger.info('App State:', response.app_state);
      // Logger.info('Session Data:', response.app_state?.sess);
      console.log('response:', response);

      // Check if the session data is present in the response
      if (response.app_state?.sess) {
        Logger.info('Session data:', response.app_state.sess);
        this.saveSession(response.app_state.sess);
      } else {
        Logger.error('Invalid server response: No session data');
      }
    } catch (error: any) {
      Logger.error('Error during login:', error.message);
    }
  }

  /**
   * Save session details to a file.
   */
  private saveSession(session: ISessResp | null): void {
    Logger.info(`session:${session}`);
    Logger.info(`sessionFilePath:${this.sessionFilePath}`);
    if (session) {
      // Update session in config
      config.cdSession = session;
    }

    // Save session to file
    fs.writeFileSync(this.sessionFilePath, JSON.stringify(session, null, 2));
    Logger.info('Session saved.');
    Logger.info(`sessionFilePath:${this.sessionFilePath}`);
  }

  /**
   * Log out by clearing the session.
   */
  logout(): void {
    if (fs.existsSync(this.sessionFilePath)) {
      fs.unlinkSync(this.sessionFilePath);
      Logger.info('Logged out successfully.');
    } else {
      Logger.info('No active session found.');
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
