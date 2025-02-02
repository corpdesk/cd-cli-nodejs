/* eslint-disable antfu/if-newline */
import type { ICdResponse, IJsonUpdate, IQuery } from '@/CdCli/sys/base/IBase';
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-rename */
import type {
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
import { BaseService } from '@/CdCli/sys/base/base.service';
import { HttpService } from '@/CdCli/sys/base/http.service';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
import { loadCdCliConfig } from '@/config';
import axios from 'axios';

import inquirer from 'inquirer';
import { GitHubRepoCreatePromptData } from '../models/cd-auto-git.model';

const execAsync = util.promisify(exec);

const execPromise = promisify(exec);

export class CdAutoGitController {
  b = new BaseService();
  cdToken = '';
  ctlSession = new SessonController();
  ctlCdCliProfile = new CdCliProfileController();
  svCdCliProfile = new CdCliProfileService();

  constructor() {
    this.init();
  }

  async init() {
    const r = await this.ctlSession.getSession('cd-api-local')?.cd_token;
    if (r) {
      this.cdToken = r;
      CdLogg.info('cdToken has been set');
    } else {
      CdLogg.error('There is a problem setting cdToken');
    }
  }

  async getGitHubProfile(): Promise<ProfileData | null> {
    CdLogg.debug('starting getGitHubProfile()');
    const cdCliProfile = await loadCdCliConfig();
    CdLogg.debug(
      'CdAutoGitController::getGitHubProfile()/cdCliProfile:',
      cdCliProfile,
    );

    const profile = cdCliProfile.items.find(
      (item: ProfileModel) => item.cdCliProfileName === 'cd-git-config',
    );

    CdLogg.debug('CdAutoGitController::getGitHubProfile()/profile:', profile);

    if (
      !profile ||
      !profile.cdCliProfileData ||
      !profile.cdCliProfileData.details
    ) {
      CdLogg.error('GitHub profile not found in configuration.');
      return null;
    }

    const gitProfileData: ProfileData = profile.cdCliProfileData;
    if (!gitProfileData) {
      CdLogg.error('GitHub access details are missing in the profile.');
      return null;
    }

    CdLogg.debug(
      'CdAutoGitController::getGitHubProfile()/gitProfileData:',
      gitProfileData,
    );

    // Handle decryption for the access token using cdVault
    const vaultItem: CdVault = profile.cdCliProfileData.cdVault.find(
      (vault) => vault.name === 'gitHubToken',
    );

    CdLogg.debug(
      'CdAutoGitController::getGitHubProfile()/vaultItem:',
      vaultItem,
    );

    if (!vaultItem) {
      CdLogg.error('Vault entry for GitHub token is missing.');
      await this.handleMissingToken(); // Prompt the user to set the token
      return null;
    }

    if (vaultItem.isEncrypted) {
      const { encryptedValue, encryptionMeta } = vaultItem;

      CdLogg.debug('CdAutoGitController::getGitHubProfile()/encryptedValue:', {
        e: encryptedValue,
      });
      CdLogg.debug(
        'CdAutoGitController::getGitHubProfile()/encryptionMeta:',
        encryptionMeta,
      );

      if (!encryptedValue || !encryptionMeta || !encryptionMeta.iv) {
        CdLogg.warning(
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
          CdLogg.warning(
            'Decryption failed. Provide a valid github access token.',
          );
          await this.handleMissingToken(); // Prompt the user to set the token
          return null;
        }

        gitProfileData.details.gitAccess.gitHubToken = decryptedToken;
      } catch (e) {
        CdLogg.error(`Decryption failed: ${(e as Error).message}`);
        await this.handleMissingToken(); // Prompt the user to set the token
        return null;
      }
    } else {
      // If not encrypted, directly assign the value
      gitProfileData.details.gitAccess.gitHubToken = vaultItem.value;
    }

    if (!gitProfileData.details.gitAccess.gitHubToken) {
      CdLogg.warning('GitHub token is missing. Prompting the user...');
      await this.handleMissingToken(); // Prompt the user to set the token
      return null;
    }

    CdLogg.debug(
      'CdAutoGitController::getGitHubProfile()/Final:',
      await gitProfileData.details,
    );
    return await gitProfileData;
  }

  /**
   * Usage:
   * cd-cli auto-git create --name abcXyz --desc "project for testing auto-git" --priv false --gitHost corpdesk --debug 4
   * @param repoName
   * @param description
   * @param isPrivate
   * @param gitHost // git organizatin or account name
   */
  async createGitHubRepo(
    repoName: string,
    descript: string,
    isPrivate: boolean,
    gitHost: string,
  ): Promise<void> {
    try {
      // Validation for inputs
      if (!repoName || typeof repoName !== 'string' || repoName.trim() === '') {
        throw new Error('Repository name is missing or invalid.');
      }
      if (!descript || typeof descript !== 'string') {
        descript = 'A new repo created via cd-auto-git.';
      }
      if (typeof isPrivate !== 'boolean') {
        isPrivate = false;
      }

      const gitProfileData = await this.getGitHubProfile();
      if (!gitProfileData) {
        throw new Error('GitHub profile could not be loaded.');
      }

      const { apiRepoUrl } = gitProfileData.details.gitAccess;
      const { gitHubToken } = gitProfileData.details.gitAccess;

      CdLogg.debug(
        'CdAutoGitController::createGitHubRepo()/gitProfileData.details.gitAccess:',
        gitProfileData.details.gitAccess,
      );

      if (!apiRepoUrl || !gitHubToken) {
        throw new Error('GitHub API URL or token is missing.');
      }

      const payload = {
        name: repoName.trim(),
        private: isPrivate,
        description: descript,
      };

      CdLogg.debug('CdAutoGitController::createGitHubRepo()/payload:', payload);

      const headers = {
        Authorization: `token ${gitHubToken}`,
        Accept: 'application/vnd.github.v3+json',
      };

      const httpService = new HttpService(true);
      await httpService.init(apiRepoUrl);

      const response = await httpService.proc2({
        method: 'POST',
        url: `/orgs/${gitHost}/repos`,
        headers,
        data: payload,
      });

      if (response?.html_url) {
        CdLogg.success(`Repository Created: ${response.html_url}`);
        const repoUrl = `${apiRepoUrl.replace(
          'https://api.github.com',
          'https://github.com',
        )}/${gitHost}/${repoName}.git`;

        await this.initializeLocalRepo(repoName, repoUrl);
      }
    } catch (error) {
      CdLogg.error(
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
          CdLogg.error('Failed to encrypt the GitHub token.');
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
        CdLogg.success('GitHub token saved successfully.');
      } else {
        CdLogg.error('Failed to save GitHub token.');
      }
    } catch (error) {
      CdLogg.error(
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
      CdLogg.error('Failed to encrypt GitHub token.');
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
    CdLogg.debug('starting CdAutoGitController::updateCdVault()');
    CdLogg.debug('CdAutoGitController::updateCdVault()/tokenData:', {
      t: tokenData,
    });
    let ret: any = null;
    try {
      if (!tokenData) {
        const error = 'tokenData is not valid';
        this.b.err.push(error);
        throw new Error(error);
      }
      // Load the configuration file
      const cdCliProfile = loadCdCliConfig();
      const profile = cdCliProfile.items.find(
        (item: ProfileModel) => item.cdCliProfileName === 'cd-git-config',
      );
      CdLogg.debug('CdAutoGitController::updateCdVault()/profile:', profile);

      // Validate profile existence
      if (!profile || !profile.cdCliProfileData) {
        const error = 'GitHub profile not found in configuration.';
        this.b.err.push(error);
        throw new Error(error);
      }

      // Initialize or append to the cdVault array
      profile.cdCliProfileData.cdVault = profile.cdCliProfileData.cdVault || [];
      profile.cdCliProfileData.cdVault.push(tokenData);

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
        profile.cdCliProfileData,
      );

      if (!result.valid) {
        const e = `Validation of jsonUpdate data failed with errors: ${result.errors}`;
        CdLogg.error(e);
        this.b.err.push(e);
        throw new Error(e);
      } else {
        CdLogg.success('Validation of jsonUpdate data successful!');
      }

      // Ensure cdToken is present before proceeding
      if (!this.cdToken) {
        const error = 'Missing authentication token for updating cdVault.';
        this.b.err.push(error);
        throw new Error(error);
      }

      // Perform the database update
      const apiRes: ICdResponse =
        await this.svCdCliProfile.updateCdCliProfileData(
          q,
          jsonUpdate,
          this.cdToken,
        );

      if (apiRes.app_state.success) {
        // Synchronize local configuration with the updated database profile
        const updatedProfile = apiRes.data?.newProfile[0];
        if (updatedProfile) {
          const configIndex = cdCliProfile.items.findIndex(
            (item: ProfileModel) => item.cdCliProfileName === 'cd-git-config',
          );

          if (configIndex !== -1) {
            cdCliProfile.items[configIndex] = updatedProfile;
            // saveCdCliProfileLocal(cdCliProfile);
            ret = await this.ctlCdCliProfile.saveCdCliProfileLocal(
              profile,
              'cd-git-config',
            );
            if (ret) {
              CdLogg.success(
                'Token saved to GitHub profile and local configuration synchronized.',
              );
              return ret;
            } else {
              CdLogg.error('Error while saving to local');
              return ret;
            }
          } else {
            const error =
              'Failed to update local configuration: Profile not found in config.';
            this.b.err.push(error);
            CdLogg.error(error);
            return ret;
          }
        } else {
          const error =
            'Failed to retrieve updated profile from the database response.';
          this.b.err.push(error);
          CdLogg.error(error);
          return ret;
        }
      } else {
        const error = 'cdVault data could not be saved to the database.';
        this.b.err.push(error);
        CdLogg.error(error);
        return ret;
      }
    } catch (e) {
      const error = (e as Error).toString();
      this.b.err.push(error);
      CdLogg.error(`Error in updateCdVault: ${error}`);
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
      CdLogg.debug(`Running script: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      if (stdout) CdLogg.info(`Script output: ${stdout}`);
      if (stderr) CdLogg.warning(`Script warning: ${stderr}`);

      CdLogg.success(
        `Repository ${repoName} initialized and pushed to ${repoUrl}`,
      );
    } catch (error) {
      CdLogg.error(
        `Error initializing local repository: ${(error as Error).message}`,
      );
    }
  }

  async cloneRepoToLocal(
    repoName: string,
    repoDirectory: string,
    gitHost: string /** This can be a Git username or organization */,
  ): Promise<void> {
    try {
      // Experimental overrides
      repoName = 'testAutoGit';
      gitHost = 'corpdesk';
      repoDirectory = '~';

      // Fetch the GitHub profile
      const gitProfileData = await this.getGitHubProfile();
      if (!gitProfileData) {
        throw new Error('GitHub profile could not be loaded.');
      }

      CdLogg.debug(
        'CdAutoGitController::cloneRepoToLocal()/gitProfileData:',
        gitProfileData,
      );

      // Extract the baseRepoUrl and token from the GitHub profile
      let { baseRepoUrl } = gitProfileData.details.gitAccess;
      let { gitHubToken } = gitProfileData.details.gitAccess;

      CdLogg.debug(
        'CdAutoGitController::cloneRepoToLocal()/baseRepoUrl:',
        baseRepoUrl,
      );

      // Experimental overrides
      baseRepoUrl = 'https://github.com';

      CdLogg.debug('CdAutoGitController::cloneRepoToLocal()/baseRepoUrl:', {
        url: baseRepoUrl,
      });
      CdLogg.debug('CdAutoGitController::cloneRepoToLocal()/gitHubToken:', {
        token: gitHubToken,
      });

      // Handle placeholder token
      if (gitHubToken?.startsWith('#cdVault[')) {
        const tokenNameMatch = gitHubToken.match(/#cdVault\['(.+?)'\]/);
        if (tokenNameMatch) {
          const tokenName = tokenNameMatch[1];
          const tokenVaultEntry = gitProfileData.cdVault.find(
            (item: CdVault) => item.name === tokenName,
          );
          if (tokenVaultEntry) {
            gitHubToken = tokenVaultEntry.isEncrypted
              ? CdCliVaultController.getSensitiveData(tokenVaultEntry)
              : tokenVaultEntry.value;
          } else {
            throw new Error(`Vault entry '${tokenName}' not found.`);
          }
        }
      }

      if (!baseRepoUrl || !gitHubToken) {
        throw new Error(
          'Missing GitHub baseRepoUrl or token. Ensure GitHub profile is configured correctly.',
        );
      }

      // Construct the full repository URL with authentication
      const authRepoUrl = baseRepoUrl.replace(
        'https://',
        `https://${gitHubToken}@`,
      );
      const repoUrl = `${authRepoUrl}/${gitHost}/${repoName}.git`;

      CdLogg.debug('CdAutoGitController::cloneRepoToLocal()/repoUrl:', {
        url: repoUrl,
      });

      // Construct the git clone command
      const gitCommand = `git clone ${repoUrl} ${repoDirectory}/${repoName}`;

      CdLogg.debug('CdAutoGitController::cloneRepoToLocal()/gitCommand:', {
        cmd: gitCommand,
      });

      // Execute the git clone command
      await this.runCommand(gitCommand);

      // Log success message
      CdLogg.success(`Repository cloned into ${repoDirectory}/${repoName}`);
    } catch (error) {
      if (error instanceof Error) {
        CdLogg.error(`Error cloning repository: ${error.message}`);
      } else {
        CdLogg.error(
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
    gitHost: string /** This can be git user name or git company */,
  ) {
    const gitProfileData: ProfileData =
      (await this.getGitHubProfile()) as ProfileData;
    if (!gitProfileData) {
      CdLogg.error('GitHub profile could not be loaded.');
      return;
    }

    const {
      gitHubUser: gitHubUser,
      gitHubToken: gitHubToken,
      baseRepoUrl,
    } = gitProfileData.details;

    if (!gitHubToken || !gitHubUser || !baseRepoUrl) {
      CdLogg.error(
        'GitHub profile is incomplete. Ensure username, token, and baseRepoUrl are set.',
      );
      return;
    }

    const repoDirectory = '~/cd-projects'; // Default directory for cloning
    const { repoName, repoDescription, isPrivate } = await inquirer.prompt(
      GitHubRepoCreatePromptData,
    );

    // Create and clone the repository
    await this.createGitHubRepo(repoName, repoDescription, isPrivate, gitHost);
    await this.cloneRepoToLocal(repoName, repoDirectory, gitHost);
  }
}
