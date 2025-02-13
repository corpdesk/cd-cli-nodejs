/* eslint-disable antfu/if-newline */
/* eslint-disable node/prefer-global/process */
/* eslint-disable style/operator-linebreak */
import type {
  CdFxReturn,
  ICdResponse,
  IJsonUpdate,
  IQuery,
} from '../../base/IBase';
import type {
  ProfileContainer,
  ProfileData,
  ProfileModel,
} from '../models/cd-cli-profile.model';
import { fileURLToPath } from 'node:url';
/* eslint-disable style/brace-style */
import inquirer from 'inquirer';
// import config, { PROFILE_FILE_STORE } from '../../../../config';
import { UserController } from '../../user/controllers/user.controller';
import { createProfilePromptData } from '../models/cd-cli-profile.model';
import { CdCliProfileService } from '../services/cd-cli-profile.service';

// const fsAccess = promisify(fs.access);

import type { CdVault } from '../models/cd-cli-vault.model';
import fs, { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import config, { CONFIG_FILE_PATH } from '@/config';
import { printTable } from '../../base/cli-table';
import { HttpService } from '../../base/http.service';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { SessonController } from '../../user/controllers/session.controller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDirectory =
  process.env.HOME || process.env.USERPROFILE || '/home/username'; // Fallback if HOME is undefined
const PROFILE_DIRECTORY = join(homeDirectory, '.cd-cli');
// import { CdLogg } from './logger'; // Adjust this import as per your project structure

// const PROFILE_FILE_STORE = './profile.json'; // Adjust the file path as necessary
// const TIMEOUT = 1000; // Timeout to wait for file to become available (in ms)

export class CdCliProfileController {
  svUser = new UserController();
  ctlSession = new SessonController();
  svCdCliProfile = new CdCliProfileService();
  private profiles: ProfileContainer;
  // private profilesFilePath = join(__dirname, PROFILE_FILE_STORE);

  // constructor() {
  //   this.profiles = this.loadProfiles();
  // }
  constructor() {
    this.profiles = {} as ProfileContainer; // Initialize with an empty object
    this.initializeProfiles().then((result) => {
      if (!result.state) {
        CdLogg.error(`Profile initialization failed: ${result.message}`);
      }
    });
  }

  private async initializeProfiles(): Promise<CdFxReturn<void>> {
    try {
      const profileResult = await this.loadProfiles();

      if (!profileResult.state || !profileResult.data) {
        const message = `Failed to load profiles: ${profileResult.message}`;
        CdLogg.error(message);
        return { data: null, state: false, message };
      }

      this.profiles = profileResult.data;
      CdLogg.debug('Profiles loaded successfully:', this.profiles);

      return {
        data: null,
        state: true,
        message: 'Profiles initialized successfully',
      };
    } catch (error) {
      const errorMessage = `Error initializing profiles: ${(error as Error).message}`;
      CdLogg.error(errorMessage);
      return { data: null, state: false, message: errorMessage };
    }
  }

  async createProfile(profileFilePath: string): Promise<void> {
    CdLogg.debug(
      `CdCliProfileController::createProfile()/profileFilePath:${profileFilePath}`,
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
      const detailsFilePath = join(PROFILE_DIRECTORY, `${profileType}.json`);
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
      const cdToken = await this.ctlSession.getSession(config.cdApiLocal)
        ?.cd_token;
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

  // loadProfiles(): any {
  //   CdLogg.debug('starting loadProfiles()');
  //   try {
  //     if (!existsSync(CONFIG_FILE_PATH)) {
  //       throw new Error(`Configuration file not found at ${CONFIG_FILE_PATH}.`);
  //     }

  //     const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
  //     return JSON.parse(configContent);
  //   } catch (error) {
  //     throw new Error(
  //       `Error loading configuration: ${(error as Error).message}`,
  //     );
  //   }
  // }

  async loadProfiles(): Promise<CdFxReturn<ProfileContainer>> {
    CdLogg.debug('starting loadCdCliConfig()');

    try {
      // Ensure profile check and login before loading config
      const profileCheck = await this.checkProfileAndLogin();
      if (!profileCheck.state) {
        return {
          data: null,
          state: false,
          message: `Profile check failed: ${profileCheck.message}`,
        };
      }

      // Check if configuration file exists
      if (!existsSync(CONFIG_FILE_PATH)) {
        return {
          data: null,
          state: false,
          message: `Configuration file not found at ${CONFIG_FILE_PATH}.`,
        };
      }

      // Load and parse the configuration file
      const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsedConfig = JSON.parse(configContent);

      return {
        data: parsedConfig,
        state: true,
        message: 'Configuration loaded successfully.',
      };
    } catch (error) {
      CdLogg.error(`Error loading configuration: ${(error as Error).message}`);
      return {
        data: null,
        state: false,
        message: `Error loading configuration: ${(error as Error).message}`,
      };
    }
  }

  private loadProfileDetails(filePath: string): any {
    try {
      if (!existsSync(filePath)) {
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

        if (existsSync(CONFIG_FILE_PATH)) {
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

        // Write the updated config data to cd-cli.profiles.json
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

  // async checkProfileAndLogin(): Promise<void> {
  //   try {
  //     // Resolve the path to the configuration file
  //     const configFilePath = CONFIG_FILE_PATH; // Assuming this constant points to ~/.cd-cli/cd-cli.profiles.json

  //     // Step 1: Check if the configuration file exists
  //     if (!existsSync(configFilePath)) {
  //       CdLogg.warning(
  //         'Configuration file not found. Initiating login process...',
  //       );

  //       const userController = new UserController();
  //       await userController.loginWithRetry();

  //       // Verify if the configuration file was created after login
  //       if (!existsSync(configFilePath)) {
  //         throw new Error('Configuration file not found after login attempt.');
  //       }
  //     }

  //     // Step 2: Load and parse the configuration file
  //     const cdCliConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

  //     // Step 3: Validate profiles section
  //     if (
  //       !cdCliConfig.profiles ||
  //       !cdCliConfig.profiles.items ||
  //       cdCliConfig.profiles.items.length === 0
  //     ) {
  //       CdLogg.warning(
  //         'No profiles available in the configuration. Consider creating one.',
  //       );
  //       throw new Error('No profiles available in the configuration.');
  //     }

  //     // Step 4: Look for the "cd-api-local" profile
  //     const cdApiProfile = cdCliConfig.profiles.items.find(
  //       (profile: any) => profile.cdCliProfileName === config.cdApiLocal,
  //     );

  //     if (!cdApiProfile || !cdApiProfile.cdCliProfileData) {
  //       throw new Error(
  //         'Profile "cd-api-local" is missing or invalid. Please log in to create the profile.',
  //       );
  //     }

  //     // Step 5: Check for a valid session token in the "cd-api-local" profile
  //     const session = cdApiProfile.cdCliProfileData.details?.session;
  //     if (
  //       !session ||
  //       !session.token ||
  //       new Date(session.expiry) <= new Date()
  //     ) {
  //       CdLogg.info(
  //         'Session token is missing or expired. Initiating login process...',
  //       );

  //       const userController = new UserController();
  //       await userController.loginWithRetry();

  //       // Re-check the profile after login
  //       const updatedConfig = JSON.parse(
  //         fs.readFileSync(configFilePath, 'utf-8'),
  //       );
  //       const updatedProfile = updatedConfig.profiles.items.find(
  //         (profile: any) => profile.cdCliProfileName === config.cdApiLocal,
  //       );

  //       if (
  //         !updatedProfile ||
  //         !updatedProfile.cdCliProfileData?.details?.session
  //       ) {
  //         throw new Error(
  //           'Session token is still missing after login. Please check your login credentials.',
  //         );
  //       }

  //       CdLogg.success('Session token renewed successfully.');
  //     } else {
  //       CdLogg.info('Valid session token found. Proceeding...');
  //     }
  //   } catch (error) {
  //     CdLogg.error(
  //       `Error during profile check or login: ${(error as Error).message}`,
  //     );
  //     throw error;
  //   }
  // }
  async checkProfileAndLogin(): Promise<CdFxReturn<void>> {
    try {
      // Resolve the path to the configuration file
      const configFilePath = CONFIG_FILE_PATH; // Assuming this constant points to ~/.cd-cli/cd-cli.profiles.json

      // Step 1: Check if the configuration file exists
      if (!existsSync(configFilePath)) {
        CdLogg.warning(
          'Configuration file not found. Initiating login process...',
        );

        const userController = new UserController();
        await userController.loginWithRetry();

        // Verify if the configuration file was created after login
        if (!existsSync(configFilePath)) {
          return {
            data: null,
            state: false,
            message: 'Configuration file not found after login attempt.',
          };
        }
      }

      // Step 2: Load and parse the configuration file
      const cdCliConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

      // Step 3: Validate profiles section
      if (
        !cdCliConfig.profiles?.items ||
        cdCliConfig.profiles.items.length === 0
      ) {
        CdLogg.warning(
          'No profiles available in the configuration. Consider creating one.',
        );
        return {
          data: null,
          state: false,
          message: 'No profiles available in the configuration.',
        };
      }

      // Step 4: Look for the "cd-api-local" profile
      const cdApiProfile = cdCliConfig.profiles.items.find(
        (profile: any) => profile.cdCliProfileName === config.cdApiLocal,
      );

      if (!cdApiProfile || !cdApiProfile.cdCliProfileData) {
        return {
          data: null,
          state: false,
          message:
            'Profile "cd-api-local" is missing or invalid. Please log in to create the profile.',
        };
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
          (profile: any) => profile.cdCliProfileName === config.cdApiLocal,
        );

        if (
          !updatedProfile ||
          !updatedProfile.cdCliProfileData?.details?.session
        ) {
          return {
            data: null,
            state: false,
            message:
              'Session token is still missing after login. Please check your login credentials.',
          };
        }

        CdLogg.success('Session token renewed successfully.');
      } else {
        CdLogg.info('Valid session token found. Proceeding...');
      }

      return { data: null, state: true, message: 'Profile check successful.' };
    } catch (error) {
      CdLogg.error(
        `Error during profile check or login: ${(error as Error).message}`,
      );
      return {
        data: null,
        state: false,
        message: `Error during profile check or login: ${(error as Error).message}`,
      };
    }
  }

  // Method to list all profiles
  // Usage:
  // cd-cli profile list
  // Method to list all profiles in a table format
  async listProfiles(): Promise<void> {
    try {
      await this.checkProfileAndLogin();

      // const configFilePath = path.resolve('./cd-cli.profiles.json');
      // const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      // const profilesData = config.profiles;

      const profilesData = this.profiles;

      if (!profilesData || profilesData.items.length === 0) {
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
      const configFilePath = path.resolve('./cd-cli.profiles.json');
      if (!existsSync(configFilePath)) {
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
      const configFilePath = path.resolve('./cd-cli.profiles.json');
      if (!existsSync(configFilePath)) {
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

  async saveCdCliProfileLocal(
    profile: ProfileModel,
    profileName: string | null = null,
    profileId: number | null = null,
  ): Promise<boolean> {
    try {
      // Load existing configuration
      let config: ProfileContainer = { items: [], count: 0 };

      if (existsSync(CONFIG_FILE_PATH)) {
        const configFileContent = readFileSync(CONFIG_FILE_PATH, 'utf-8');
        config = JSON.parse(configFileContent) as ProfileContainer;
      }

      // Locate the profile if name or id is provided
      const existingProfileIndex = config.items.findIndex((item) => {
        if (profileId !== null) return item.cdCliProfileId === profileId;
        if (profileName !== null) return item.cdCliProfileName === profileName;
        return false;
      });

      // Update the profile if it exists, else add it
      if (existingProfileIndex !== -1) {
        config.items[existingProfileIndex] = profile;
        CdLogg.info(`Updated existing profile: ${profileName || profileId}`);
      } else {
        config.items.push(profile);
        CdLogg.info(
          `Added new profile: ${profileName || profile.cdCliProfileId}`,
        );
      }

      // Update the count
      config.count = config.items.length;

      // Save the updated configuration back to the file
      writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');

      CdLogg.success('Profile successfully saved to local configuration.');
      return true;
    } catch (error) {
      CdLogg.error(`Failed to save profile: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get a profile by its name.
   * @param profileName The name of the profile to fetch.
   * @returns The ProfileModel if found, otherwise throws an error.
   */
  // async getProfileByName(profileName: string): Promise<ProfileModel> {
  //   const profile = this.profiles.items.find(
  //     (item) => item.cdCliProfileName === profileName,
  //   );

  //   if (!profile) {
  //     throw new Error(`Profile '${profileName}' not found.`);
  //   }

  //   return profile;
  // }
  async getProfileByName(
    profileName: string,
  ): Promise<CdFxReturn<ProfileModel>> {
    try {
      // Validate that profiles exist
      if (
        !this.profiles ||
        !this.profiles.items ||
        this.profiles.items.length === 0
      ) {
        return {
          data: null,
          state: false,
          message: 'No profiles available. Please log in to create a profile.',
        };
      }

      // Find the profile by name
      const profile = this.profiles.items.find(
        (item) => item.cdCliProfileName === profileName,
      );

      if (!profile) {
        return {
          data: null,
          state: false,
          message: `Profile '${profileName}' not found. Please check the name or log in.`,
        };
      }

      return {
        data: profile,
        state: true,
        message: `Profile '${profileName}' retrieved successfully.`,
      };
    } catch (error) {
      CdLogg.error(`getProfileByName() failed: ${(error as Error).message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving profile: ${(error as Error).message}`,
      };
    }
  }

  /**
  //  * Extracts the session token from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The session token if found, otherwise null.
  //
   */
  // async getSessionData(): Promise<string | null> {
  //   CdLogg.debug('CdCliProfileController::getSessionData()/starting...');
  //   // get cd-api profile
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return this.extractVaultValue(profile, 'cd_token');
  // }

  // /**
  //  * Extracts the consumer token from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The consumer token if found, otherwise null.
  //  */
  // async getConsumerToken(): Promise<string | null> {
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return this.extractVaultValue(profile, 'consumerToken');
  // }
  async getSessionData(): Promise<CdFxReturn<string>> {
    CdLogg.debug('CdCliProfileController::getSessionData()/starting...');

    const profileResult = await this.getProfileByName(config.cdApiLocal);
    if (!profileResult.state || !profileResult.data) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve profile for session data: ${profileResult.message}`,
      };
    }

    return this.extractVaultValue(profileResult.data, 'cd_token');
  }

  async getConsumerToken(): Promise<CdFxReturn<string>> {
    const profileResult = await this.getProfileByName(config.cdApiLocal);
    if (!profileResult.state || !profileResult.data) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve profile for consumer token: ${profileResult.message}`,
      };
    }

    return this.extractVaultValue(profileResult.data, 'consumerToken');
  }

  // /**
  //  * Extracts the API endpoint from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The API endpoint if available.
  //  */
  // async getEndPoint(): Promise<string | null> {
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return profile.cdCliProfileData?.details?.cdEndpoint || null;
  // }

  // /**
  //  * Extracts user permissions from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The user permissions object if found.
  //  */
  // async getUserPermissions() {
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return (
  //     profile.cdCliProfileData?.details?.permissions?.userPermissions || []
  //   );
  // }

  async getEndPoint(): Promise<CdFxReturn<string>> {
    const profileResult = await this.getProfileByName(config.cdApiLocal);

    if (!profileResult.state || !profileResult.data) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve profile for endpoint: ${profileResult.message}`,
      };
    }

    const endpoint =
      profileResult.data.cdCliProfileData?.details?.cdEndpoint || null;

    return {
      data: endpoint,
      state: endpoint !== null,
      message: endpoint
        ? 'Endpoint retrieved successfully.'
        : 'Endpoint not found in profile.',
    };
  }

  async getUserPermissions(): Promise<CdFxReturn<string[]>> {
    const profileResult = await this.getProfileByName(config.cdApiLocal);

    if (!profileResult.state || !profileResult.data) {
      return {
        data: [],
        state: false,
        message: `Failed to retrieve profile for user permissions: ${profileResult.message}`,
      };
    }

    const userPermissions =
      profileResult.data.cdCliProfileData?.details?.permissions
        ?.userPermissions || [];

    return {
      data: userPermissions,
      state: true,
      message: 'User permissions retrieved successfully.',
    };
  }

  // /**
  //  * Helper method to extract a value from cdVault by name.
  //  * @param profile The profile model.
  //  * @param key The key to extract.
  //  * @returns The corresponding value if found, otherwise null.
  //  */
  // private extractVaultValue(profile: ProfileModel, key: string): string | null {
  //   const vaultItem = profile.cdCliProfileData?.cdVault.find(
  //     (item: CdVault) => item.name === key,
  //   );
  //   return vaultItem ? vaultItem.value : null;
  // }
  private extractVaultValue(
    profile: ProfileModel,
    key: string,
  ): CdFxReturn<string> {
    if (!profile.cdCliProfileData?.cdVault) {
      return {
        data: null,
        state: false,
        message: 'Vault data is missing in the profile.',
      };
    }

    const vaultItem = profile.cdCliProfileData.cdVault.find(
      (item: CdVault) => item.name === key,
    );

    if (!vaultItem) {
      return {
        data: null,
        state: false,
        message: `Key '${key}' not found in the profile vault.`,
      };
    }

    return {
      data: vaultItem.value,
      state: true,
      message: `Successfully retrieved value for key '${key}'.`,
    };
  }
}
