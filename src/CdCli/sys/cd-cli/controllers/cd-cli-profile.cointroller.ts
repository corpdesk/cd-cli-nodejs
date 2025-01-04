/* eslint-disable style/operator-linebreak */
import type { ICdResponse } from '../../base/IBase';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
/* eslint-disable style/brace-style */
import inquirer from 'inquirer';
import config from '../../../../config';
import Logger from '../../cd-comm/controllers/notifier.controller';
import { UserController } from '../../user/controllers/user.controller';
import {
  CreateSshProfilePromptData,
  PROFILE_FILE_STORE,
} from '../models/cd-cli-profile.model';
import { CdCliProfileService } from '../services/cd-cli-profile.service';

// const fsAccess = promisify(fs.access);

import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import { Logger } from './logger'; // Adjust this import as per your project structure

// const PROFILE_FILE_STORE = './profile.json'; // Adjust the file path as necessary
// const TIMEOUT = 1000; // Timeout to wait for file to become available (in ms)

export class CdCliProfileController {
  svUser = new UserController();
  svCdCliProfile = new CdCliProfileService();
  // private profilesFilePath = path.join(__dirname, PROFILE_FILE_STORE);

  constructor() {}

  async createSshProfile() {
    try {
      // Step 1: Ensure profile.json exists or trigger login process
      const svCdCliProfile = new CdCliProfileController();
      await svCdCliProfile.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

      // Step 2: Check if session exists
      if (!this.svUser.getSession()) {
        Logger.warning('Session does not exist. Attempting to log in...');
        await this.svUser.loginWithRetry();

        if (!this.svUser.getSession()) {
          Logger.error('Login failed. Exiting profile creation.');
          return;
        }
      }

      // Step 3: Prompt user for profile details
      const answers = await inquirer.prompt(CreateSshProfilePromptData);

      // Step 4: Prepare the profile data
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

      // Step 5: Prepare the payload to send to cd-api
      const cdToken = await this.svUser.getSession()?.cd_token;
      Logger.info(`cdToken:${cdToken}`);

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

      // Step 6: Send the profile data to cd-api
      if (cdToken) {
        const response: ICdResponse =
          await this.svCdCliProfile.createCdCliProfile(d, cdToken);

        // Check if the profile creation is successful
        if (response.app_state?.success) {
          Logger.info('response:', response);
          Logger.success(
            `Profile '${answers.profileName}' created successfully.`,
          );
        } else {
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
        // Check if profiles are returned in the response data
        const profiles = response.data;

        // If no profiles exist, create the default empty profile structure
        if (!profiles || profiles.items.length === 0) {
          const emptyProfileData = {
            items: [],
            count: 0,
          };

          // Write the default empty profile structure to profile.json
          fs.writeFileSync(
            PROFILE_FILE_STORE,
            JSON.stringify(emptyProfileData, null, 2),
          );
          Logger.info(
            `No profiles found. Created empty profile file: ${PROFILE_FILE_STORE}`,
          );
        } else {
          // If profiles exist, save them to profile.json
          fs.writeFileSync(
            PROFILE_FILE_STORE,
            JSON.stringify(profiles, null, 2),
          );
          Logger.success(
            `Profiles saved successfully to ${PROFILE_FILE_STORE}.`,
          );
        }
      } else {
        Logger.error(
          `Failed to fetch profiles: ${response.app_state?.info?.app_msg || 'Unknown error'}`,
        );
      }
    } catch (error: any) {
      Logger.error('Error fetching profiles:', error.message);
    }
  }

  // Check for profile existence and initiate login if necessary
  async checkProfileAndLogin() {
    try {
      console.log('CdCliProfileController::checkProfileAndLogin()/01');
      // Check if profile.json exists
      if (!fs.existsSync(PROFILE_FILE_STORE)) {
        console.log('CdCliProfileController::checkProfileAndLogin()/02');
        Logger.warning('Profile file not found. Initiating login process...');

        const userController = new UserController();
        await userController.loginWithRetry();
        console.log('CdCliProfileController::checkProfileAndLogin()/03');
        // After successful login, check again for profile.json
        if (!fs.existsSync(PROFILE_FILE_STORE)) {
          console.log('CdCliProfileController::checkProfileAndLogin()/04');
          throw new Error('Profile file not found after login attempt.');
        }
      }
    } catch (error) {
      console.log('CdCliProfileController::checkProfileAndLogin()/05');
      Logger.error(
        `Error during profile check or login:${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Method to list all profiles
  async listProfiles(): Promise<void> {
    try {
      if (!fs.existsSync(PROFILE_FILE_STORE)) {
        Logger.error('Profile file not found.');
        return;
      }

      const profilesData = JSON.parse(
        fs.readFileSync(PROFILE_FILE_STORE, 'utf-8'),
      );

      if (profilesData.count === 0) {
        Logger.info('No profiles available.');
        return;
      }

      Logger.info('List of available profiles:');
      profilesData.items.forEach((profile: any) => {
        Logger.info(`- ${profile.cdCliProfileName}`);
      });
    } catch (error) {
      Logger.error(`Error listing profiles: ${(error as Error).message}`);
    }
  }

  // Method to remove a profile by name
  async removeProfile(profileName: string): Promise<void> {
    try {
      if (!fs.existsSync(PROFILE_FILE_STORE)) {
        Logger.error('Profile file not found.');
        return;
      }

      const profilesData = JSON.parse(
        fs.readFileSync(PROFILE_FILE_STORE, 'utf-8'),
      );

      const profileIndex = profilesData.items.findIndex(
        (profile: any) => profile.cdCliProfileName === profileName,
      );

      if (profileIndex === -1) {
        Logger.error(`Profile '${profileName}' not found.`);
        return;
      }

      // Remove the profile from the list
      profilesData.items.splice(profileIndex, 1);
      profilesData.count--;

      // Save the updated profiles data
      fs.writeFileSync(
        PROFILE_FILE_STORE,
        JSON.stringify(profilesData, null, 2),
      );

      Logger.success(`Profile '${profileName}' removed successfully.`);
    } catch (error) {
      Logger.error(`Error removing profile: ${(error as Error).message}`);
    }
  }

  // Method to show profile details by name
  async showProfile(profileName: string): Promise<void> {
    try {
      if (!fs.existsSync(PROFILE_FILE_STORE)) {
        Logger.error('Profile file not found.');
        return;
      }

      const profilesData = JSON.parse(
        fs.readFileSync(PROFILE_FILE_STORE, 'utf-8'),
      );

      const profile = profilesData.items.find(
        (profile: any) => profile.cdCliProfileName === profileName,
      );

      if (!profile) {
        Logger.error(`Profile '${profileName}' not found.`);
        return;
      }

      Logger.info(`Details of profile '${profileName}':`);
      Logger.info(`- Name: ${profile.cdCliProfileName}`);
      Logger.info(
        `- Description: ${profile.cdCliProfileData.details.description}`,
      );
      Logger.info(`- SSH Key Path: ${profile.cdCliProfileData.details.sshKey}`);
      Logger.info(
        `- Remote User: ${profile.cdCliProfileData.details.remoteUser}`,
      );
      Logger.info(
        `- Development Server: ${profile.cdCliProfileData.details.devServer}`,
      );
      Logger.info(
        `- Directory on Server: ${profile.cdCliProfileData.details.cdApiDir}`,
      );
    } catch (error) {
      Logger.error(`Error showing profile: ${(error as Error).message}`);
    }
  }
}
