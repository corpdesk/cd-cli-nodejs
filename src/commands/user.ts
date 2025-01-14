/* eslint-disable style/brace-style */
import fs from 'node:fs';
import https from 'node:https'; // Use `import` instead of `require`
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const axiosInstance = axios.create({
  baseURL: 'https://localhost:3001/api',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Ignore SSL errors
  }),
});

export class CdUser {
  //   private sessionFilePath = join(process.cwd(), 'session.json');
  private sessionFilePath = join(__dirname, 'session.json');

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
      console.log('Authenticating...');
      const response = await axiosInstance.post('/', payload);
      console.log('Response:', response.data);
    } catch (error: any) {
      console.error('Error during login:', error.message);
    }
  }

  /**
   * Save session details to a file.
   */
  private saveSession(session: any): void {
    fs.writeFileSync(this.sessionFilePath, JSON.stringify(session, null, 2));
    console.log('Session saved.');
  }

  /**
   * Log out by clearing the session.
   */
  logout(): void {
    if (existsSync(this.sessionFilePath)) {
      fs.unlinkSync(this.sessionFilePath);
      console.log('Logged out successfully.');
    } else {
      console.log('No active session found.');
    }
  }

  /**
   * Get the current session.
   */
  getSession(): any {
    if (existsSync(this.sessionFilePath)) {
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
