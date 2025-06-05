import { BaseService } from '@/CdCli/sys/base/base.service';
/* eslint-disable antfu/if-newline */
import type {
  CdFxReturn,
  ICdResponse,
  IJsonUpdate,
  IQuery,
} from '@/CdCli/sys/base/IBase';
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-rename */
import type {
  IProfileDetails,
  ProfileContainer,
  ProfileData,
  ProfileModel,
} from '@/CdCli/sys/cd-cli/models/cd-cli-profile.model';
import type {
  CdVault,
  ENCRYPTION_CONFIGS,
  EncryptionMeta,
} from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
import type { GitAccess } from '../models/cd-auto-git.model';
import { exec } from 'node:child_process';
import util, { promisify } from 'node:util';
import { HttpService } from '@/CdCli/sys/base/http.service';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
import config from '@/config';

import axios from 'axios';
import inquirer from 'inquirer';
import { GitHubRepoCreatePromptData } from '../models/cd-auto-git.model';
import { DocModel } from '@/CdCli/sys/moduleman/models/doc.model';

const execAsync = util.promisify(exec);

const execPromise = promisify(exec);

export class CdAutoGitController {
  // b: BaseService = new BaseService();
  private b = new BaseService<DocModel>();

  cdToken = '';
  // ctlSession = new SessonController();
  // ctlCdCliProfile = new CdCliProfileController();
  svCdCliProfile = new CdCliProfileService();

  constructor() {
    this.init();
  }

