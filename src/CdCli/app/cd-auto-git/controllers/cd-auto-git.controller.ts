/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-rename */

/**
 * Workflow for Project Creation

    1. Setup Profile: The user needs to set up a GitHub profile in profile.json that includes their GitHub username and personal access token (PAT).
    2. Run Command: The user runs the command cd-cli auto-git create to initiate the GitHub project creation process.
    3. GitHub Repo Creation: The user is prompted for the repository name, description, and visibility (private or public). The controller creates the GitHub repository using the GitHub API.
    4. Repository Cloning: Once the repository is created, the project is cloned into the specified local directory (~/cd-projects/ by default).
    5. Completion: The user sees success messages for both repository creation and cloning.
 */
import type { ProfileModel } from '@/CdCli/sys/cd-cli/models/cd-cli-profile.model';
import type { GitAccess } from '../models/cd-auto-git.model';
import { exec } from 'node:child_process';
import util, { promisify } from 'node:util';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { loadCdCliConfig } from '@/config';
import axios from 'axios';
import inquirer from 'inquirer';
import { GitHubRepoCreatePromptData } from '../models/cd-auto-git.model';

const execPromise = promisify(exec);

export class CdAutoGitController {
  // Method to fetch the GitHub profile from cd-cli.config.json
  async getGitHubProfile(): Promise<GitAccess | null> {
    CdLogg.debug('starting getGitHubProfile()');
    const cdCliConfig = loadCdCliConfig();
    CdLogg.debug(
      'CdAutoGitController::getGitHubProfile()/cdCliConfig:',
      cdCliConfig,
    );

    // Find the GitHub profile dynamically based on profile name
    const profile = cdCliConfig.items.find(
      (item: ProfileModel) => item.cdCliProfileName === 'cd-git-config',
    );

    if (
      !profile ||
      !profile.cdCliProfileData ||
      !profile.cdCliProfileData.details
    ) {
      CdLogg.error('GitHub profile not found in configuration.');
      return null;
    }

    const gitAccess: GitAccess = profile.cdCliProfileData.details.gitAccess;
    if (!gitAccess) {
      CdLogg.error('GitHub access details are missing in the profile.');
      return null;
    }

    // Handle decryption for the access token using cdVault
    const vaultItem = profile.cdCliProfileData.cdVault.find(
      (vault) => vault.name === 'gitHubToken',
    );

    if (!vaultItem) {
      throw new Error('Vault entry for GitHub token is missing.');
    }

    if (vaultItem.isEncrypted) {
      const { encryptedValue, encryptionMeta } = vaultItem;

      if (!encryptedValue || !encryptionMeta) {
        throw new Error('Encrypted access token or metadata is missing.');
      }

      gitAccess.gitHubToken = CdCliVaultController.decrypt(
        encryptionMeta,
        encryptedValue,
      );
    } else {
      gitAccess.gitHubToken = vaultItem.value;
    }

    return gitAccess;
  }

  async createGitHubRepo(
    repoName: string,
    description: string,
    isPrivate: boolean,
  ): Promise<void> {
    try {
      // Fetch the GitHub profile
      const gitAccess = await this.getGitHubProfile();
      if (!gitAccess) {
        throw new Error('GitHub profile could not be loaded.');
      }

      CdLogg.debug('gitAccess1:', gitAccess);
      // Extract necessary data from the GitHub profile
      const { baseRepoUrl, gitHubToken } = gitAccess;

      CdLogg.debug('gitAccess2:', { url: baseRepoUrl, token: gitHubToken });
      if (!baseRepoUrl || !gitHubToken) {
        throw new Error('GitHub profile is missing required fields.');
      }

      // Construct the repository URL
      const repoUrl = `${baseRepoUrl}/corpdesk/repos`;

      // Make the API call to create the GitHub repository
      const response = await axios.post(
        repoUrl,
        {
          name: repoName,
          description,
          private: isPrivate,
        },
        {
          headers: {
            Authorization: `token ${gitHubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      // Log success with repository URL
      CdLogg.success(`Repository Created: ${response.data.html_url}`);
    } catch (error) {
      CdLogg.error(`Error creating repository: ${(error as Error).message}`);
    }
  }

  async cloneRepoToLocal(
    repoName: string,
    repoDirectory: string,
    gitHost: string /** This can be git user name or git company */,
  ): Promise<void> {
    try {
      // Fetch the GitHub profile
      const gitAccess = await this.getGitHubProfile();
      if (!gitAccess) {
        throw new Error('GitHub profile could not be loaded.');
      }

      // Extract the baseRepoUrl from the GitHub profile
      const { baseRepoUrl } = gitAccess;

      if (!baseRepoUrl) {
        throw new Error('GitHub profile is missing the baseRepoUrl field.');
      }

      // Construct the full repository URL
      const repoUrl = `${baseRepoUrl}/${gitHost}/${repoName}.git`;

      // Construct the git clone command
      const gitCommand = `git clone ${repoUrl} ${repoDirectory}/${repoName}`;

      // Execute the git clone command
      await this.runCommand(gitCommand);

      // Log success message
      CdLogg.success(`Repository cloned into ${repoDirectory}/${repoName}`);
    } catch (error) {
      CdLogg.error(`Error cloning repository: ${(error as Error).message}`);
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
    const gitAccess: GitAccess = (await this.getGitHubProfile()) as GitAccess;
    if (!gitAccess) {
      CdLogg.error('GitHub profile could not be loaded.');
      return;
    }

    const {
      gitHubUser: gitHubUser,
      gitHubToken: gitHubToken,
      baseRepoUrl,
    } = gitAccess;

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
    await this.createGitHubRepo(repoName, repoDescription, isPrivate);
    await this.cloneRepoToLocal(repoName, repoDirectory, gitHost);
  }
}
