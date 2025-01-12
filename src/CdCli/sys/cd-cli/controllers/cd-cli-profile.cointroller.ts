/* eslint-disable node/prefer-global/process */
/* eslint-disable style/operator-linebreak */
import type { ICdResponse } from '../../base/IBase';
import type {
  ProfileContainer,
  ProfileData,
  ProfileModel,
} from '../models/cd-cli-profile.model';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
/* eslint-disable style/brace-style */
import inquirer from 'inquirer';
// import config, { PROFILE_FILE_STORE } from '../../../../config';
import { logg, logger } from '../../cd-comm/controllers/cd-winston';
import { UserController } from '../../user/controllers/user.controller';
import {
  createProfilePromptData,
  sshProfileTemplate,
} from '../models/cd-cli-profile.model';
import { CdCliProfileService } from '../services/cd-cli-profile.service';

// const fsAccess = promisify(fs.access);

import fs from 'node:fs';
import { CONFIG_FILE_PATH } from '@/config';
import { printTable } from '../../base/cli-table';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDirectory =
  process.env.HOME || process.env.USERPROFILE || '/home/username'; // Fallback if HOME is undefined
const PROFILE_DIRECTORY = path.join(homeDirectory, '.cd-cli');
// import { CdLogg } from './logger'; // Adjust this import as per your project structure

// const PROFILE_FILE_STORE = './profile.json'; // Adjust the file path as necessary
// const TIMEOUT = 1000; // Timeout to wait for file to become available (in ms)

export class CdCliProfileController {
  svUser = new UserController();
  svCdCliProfile = new CdCliProfileService();
  // private profilesFilePath = path.join(__dirname, PROFILE_FILE_STORE);