  async init() {
    const ctlSession = new SessonController();
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.loadProfiles();
    if (!profileRet.state) {
      CdLog.error(`Failed to load profiles: ${profileRet.message}`);
      return null; // Handle the failure case properly
    }

    const r = await ctlSession.getSession(config.cdApiLocal);
    if (r && r.cd_token) {
      this.cdToken = r.cd_token;
      CdLog.info('cdToken has been set');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  async getGitHubProfile(): Promise<ProfileData | null> {
    CdLog.debug('starting getGitHubProfile()');
    const ctlCdCliProfile = new CdCliProfileController();
    const ret = await ctlCdCliProfile.loadProfiles();
    if (!ret.state || !ret.data) {
      CdLog.debug('could not load profiles');
      return null;
    }

    const cdCliProfile: ProfileContainer = ret.data;
    CdLog.debug(
      'CdAutoGitController::getGitHubProfile()/cdCliProfile:',
      cdCliProfile,
    );

    const gitProfile = cdCliProfile.items.find(
      (item: ProfileModel) => item.cdCliProfileName === config.cdGitConfig,
    );

    CdLog.debug(
      'CdAutoGitController::getGitHubProfile()/gitProfile:',
      gitProfile,
    );

    if (
      !gitProfile ||
      !gitProfile.cdCliProfileData ||
      !gitProfile.cdCliProfileData.details
    ) {
      CdLog.error('GitHub profile not found in configuration.');
      return null;
    }

    const gitProfileData: ProfileData = gitProfile.cdCliProfileData;
    if (!gitProfileData) {
      CdLog.error('GitHub access details are missing in the profile.');
      return null;
    }

    CdLog.debug(
      'CdAutoGitController::getGitHubProfile()/gitProfileData:',
      gitProfileData,
    );

    // Handle decryption for the access token using cdVault
    const vaultItem = gitProfile.cdCliProfileData?.cdVault.find(
      (vault) => vault.name === 'gitHubToken',
    );

    if (!vaultItem) {
      throw new Error('Vault item "gitHubToken" not found.');
    }

    CdLog.debug(
      'CdAutoGitController::getGitHubProfile()/vaultItem:',
      vaultItem,
    );

    if (!vaultItem) {
      CdLog.error('Vault entry for GitHub token is missing.');
      await this.handleMissingToken(); // Prompt the user to set the token
      return null;
    }

    if (vaultItem.isEncrypted) {
      const { encryptedValue, encryptionMeta } = vaultItem;

      CdLog.debug('CdAutoGitController::getGitHubProfile()/encryptedValue:', {
        e: encryptedValue,
      });
      CdLog.debug(
        'CdAutoGitController::getGitHubProfile()/encryptionMeta:',
        encryptionMeta,
      );

      if (!encryptedValue || !encryptionMeta || !encryptionMeta.iv) {
        CdLog.warning(
          'Missing encryption metadata or value for GitHub token. Prompting the user for setup...',
        );
        await this.handleMissingToken(); // Prompt the user to set the token
        return null;
      }

      try {
        // Attempt decryption
        const decryptedToken = await CdCliVaultController.decrypt(
          encryptionMeta as EncryptionMeta & { iv: string },
          encryptedValue,
        );

        if (!decryptedToken) {
          CdLog.warning(
            'Decryption failed. Provide a valid github access token.',
          );
          await this.handleMissingToken(); // Prompt the user to set the token
          return null;
        }

        if (gitProfileData.details.gitAccess) {
          gitProfileData.details.gitAccess.gitHubToken = decryptedToken;
        } else {
          CdLog.error('gitAccess is undefined in gitProfileData.details.');
          await this.handleMissingToken();
          return null;
        }
      } catch (e: any) {
        CdLog.error(`Decryption failed: ${(e as Error).message}`);
        await this.handleMissingToken(); // Prompt the user to set the token
        return null;
      }
    } else {
      // If not encrypted, directly assign the value
      if (
        gitProfileData.details.gitAccess &&
        typeof vaultItem.value === 'string'
      ) {
        gitProfileData.details.gitAccess.gitHubToken = vaultItem.value;
      } else {
        CdLog.error(
          'gitAccess is undefined or vaultItem.value is not a string.',
        );
        await this.handleMissingToken();
        return null;
      }
    }

    if (!gitProfileData.details.gitAccess.gitHubToken) {
      CdLog.warning('GitHub token is missing. Prompting the user...');
      await this.handleMissingToken(); // Prompt the user to set the token
      return null;
    }

    CdLog.debug(
      'CdAutoGitController::getGitHubProfile()/Final:',
      await gitProfileData.details,
    );
    return await gitProfileData;
  }

  /**
   * Usage:
   * cd-cli auto-git create --name abcXyz --desc "project for testing auto-git" --priv false --repoHost corpdesk --debug 4
   * @param repoName
   * @param description
   * @param isPrivate
   * @param repoHost // git organizatin or account name
   */
  // async createGitHubRepo(
  //   repoName: string,
  //   descript: string,
  //   isPrivate: boolean,
  //   repoHost: string,
  // ): Promise<void> {
  //   CdLog.debug('CdAutoGitController::createGitHubRepo()/01');
  //   try {
  //     // Validation for inputs
  //     if (!repoName || typeof repoName !== 'string' || repoName.trim() === '') {
  //       throw new Error('Repository name is missing or invalid.');
  //     }
  //     if (!descript || typeof descript !== 'string') {
  //       descript = 'A new repo created via cd-auto-git.';
  //     }
  //     if (typeof isPrivate !== 'boolean') {
  //       isPrivate = false;
  //     }

  //     const gitProfileData = await this.getGitHubProfile();
  //     if (!gitProfileData) {
  //       throw new Error('GitHub profile could not be loaded.');
  //     }

  //     const { apiRepoUrl } = gitProfileData.details.gitAccess;
  //     const { gitHubToken } = gitProfileData.details.gitAccess;

  //     CdLog.debug(
  //       'CdAutoGitController::createGitHubRepo()/gitProfileData.details.gitAccess:',
  //       gitProfileData.details.gitAccess,
  //     );

  //     if (!apiRepoUrl || !gitHubToken) {
  //       throw new Error('GitHub API URL or token is missing.');
  //     }

  //     const payload = {
  //       name: repoName.trim(),
  //       private: isPrivate,
  //       description: descript,
  //     };

  //     CdLog.debug('CdAutoGitController::createGitHubRepo()/payload:', payload);

  //     const headers = {
  //       Authorization: `token ${gitHubToken}`,
  //       Accept: 'application/vnd.github.v3+json',
  //     };

  //     const httpService = new HttpService(true);
  //     await httpService.init();

  //     const responseResult = await httpService.proc2({
  //       method: 'POST',
  //       url: `/orgs/${repoHost}/repos`,
  //       headers,
  //       data: payload,
  //     });

  //     if (!responseResult.state || !responseResult.data) {
  //       return;
  //     }

  //     const response: ICdResponse = responseResult.data;
  //     if (response.data.html_url) {
  //       CdLog.success(`Repository Created: ${response.data.html_url}`);
  //       const repoUrl = `${apiRepoUrl.replace(
  //         'https://api.github.com',
  //         'https://github.com',
  //       )}/${repoHost}/${repoName}.git`;

  //       await this.initializeLocalRepo(repoName, repoUrl);
  //     }
  //   } catch (error) {
  //     CdLog.error(
  //       `Error creating GitHub repository: ${(error instanceof Error && error.message) || error}`,
  //     );
  //   }
  // }
  async createGitHubRepo(
    repoName: string,
    descript: string,
    isPrivate: boolean,
    repoHost: string,
  ): Promise<void> {
    CdLog.debug('CdAutoGitController::createGitHubRepo()/01');
    try {
      // Input Validation
      if (!repoName || typeof repoName !== 'string' || repoName.trim() === '') {
        throw new Error('Repository name is missing or invalid.');
      }
      if (!descript || typeof descript !== 'string') {
        descript = 'A new repo created via cd-auto-git.';
      }
      if (typeof isPrivate !== 'boolean') {
        isPrivate = false;
      }

      // Load GitHub Profile
      const gitProfileData = await this.getGitHubProfile();
      if (!gitProfileData) {
        throw new Error('GitHub profile could not be loaded.');
      }

      const { endpoint, gitHubToken } = gitProfileData.details ?? {};
      if (!endpoint || !gitHubToken) {
        throw new Error('GitHub endpoint or token is missing.');
      }

      CdLog.debug(
        'CdAutoGitController::createGitHubRepo()/gitProfileData.details.gitAccess:',
        gitProfileData.details.gitAccess,
      );

      // Prepare request data
      const payload = {
        name: repoName.trim(),
        private: isPrivate,
        description: descript,
      };

      CdLog.debug('CdAutoGitController::createGitHubRepo()/payload:', payload);

      const headers = {
        Authorization: `token ${gitHubToken}`,
        Accept: 'application/vnd.github.v3+json',
      };

      const httpService = new HttpService(true);
      const profileName = 'gitHubApi';

      const initOk = await httpService.init(profileName); // Pass baseURL directly
      if (!initOk) {
        throw new Error(`Failed to initialize HttpService for ${profileName}`);
      }

      const responseResult = await httpService.request<any>(
        {
          method: 'POST',
          url: `/orgs/${repoHost}/repos`,
          headers,
          data: payload,
        },
        profileName,
      );

      if (!responseResult.state || !responseResult.data) {
        throw new Error(
          `GitHub API call failed: ${responseResult.message || 'Unknown error'}`,
        );
      }

      const response = responseResult.data;
      if (response.html_url) {
        CdLog.success(`Repository Created: ${response.html_url}`);

        const repoUrl = `${endpoint.replace(
          'https://api.github.com',
          'https://github.com',
        )}/${repoHost}/${repoName}.git`;

        await this.initializeLocalRepo(repoName, repoUrl);
      }
    } catch (error) {
      CdLog.error(
        `Error creating GitHub repository: ${(error instanceof Error && error.message) || error}`,
      );
    }
  }

  async handleMissingToken(): Promise<void> {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'gitHubToken',
          message: 'Enter your GitHub personal access token (PAT):',
          mask: '*',
          validate: (input) => !!input || 'Token cannot be empty.',
        },
        {
          type: 'confirm',
          name: 'encryptToken',
          message: 'Do you want to encrypt the token?',
          default: true,
        },
      ]);

