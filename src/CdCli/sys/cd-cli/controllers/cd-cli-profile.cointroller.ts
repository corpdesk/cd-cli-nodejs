/* eslint-disable style/operator-linebreak */
import type { ICdResponse } from '../../base/IBase';
import { fileURLToPath } from 'node:url';
/* eslint-disable style/brace-style */
import inquirer from 'inquirer';
import config from '../../../../config';
import Logger from '../../cd-comm/controllers/notifier.controller';
import { UserController } from '../../user/controllers/user.controller';
import { CdCliProfileService } from '../services/cd-cli-profile.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CdCliProfileController {
  svUser = new UserController();
  svCdCliProfile = new CdCliProfileService();
  private profilesFilePath = path.join(__dirname, 'profile.json');

  constructor() {}

  async createSshProfile() {
    try {
      // Step 1: Check if session exists
      if (!this.svUser.getSession()) {
        Logger.warning('Session does not exist. Attempting to log in...');

        // If session doesn't exist, try logging in
        await this.loginWithRetry();

        // If session still does not exist after login attempt, stop further execution
        if (!this.svUser.getSession()) {
          Logger.error('Login failed. Exiting profile creation.');
          return;
        }
      }

      // Step 2: Prompt user for profile details
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'profileName',
          message: 'Enter profile name (e.g., devServer-ssh-profile):',
          default: 'devServer-ssh-profile',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Enter profile description:',
          default: 'SSH profile for development server connection',
        },
        {
          type: 'input',
          name: 'remoteServer',
          message:
            'Enter development server address (e.g., server.example.com):',
          default: '192.168.1.70',
        },
        {
          type: 'input',
          name: 'remoteUser',
          message: 'Enter remote SSH user (default: devops):',
          default: 'devops',
        },
        {
          type: 'input',
          name: 'sshKey',
          message: 'Enter path to your SSH key:',
          default: '~/path/to/sshKey',
        },
        {
          type: 'input',
          name: 'cdApiDir',
          message: 'Enter directory on the server (e.g., ~/cd-api):',
          default: '~/cd-api',
        },
      ]);

      // Step 3: Prepare the profile data
      const profileData = {
        owner: {
          userId: 1010, // Example user ID, could be dynamic based on the logged-in user
          groupId: 0, // Group ID, like "_public"
        },
        permissions: {
          userPermissions: [
            {
              userId: 1000, // Permissions for a user
              field: 'sshKey',
              hidden: false,
              read: true,
              write: true,
              execute: false,
            },
          ],
          groupPermissions: [
            {
              groupId: 0, // Public group
              field: 'sshKey',
              hidden: false,
              read: true,
              write: false,
              execute: false,
            },
          ],
        },
        details: {
          sshKey: answers.sshKey,
          remoteUser: answers.remoteUser,
          devServer: answers.remoteServer,
          cdApiDir: answers.cdApiDir,
        },
      };

      // Step 4: Prepare the payload to send to cd-api
      const cdToken = await this.svUser.getSession()?.cd_token;
      Logger.info(`cdToken:${cdToken}`);
      // const cdEnvelope = {
      //   ctx: 'Sys',
      //   m: 'Moduleman',
      //   c: 'CdCliProfile',
      //   a: 'Create',
      //   dat: {
      //     f_vals: [
      //       {
      //         data: {
      //           cdCliProfileName: answers.profileName,
      //           cdCliProfileDescription: answers.description,
      //           cdCliProfileData: profileData,
      //           cdCliProfileEnabled: true,
      //           cdCliProfileTypeId: 2, // Represent SSH profile type
      //           userId: 1010,
      //         },
      //       },
      //     ],
      //     token: cdToken, // Ensure the session token is available
      //   },
      //   args: null,
      // };
      const d = {
        data: {
          cdCliProfileName: answers.profileName,
          cdCliProfileDescription: answers.description,
          cdCliProfileData: profileData,
          cdCliProfileEnabled: true,
          cdCliProfileTypeId: 2, // Represent SSH profile type
          userId: 1010,
        },
      };

      // Step 5: Send the profile data to cd-api

      if (cdToken) {
        const response: ICdResponse =
          await this.svCdCliProfile.createCdCliProfile(d, cdToken);

        // Check if the profile creation is successful
        if (response.app_state?.success) {
          if (response.app_state?.sess) {
            Logger.info('response:', response);
            Logger.success(
              `Profile '${answers.profileName}' created successfully.`,
            );
          }
        } else {
          // If not successful, log an error and stop the process
          Logger.error('response:', response);
          Logger.error(
            'Creation of profile failed:',
            response.app_state?.info || { error: 'Unknown error' },
          );
          throw new Error('Profile creation failed.');
        }
      } else {
        Logger.error(
          `Invalid Session. Profile '${answers.profileName}' could not be created.`,
        );
      }
    } catch (error) {
      Logger.error(`Error creating SSH profile: ${(error as Error).message}`);
    }
  }

  // Login wizard method with retry attempts
  async loginWithRetry() {
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;
        Logger.info(`Attempt ${attempts} of 3: Please log in.`);

        // Prompt for username
        const usernameAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'userName',
            message: 'Enter your username:',
          },
        ]);

        // Call auth method from UserController to handle login
        await this.svUser.auth(usernameAnswer.userName, '');

        // Check if login was successful by verifying session
        if (this.svUser.getSession()) {
          Logger.success('Login successful!');
          return; // Exit login retry loop if successful
        } else {
          Logger.error('Login failed. Please try again.');
        }
      } catch (error: any) {
        Logger.error('Error during login attempt:', error.message);
      }

      // If the user exceeds 3 attempts, exit with an error message
      if (attempts >= 3) {
        Logger.error('Too many failed login attempts. Exiting.');
        break;
      }
    }
  }

  /**
   * Fetch profiles after successful login and save them to profiles.json
   */
  async fetchAndSaveProfiles(cdToken: string): Promise<void> {
    if (!cdToken) {
      Logger.error('No valid cdToken found. Cannot fetch profiles.');
      return;
    }

    // Prepare the query object to fetch profiles
    const q = {
      where: { userId: -1 }, // userId of -1 signals backend to use the cdToken to derive the userId
    };

    try {
      Logger.info('Fetching profiles from backend...');
      const response: ICdResponse = await this.svCdCliProfile.getCdCliProfile(
        q,
        cdToken,
      );
      Logger.info('Response from backend:', response);

      // Check if the response indicates success
      if (response.app_state?.success) {
        // Assuming profiles are available in the response data
        const profiles = response.data;

        // Save profiles to profiles.json
        // const profilesFilePath = './profiles.json'; // Path to store the profiles
        fs.writeFileSync(
          this.profilesFilePath,
          JSON.stringify(profiles, null, 2),
        );

        Logger.success(
          `Profiles saved successfully to ${this.profilesFilePath}.`,
        );
      } else {
        Logger.error(
          `Failed to fetch profiles:${response.app_state?.info?.app_msg || 'Unknown error'}`,
        );
      }
    } catch (error: any) {
      Logger.error('Error fetching profiles:', error.message);
    }
  }
}