  constructor() {}

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
        CdLogg.error('Invalid session. Please log in again.');
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
        CdLogg.success(
          `Profile '${answers.profileName}' created successfully.`,
        );
      } else {
        CdLogg.error(`Profile creation failed:${response.app_state?.info}`);
      }
    } catch (error) {
      CdLogg.error(`Error creating profile: ${(error as Error).message}`);
    }
  }

  private loadProfileDetails(filePath: string): any {
    try {
      if (!fs.existsSync(filePath)) {
        CdLogg.warning(`Profile details file not found: ${filePath}`);
        return {};
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      CdLogg.error(
        `Error reading profile details from file: ${(error as Error).message}`,
      );
      return {};
    }
  }

  async fetchAndSaveProfiles(cdToken: string): Promise<void> {
    CdLogg.debug('starting fetchAndSaveProfiles():', { token: cdToken });

    if (!cdToken) {
      CdLogg.error('No valid cdToken found. Cannot fetch profiles.');
      return;
    }

    // Prepare the query object to fetch profiles
    const q = {
      where: { userId: -1 }, // userId of -1 signals backend to use the cdToken to derive the userId
    };

    try {
      CdLogg.info('Fetching profiles from backend...');
      const response: ICdResponse = await this.svCdCliProfile.getCdCliProfile(
        q,
        cdToken,
      );

      if (response.app_state?.success) {
        // Fetch existing configuration or create a new structure
        let configData: any = {
          items: [],
          count: 0,
        };

        if (fs.existsSync(CONFIG_FILE_PATH)) {
          configData = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
        }

        // Overwrite the entire profiles section in the config file
        const profiles: ProfileContainer = response.data;

        if (!profiles || profiles.items.length === 0) {
          CdLogg.info('No profiles found. Writing empty profiles section.');
          configData.items = [];
          configData.count = 0;
        } else {
          CdLogg.info(`Fetched ${profiles.count} profiles.`);
          configData.items = profiles.items.map((profile: ProfileModel) => ({
            cdCliProfileName: profile.cdCliProfileName,
            cdCliProfileData: profile.cdCliProfileData,
            cdCliProfileTypeId: profile.cdCliProfileTypeId,
            cdCliProfileGuid: profile.cdCliProfileGuid,
            userId: profile.userId,
            cdCliProfileEnabled: profile.cdCliProfileEnabled,
          }));
          configData.count = profiles.count;
        }

        // Write the updated config data to cd-cli.config.json
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configData, null, 2));
        CdLogg.success(`Profiles saved successfully to ${CONFIG_FILE_PATH}`);
      } else {
        CdLogg.error(
          `Failed to fetch profiles: ${response.app_state?.info?.app_msg || 'Unknown error'}`,
        );
      }
    } catch (error: any) {
      CdLogg.error('Error fetching profiles:', error.message);
    }
  }

  // Check for profile existence and initiate login if necessary
  // async checkProfileAndLogin(): Promise<void> {
  //   try {
  //     const configFilePath = path.resolve('./cd-cli.config.json');
  //     if (!fs.existsSync(configFilePath)) {
  //       CdLogg.warning(
  //         'Configuration file not found. Initiating login process...',
  //       );

  //       const userController = new UserController();
  //       await userController.loginWithRetry();

  //       // Verify if profiles have been saved after login
  //       if (!fs.existsSync(configFilePath)) {
  //         throw new Error('Configuration file not found after login attempt.');
  //       }
  //     }

  //     const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
  //     if (
  //       !config.profiles ||
  //       !config.profiles.items ||
  //       config.profiles.items.length === 0
  //     ) {
  //       CdLogg.warning(
  //         'No profiles available in the configuration. Consider creating one.',
  //       );
  //     }
  //   } catch (error) {
  //     CdLogg.error(
  //       `Error during profile check or login: ${(error as Error).message}`,
  //     );
  //     throw error;
  //   }
  // }
  async checkProfileAndLogin(): Promise<void> {
    try {
      // Resolve the path to the configuration file
      const configFilePath = CONFIG_FILE_PATH; // Assuming this constant points to ~/.cd-cli/cd-cli.config.json

      // Step 1: Check if the configuration file exists
      if (!fs.existsSync(configFilePath)) {
        CdLogg.warning(
          'Configuration file not found. Initiating login process...',
        );

        const userController = new UserController();
        await userController.loginWithRetry();

        // Verify if the configuration file was created after login
        if (!fs.existsSync(configFilePath)) {
          throw new Error('Configuration file not found after login attempt.');
        }
      }

      // Step 2: Load and parse the configuration file
      const cdCliConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

      // Step 3: Validate profiles section
      if (
        !cdCliConfig.profiles ||
        !cdCliConfig.profiles.items ||
        cdCliConfig.profiles.items.length === 0
      ) {
        CdLogg.warning(
          'No profiles available in the configuration. Consider creating one.',
        );
        throw new Error('No profiles available in the configuration.');
      }

      // Step 4: Look for the "cd-api-local" profile
      const cdApiProfile = cdCliConfig.profiles.items.find(
        (profile: any) => profile.cdCliProfileName === 'cd-api-local',
      );

      if (!cdApiProfile || !cdApiProfile.cdCliProfileData) {
        throw new Error(
          'Profile "cd-api-local" is missing or invalid. Please log in to create the profile.',
        );
      }

      // Step 5: Check for a valid session token in the "cd-api-local" profile
      const session = cdApiProfile.cdCliProfileData.details?.session;
      if (
        !session ||
        !session.token ||
        new Date(session.expiry) <= new Date()
      ) {
        CdLogg.info(
          'Session token is missing or expired. Initiating login process...',
        );

        const userController = new UserController();
        await userController.loginWithRetry();

        // Re-check the profile after login
        const updatedConfig = JSON.parse(
          fs.readFileSync(configFilePath, 'utf-8'),
        );
        const updatedProfile = updatedConfig.profiles.items.find(
          (profile: any) => profile.cdCliProfileName === 'cd-api-local',
        );

        if (
          !updatedProfile ||
          !updatedProfile.cdCliProfileData?.details?.session
        ) {
          throw new Error(
            'Session token is still missing after login. Please check your login credentials.',
          );
        }

        CdLogg.success('Session token renewed successfully.');
      } else {
        CdLogg.info('Valid session token found. Proceeding...');
      }
    } catch (error) {
      CdLogg.error(
        `Error during profile check or login: ${(error as Error).message}`,
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
      await this.checkProfileAndLogin();

      const configFilePath = path.resolve('./cd-cli.config.json');
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      const profilesData = config.profiles;

      if (!profilesData || profilesData.count === 0) {
        CdLogg.info('No profiles available.');
        return;
      }

      const rows = profilesData.items.map((profile: any) => [
        profile.cdCliProfileName,
        profile.cdCliProfileDescription || 'No description provided',
      ]);

      printTable(['Profile Name', 'Description'], rows);
    } catch (error) {
      CdLogg.error(`Error listing profiles: ${(error as Error).message}`);
    }
  }

  // Method to remove a profile by name
  // Usage:
  // cd-cli remove <profile-name>
  async removeProfile(profileName: string): Promise<void> {
    try {
      const configFilePath = path.resolve('./cd-cli.config.json');
      if (!fs.existsSync(configFilePath)) {
        CdLogg.error('Configuration file not found.');
        return;
      }

      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      const profilesData = config.profiles;

      const profileIndex = profilesData.items.findIndex(
        (profile: any) => profile.cdCliProfileName === profileName,
      );

      if (profileIndex === -1) {
        CdLogg.error(`Profile '${profileName}' not found.`);
        return;
      }

      profilesData.items.splice(profileIndex, 1);
      profilesData.count--;

      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

      CdLogg.success(`Profile '${profileName}' removed successfully.`);
    } catch (error) {
      CdLogg.error(`Error removing profile: ${(error as Error).message}`);
    }
  }

  // Method to show profile details by name
  // Usage:
  // cd-cli profile show <profile-name>
  async showProfile(profileName: string): Promise<void> {
    try {
      const configFilePath = path.resolve('./cd-cli.config.json');
      if (!fs.existsSync(configFilePath)) {
        CdLogg.error('Configuration file not found.');
        return;
      }

      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      const profilesData = config.profiles;

      const profile = profilesData.items.find(
        (profile: any) => profile.cdCliProfileName === profileName,
      );

      if (!profile) {
        CdLogg.error(`Profile '${profileName}' not found.`);
        return;
      }

      CdLogg.info(`Details of profile '${profileName}':`);
      CdLogg.info(`- Name: ${profile.cdCliProfileName}`);
      CdLogg.info(
        `- Description: ${profile.cdCliProfileDescription || 'No description provided'}`,
      );
      CdLogg.info(
        `- SSH Key Path: ${profile.cdCliProfileData.details.sshKey || 'N/A'}`,
      );
      CdLogg.info(
        `- Remote User: ${profile.cdCliProfileData.details.remoteUser || 'N/A'}`,
      );
      CdLogg.info(
        `- Development Server: ${profile.cdCliProfileData.details.devServer || 'N/A'}`,
      );
      CdLogg.info(
        `- Directory on Server: ${profile.cdCliProfileData.details.cdApiDir || 'N/A'}`,
      );
    } catch (error) {
      CdLogg.error(`Error showing profile: ${(error as Error).message}`);
    }
  }
}