      let encryptedValue: string | null = null;
      let encryptionMeta: EncryptionMeta | undefined;

      if (answers.encryptToken) {
        const encryptionResult = await CdCliVaultController.encrypt(
          answers.gitHubToken,
          'default',
        );

        if (encryptionResult && encryptionResult.encryptedValue) {
          encryptedValue = encryptionResult.encryptedValue;
          encryptionMeta = encryptionResult.encryptionMeta; // Use dynamically generated meta
        } else {
          CdLog.error('Failed to encrypt the GitHub token.');
          return;
        }
      }

      const tokenData: CdVault = {
        name: 'gitHubToken',
        value: answers.encryptToken ? null : answers.gitHubToken,
        isEncrypted: answers.encryptToken,
        encryptedValue,
        encryptionMeta, // Include the full encryption metadata
        description: 'GitHub access token',
      };

      const updated = await this.updateCdVault(tokenData);

      if (updated) {
        CdLog.success('GitHub token saved successfully.');
      } else {
        CdLog.error('Failed to save GitHub token.');
      }
    } catch (error) {
      CdLog.error(
        `Error handling missing GitHub token: ${(error as Error).message}`,
      );
    }
  }

  private async checkEncryptionPreference(): Promise<boolean> {
    // Example: Check a config or prompt the user
    return true; // Assume encryption is preferred
  }

  private async setupEncryptedToken(): Promise<string | null> {
    const token = await this.promptForToken();
    if (!token) return null;

    // Encrypt the token
    const encryptedToken = await CdCliVaultController.encryptValue(
      { name: 'gitHubToken', value: token } as CdVault,
      'default',
    );

    if (!encryptedToken || !encryptedToken.encryptedValue) {
      CdLog.error('Failed to encrypt GitHub token.');
      return null;
    }

    const ret = await this.updateCdVault(encryptedToken);

    return encryptedToken.encryptedValue; // Guaranteed to be non-null
  }

  private async promptForPlainToken(): Promise<string | null> {
    const plainToken = await this.promptForToken();
    if (!plainToken) return null;

    // Save the plain token
    await this.updateCdVault({
      name: 'gitHubToken',
      value: plainToken,
      encryptedValue: null,
      isEncrypted: false,
    });
    return plainToken;
  }

  private async promptForToken(): Promise<string | null> {
    const { token } = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your GitHub personal access token:',
        mask: '*',
      },
    ]);

    return token || null;
  }

  private async updateCdVault(
    tokenData: CdVault | null,
  ): Promise<ICdResponse | null> {
    CdLog.debug('starting CdAutoGitController::updateCdVault()');
    CdLog.debug('CdAutoGitController::updateCdVault()/tokenData:', {
      t: tokenData,
    });
    let ret: any = null;
    const ctlCdCliProfile = new CdCliProfileController();
    try {
      if (!tokenData) {
        const error = 'tokenData is not valid';
        this.b.err.push(error);
        throw new Error(error);
      }
      // Load the configuration file
      const profileRet: CdFxReturn<ProfileContainer> =
        await ctlCdCliProfile.loadProfiles();
      if (!profileRet.state || !profileRet.data) {
        CdLog.error(`Failed to load profiles: ${profileRet.message}`);
        return null; // Handle the failure case properly
      }

      // const cdCliProfile = ctlCdCliProfile.loadProfiles();
      const gitProfile = profileRet.data.items.find(
        (item: ProfileModel) => item.cdCliProfileName === config.cdGitConfig,
      );
      CdLog.debug(
        'CdAutoGitController::updateCdVault()/gitProfile:',
        gitProfile,
      );

      // Validate profile existence
      if (!gitProfile || !gitProfile.cdCliProfileData) {
        const error = 'GitHub profile not found in configuration.';
        this.b.err.push(error);
        throw new Error(error);
      }

      // Initialize or append to the cdVault array
      gitProfile.cdCliProfileData.cdVault =
        gitProfile.cdCliProfileData.cdVault || [];
      gitProfile.cdCliProfileData.cdVault.push(tokenData);

      // Prepare the query and JSON update details
      const q: IQuery = {
        update: null,
        where: {
          userId: 1010,
          cdCliProfileId: 2,
        },
      };

      const jsonUpdate: IJsonUpdate[] = [
        {
          modelField: 'cdCliProfileData',
          path: ['cdVault', '[0]', 'encryptedValue'],
          value: tokenData.encryptedValue,
        },
        {
          modelField: 'cdCliProfileData',
          path: ['cdVault', '[0]', 'encryptionMeta'],
          value: tokenData.encryptionMeta,
        },
      ];

      // Validate the updates
      const result = this.b.validateJsonUpdate(
        jsonUpdate,
        gitProfile.cdCliProfileData,
      );

      if (!result.valid) {
        const e = `Validation of jsonUpdate data failed with errors: ${result.errors}`;
        CdLog.error(e);
        this.b.err.push(e);
        throw new Error(e);
      } else {
        CdLog.success('Validation of jsonUpdate data successful!');
      }

      // Ensure cdToken is present before proceeding
      if (!this.cdToken) {
        const error = 'Missing authentication token for updating cdVault.';
        this.b.err.push(error);
        throw new Error(error);
      }

      // Perform the database update
      const apiRes: CdFxReturn<ICdResponse> =
        await this.svCdCliProfile.updateCdCliProfileData(
          q,
          jsonUpdate,
          this.cdToken,
        );

      if (
        apiRes.state &&
        apiRes.data &&
        apiRes.data.app_state &&
        apiRes.data.app_state.success
      ) {
        // Synchronize local configuration with the updated database profile
        // Use the updated gitProfile object since apiRes.data does not have newProfile
        const updatedProfile = gitProfile;
        const configIndex = profileRet.data.items.findIndex(
          (item: ProfileModel) => item.cdCliProfileName === config.cdGitConfig,
        );

        if (configIndex !== -1) {
          profileRet.data.items[configIndex] = updatedProfile;
          // saveCdCliProfileLocal(cdCliProfile);

          ret = await ctlCdCliProfile.saveCdCliProfileLocal(
            updatedProfile,
            config.cdGitConfig,
          );
          if (ret) {
            CdLog.success(
              'Token saved to GitHub profile and local configuration synchronized.',
            );
            return ret;
          } else {
            CdLog.error('Error while saving to local');
            return ret;
          }
        } else {
          const error =
            'Failed to update local configuration: Profile not found in config.';
          this.b.err.push(error);
          CdLog.error(error);
          return ret;
        }
      } else {
        const error = 'cdVault data could not be saved to the database.';
        this.b.err.push(error);
        CdLog.error(error);
        return ret;
      }
    } catch (e: any) {
      const error = (e as Error).toString();
      this.b.err.push(error);
      CdLog.error(`Error in updateCdVault: ${error}`);
      return ret;
    }
  }

  async initializeLocalRepo(repoName: string, repoUrl: string): Promise<void> {
    try {
      // Extract org and repo name from the URL
      const match = repoUrl.match(
        /https:\/\/github\.com\/([^/]+)\/([^/]+)\.git/,
      );
      if (!match) {
        throw new Error('Invalid repository URL.');
      }
      const [, org, repo] = match;

      // Execute the script from ~/.cd-cli/scripts
      const scriptPath = path.resolve(
        os.homedir(),
        '.cd-cli/scripts/init_repo.sh',
      );
      const command = `${scriptPath} ${org} ${repo}`;
      CdLog.debug(`Running script: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      if (stdout) CdLog.info(`Script output: ${stdout}`);
      if (stderr) CdLog.warning(`Script warning: ${stderr}`);

      CdLog.success(
        `Repository ${repoName} initialized and pushed to ${repoUrl}`,
      );
    } catch (error) {
      CdLog.error(
        `Error initializing local repository: ${(error as Error).message}`,
      );
    }
  }

  async cloneRepoToLocal(
    repoName: string,
    repoDirectory: string,
    repoHost: string /** This can be a Git username or organization */,
  ): Promise<void> {
    try {
      // Experimental overrides
      repoName = 'testAutoGit';
      repoHost = 'corpdesk';
      repoDirectory = '~';

      // Fetch the GitHub profile
      const gitProfileData = await this.getGitHubProfile();
      if (!gitProfileData) {
        throw new Error('GitHub profile could not be loaded.');
      }

      CdLog.debug(
        'CdAutoGitController::cloneRepoToLocal()/gitProfileData:',
        gitProfileData,
      );

      // Extract the endpoint and token from the GitHub profile
      let endpoint = gitProfileData.details.endpoint;
      let gitHubToken = gitProfileData.details.gitAccess?.gitHubToken;

      CdLog.debug(
        `CdAutoGitController::cloneRepoToLocal()/endpoint: ${endpoint}`,
      );

      // Experimental overrides
      endpoint = 'https://github.com';

      CdLog.debug('CdAutoGitController::cloneRepoToLocal()/endpoint:', {
        url: endpoint,
      });
      CdLog.debug('CdAutoGitController::cloneRepoToLocal()/gitHubToken:', {
        token: gitHubToken,
      });

      // Decrypt and resolve all vault references in details
      const resolved: IProfileDetails =
        await CdCliVaultController.resolveVaultReferencesInObject(
          gitProfileData.details,
          gitProfileData.cdVault,
        );

      // Extract from resolved details after vault substitution
      // const { baseUrl, gitAccess } = resolved;
      CdLog.debug(
        `CdAutoGitController::cloneRepoToLocal()/resolved:${JSON.stringify(resolved)}`,
      );
      endpoint = resolved.endpoint;
      CdLog.debug(
        `CdAutoGitController::cloneRepoToLocal()/endpoint:${endpoint}`,
      );
      gitHubToken = resolved.gitAccess?.gitHubToken;
      CdLog.debug(
        `CdAutoGitController::cloneRepoToLocal()/gitHubToken:${gitHubToken}`,
      );
      if (!endpoint || !gitHubToken) {
        throw new Error(
          'Missing GitHub endpoint or token. Ensure GitHub profile is configured correctly.',
        );
      }

      // Construct the full repository URL with authentication
      const authRepoUrl = endpoint.replace(
        'https://',
        `https://${gitHubToken}@`,
      );
      const repoUrl = `${authRepoUrl}/${repoHost}/${repoName}.git`;

      CdLog.debug('CdAutoGitController::cloneRepoToLocal()/repoUrl:', {
        url: repoUrl,
      });

      // Construct the git clone command
      const gitCommand = `git clone ${repoUrl} ${repoDirectory}/${repoName}`;

      CdLog.debug('CdAutoGitController::cloneRepoToLocal()/gitCommand:', {
        cmd: gitCommand,
      });

      // Execute the git clone command
      await this.runCommand(gitCommand);

      // Log success message
      CdLog.success(`Repository cloned into ${repoDirectory}/${repoName}`);
    } catch (error) {
      if (error instanceof Error) {
        CdLog.error(`Error cloning repository: ${error.message}`);
      } else {
        CdLog.error(
          `Error cloning repository: Unexpected error format: ${JSON.stringify(
            error,
          )}`,
        );
      }
    }
  }

  // Helper method to run shell commands
  private runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error executing command: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`stderr: ${stderr}`);
          return;
        }
        resolve(stdout);
      });
    });
  }

  // Main method to initiate the GitHub project setup
  async initiateGitHubProject(
    repoHost: string /** This can be git user name or git company */,
  ) {
    const gitProfileData: ProfileData =
      (await this.getGitHubProfile()) as ProfileData;
    if (!gitProfileData) {
      CdLog.error('GitHub profile could not be loaded.');
      return;
    }

    const {
      gitHubUser: gitHubUser,
      gitHubToken: gitHubToken,
      endpoint,
    } = gitProfileData.details;

    if (!gitHubToken || !gitHubUser || !endpoint) {
      CdLog.error(
        'GitHub profile is incomplete. Ensure username, token, and endpoint are set.',
      );
      return;
    }

    const repoDirectory = '~/cd-projects'; // Default directory for cloning
    const { repoName, repoDescription, isPrivate } = await inquirer.prompt(
      GitHubRepoCreatePromptData,
    );

    // Create and clone the repository
    await this.createGitHubRepo(repoName, repoDescription, isPrivate, repoHost);
    await this.cloneRepoToLocal(repoName, repoDirectory, repoHost);
  }
}
