/* eslint-disable node/prefer-global/process */
/* eslint-disable style/operator-linebreak */
import type { ICdResponse } from '../../base/IBase';
import type { ProfileData } from '../models/cd-cli-profile.model';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
/* eslint-disable style/brace-style */
import inquirer from 'inquirer';
import config from '../../../../config';
import { logg, logger } from '../../cd-comm/controllers/cd-winston';
import { UserController } from '../../user/controllers/user.controller';
import {
  createProfilePromptData,
  PROFILE_FILE_STORE,
  sshProfileTemplate,
} from '../models/cd-cli-profile.model';
import { CdCliProfileService } from '../services/cd-cli-profile.service';

// const fsAccess = promisify(fs.access);

import fs from 'node:fs';
import { printTable } from '../../base/cli-table';
import Logger from '../../cd-comm/controllers/notifier.controller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDirectory =
  process.env.HOME || process.env.USERPROFILE || '/home/username'; // Fallback if HOME is undefined
const PROFILE_DIRECTORY = path.join(homeDirectory, '.cd-cli');
// import { Logger } from './logger'; // Adjust this import as per your project structure

// const PROFILE_FILE_STORE = './profile.json'; // Adjust the file path as necessary
// const TIMEOUT = 1000; // Timeout to wait for file to become available (in ms)

export class CdCliProfileController {
  svUser = new UserController();
  svCdCliProfile = new CdCliProfileService();
  // private profilesFilePath = path.join(__dirname, PROFILE_FILE_STORE);

  constructor() {}

  // async createProfile(
  //   profileFilePath: string,
  //   profileType: string,
  // ): Promise<void> {
  //   try {
  //     // Step 1: Ensure profile.json exists or trigger login process
  //     await this.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

  //     // Step 2: Read the profile template from the given file path (profileTemp.json)
  //     const profileTemplate = JSON.parse(
  //       fs.readFileSync(profileFilePath, 'utf-8'),
  //     );

  //     // Step 3: Prompt user for profile details based on the template (generic for any profile)
  //     const answers = await inquirer.prompt(
  //       createProfilePromptData(profileType),
  //     );

  //     // Step 4: Populate the profile template with user input
  //     const profileData: ProfileData = {
  //       ...profileTemplate,
  //       details: { ...profileTemplate.details, ...answers },
  //     };

  //     // Step 5: Prepare the payload to send to the API
  //     const cdToken = await this.svUser.getSession()?.cd_token;
  //     if (!cdToken) {
  //       Logger.error('Invalid session. Please log in again.');
  //       return;
  //     }

  //     const d = {
  //       data: {
  //         cdCliProfileName: answers.profileName,
  //         cdCliProfileDescription: answers.description,
  //         cdCliProfileData: profileData,
  //         cdCliProfileEnabled: true,
  //         cdCliProfileTypeId: profileTemplate.typeId,
  //         userId: 1010, // Adjust based on the session or logged in user
  //       },
  //     };

  //     // Step 6: Send the profile data to the API for profile creation
  //     // const response = await this.createCdCliProfile(payload, cdToken);
  //     const response: ICdResponse =
  //       await this.svCdCliProfile.createCdCliProfile(d, cdToken);
  //     if (response.app_state?.success) {
  //       Logger.success(
  //         `Profile '${answers.profileName}' created successfully.`,
  //       );
  //     } else {
  //       Logger.error(`Profile creation failed:${response.app_state?.info}`);
  //     }
  //   } catch (error) {
  //     Logger.error(`Error creating profile: ${(error as Error).message}`);
  //   }
  // }

  async createProfile(profileFilePath: string): Promise<void> {
    console.log(
      'CdCliProfileController::createProfile()/profileFilePath:',
      profileFilePath,
    );
    try {
      // Ensure profile.json exists or trigger login process
      await this.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

      // Step 1: Read the profile template from the given file path (profileTemp.json)
      const profileTemplate = JSON.parse(
        fs.readFileSync(profileFilePath, 'utf-8'),
      );
      const profileType = profileTemplate.type; // Get the profile type (ssh, api, etc.)

      // Step 2: Read sensitive details from the respective JSON file
      const detailsFilePath = path.join(
        PROFILE_DIRECTORY,
        `${profileType}.json`,
      );
      const profileDetails = this.loadProfileDetails(detailsFilePath);

      // Step 3: Prompt user for profile details based on the template (generic for any profile)
      const answers = await inquirer.prompt(
        createProfilePromptData(profileType),
      );

      // Step 4: Populate the profile template with user input and sensitive details
      const profileData: ProfileData = {
        ...profileTemplate,
        details: { ...profileTemplate.details, ...answers, ...profileDetails },
      };

      // Step 5: Prepare the payload to send to the API
      const cdToken = await this.svUser.getSession()?.cd_token;
      if (!cdToken) {
        Logger.error('Invalid session. Please log in again.');
        return;
      }

      const d = {
        data: {
          cdCliProfileName: answers.profileName,
          cdCliProfileDescription: answers.description,
          cdCliProfileData: profileData,
          cdCliProfileEnabled: true,
          cdCliProfileTypeId: profileTemplate.typeId,
          userId: 1010, // Adjust based on the session or logged in user
        },
      };

      // Step 6: Send the profile data to the API for profile creation
      const response: ICdResponse =
        await this.svCdCliProfile.createCdCliProfile(d, cdToken);
      if (response.app_state?.success) {
        Logger.success(
          `Profile '${answers.profileName}' created successfully.`,
        );
      } else {
        Logger.error(`Profile creation failed:${response.app_state?.info}`);
      }
    } catch (error) {
      Logger.error(`Error creating profile: ${(error as Error).message}`);
    }
  }

  private loadProfileDetails(filePath: string): any {
    try {
      if (!fs.existsSync(filePath)) {
        Logger.warning(`Profile details file not found: ${filePath}`);
        return {};
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      Logger.error(
        `Error reading profile details from file: ${(error as Error).message}`,
      );
      return {};
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
      // Logger.info('Response from backend:', response);

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
        // console.log('CdCliProfileController::checkProfileAndLogin()/02');
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
      console.error(
        `Error during profile check or login:${(error as Error).message}`,
      );
      Logger.error(
        `Error during profile check or login:${(error as Error).message}`,
      );
      throw error;
    }
  }

  // Method to list all profiles
  // Usage:
  // cd-cli profile list
  // Method to list all profiles in a table format
  async listProfiles(): Promise<void> {
    try {
      // Ensure profile.json exists or trigger login process
      const svCdCliProfile = new CdCliProfileController();
      await svCdCliProfile.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

      const profilesData = JSON.parse(
        fs.readFileSync(PROFILE_FILE_STORE, 'utf-8'),
      );

      if (profilesData.count === 0) {
        Logger.info('No profiles available.');
        return;
      }

      // Prepare rows for the table
      const rows = profilesData.items.map((profile: any) => [
        profile.cdCliProfileName, // Column 1: Profile Name
        profile.cdCliProfileDescription || 'No description provided', // Column 2: Description (with default value if missing)
      ]);

      // Call printTable to display the profiles in a formatted table
      printTable(['Profile Name', 'Description'], rows); // Table headers: Profile Name, Description
    } catch (error) {
      Logger.error(`Error listing profiles: ${(error as Error).message}`);
    }
  }

  // Method to remove a profile by name
  // Usage:
  // cd-cli remove <profile-name>
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
  // Usage:
  // cd-cli profile show <profile-name>
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
