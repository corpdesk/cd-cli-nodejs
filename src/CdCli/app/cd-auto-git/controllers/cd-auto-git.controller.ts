/**
 * Workflow for Project Creation

    1. Setup Profile: The user needs to set up a GitHub profile in profile.json that includes their GitHub username and personal access token (PAT).
    2. Run Command: The user runs the command cd-cli auto-git create to initiate the GitHub project creation process.
    3. GitHub Repo Creation: The user is prompted for the repository name, description, and visibility (private or public). The controller creates the GitHub repository using the GitHub API.
    4. Repository Cloning: Once the repository is created, the project is cloned into the specified local directory (~/cd-projects/ by default).
    5. Completion: The user sees success messages for both repository creation and cloning.
 */

/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable style/brace-style */
import type { ProfileModel } from '@/CdCli/sys/cd-cli/models/cd-cli-profile.model';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import util from 'node:util';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import Logger from '@/CdCli/sys/cd-comm/controllers/notifier.controller';
import axios from 'axios';
import inquirer from 'inquirer';
import {
  type GitHubProfile,
  GitHubRepoCreatePromptData,
} from '../models/cd-auto-git.model';

const execPromise = util.promisify(exec);
const GITHUB_API_URL = 'https://api.github.com';
const PROFILE_FILE_STORE = './profile.json'; // Path to store the profile data

export class CdAutoGitController {
  // Method to fetch the GitHub profile from profile.json
  async getGitHubProfile(): Promise<GitHubProfile | null> {
    // Ensure profile.json exists or trigger login process
    const svCdCliProfile = new CdCliProfileController();
    await svCdCliProfile.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

    const profiles = JSON.parse(
      fs.readFileSync(PROFILE_FILE_STORE, 'utf-8'),
    ).items;
    const profileData = profiles.find(
      (profile: ProfileModel) => profile.cdCliProfileTypeId === 2,
    ); // GitHub profile type ID
    return profileData ? profileData.cdCliProfileData : null;
  }

  // Method to create a GitHub repository using the GitHub API
  // cd-cli auto-git create
  async createGitHubRepo(
    repoName: string,
    description: string,
    isPrivate: boolean,
    token: string,
  ): Promise<void> {
    try {
      // const repoName = 'inte-ract'; // Repository name
      // const description = 'A project for the inte-ract module'; // Description
      // const isPrivate = false; // Change to true if you want the repo to be private
      // const token = 'your-github-token'; // The personal access token with rights to create repos in the corpdesk organization

      const response = await axios.post(
        'https://api.github.com/orgs/corpdesk/repos', // GitHub API URL for organization repos
        {
          name: repoName,
          description,
          private: isPrivate, // Set privacy based on your preference
        },
        {
          headers: {
            Authorization: `token ${token}`, // Authentication token
            Accept: 'application/vnd.github.v3+json', // Ensure you're using the correct API version
          },
        },
      );

      console.log('Repository Created: ', response.data.html_url); // Log the URL of the newly created repository
    } catch (error) {
      Logger.error(`Error creating repository: ${(error as Error).message}`);
    }
  }

  // Method to clone the repository to the user's local machine
  async cloneRepoToLocal(
    repoName: string,
    repoDirectory: string,
    token: string,
  ): Promise<void> {
    const gitCommand = `git clone https://github.com/corpdesk/${repoName}.git ${repoDirectory}/${repoName}`;
    try {
      await this.runCommand(gitCommand); // Method to run shell commands
      Logger.success(`Repository cloned into ${repoDirectory}/${repoName}`);
    } catch (error) {
      Logger.error(`Error cloning repository: ${(error as Error).message}`);
    }
  }

  // Helper method to run shell commands
  runCommand(command: string): Promise<string> {
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
        resolve(stdout); // Resolving the stdout string
      });
    });
  }

  // Main method to initiate the GitHub project setup
  async initiateGitHubProject() {
    const profile = await this.getGitHubProfile();
    if (!profile) {
      Logger.error('GitHub profile not found.');
      return;
    }

    const { gitHubUsername, gitHubToken, repoDirectory } = profile;

    // Prompt user for GitHub repository details
    const { repoName, repoDescription, isPrivate } = await inquirer.prompt(
      GitHubRepoCreatePromptData,
    );

    // Create the repository on GitHub
    await this.createGitHubRepo(
      repoName,
      repoDescription,
      isPrivate,
      gitHubToken,
    );

    // Clone the repository to the local directory
    await this.cloneRepoToLocal(repoName, repoDirectory, gitHubToken);
  }
}
