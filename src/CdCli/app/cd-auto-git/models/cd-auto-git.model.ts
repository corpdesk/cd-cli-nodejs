// import type { CdVault } from '@/CdCli/sys/base/cd-cli-vault.controller';

// export const GitHubProfilePromptData = [
//   {
//     type: 'input',
//     name: 'gitHubUsername',
//     message: 'Enter your GitHub username:',
//     default: '',
//   },
//   {
//     type: 'password',
//     name: 'gitHubToken',
//     message: 'Enter your GitHub personal access token (PAT):',
//     mask: '*',
//   },
//   {
//     type: 'input',
//     name: 'repoDirectory',
//     message: 'Enter the local directory where the project should be cloned:',
//     default: '~/cd-projects/',
//   },
// ];

// export const GitHubRepoCreatePromptData: any = [
//   {
//     type: 'input',
//     name: 'repoName',
//     message: 'Enter the repository name:',
//     default: 'new-repo',
//   },
//   {
//     type: 'input',
//     name: 'repoDescription',
//     message: 'Enter a description for your repository:',
//     default: 'A new repo created via cd-auto-git',
//   },
//   {
//     type: 'confirm',
//     name: 'isPrivate',
//     message: 'Should the repository be private?',
//     default: true,
//   },
// ];

// export interface GitAccess {
//   cdVault: CdVault[];
//   gitHubToken: string; // example "#cdVault['gitHubToken']",
//   gitHubUser: string;
//   baseRepoUrl: string; // example "https:/github.com"
// }

import type { CdVault } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
// import type { CdVault } from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { CdAutoGitController } from '../controllers/cd-auto-git.controller';

export const CD_AUTO_GIT_CMD = {
  name: 'auto-git',
  description: 'Automate GitHub repository operations.',
  subcommands: [
    {
      name: 'create',
      description: 'Create a new GitHub repository.',
      options: [
        {
          flags: '--repo-name <repoName>',
          description: 'Name of the repository to create.',
          defaultValue: 'new-repo',
        },
        {
          flags: '--description <repoDescription>',
          description: 'Description of the repository.',
          defaultValue: 'A new repo created via cd-auto-git.',
        },
        {
          flags: '--private',
          description: 'Set the repository as private.',
          defaultValue: true,
        },
      ],
      action: {
        execute: async (options) => {
          CdLogg.info('Executing auto-git create command...', options);
          const cdAutoGitController = new CdAutoGitController();
          await cdAutoGitController.createGitHubRepo(
            options.repoName,
            options.repoDescription,
            options.private,
          );
        },
      },
    },
    {
      name: 'clone',
      description: 'Clone an existing GitHub repository.',
      options: [
        {
          flags: '--repo-name <repoName>',
          description: 'Name of the repository to clone.',
          required: true,
        },
        {
          flags: '--repo-directory <repoDirectory>',
          description: 'Directory where the repository should be cloned.',
          defaultValue: '~/cd-projects',
        },
        {
          flags: '--git-host <gitHost>',
          description:
            'GitHub username or organization hosting the repository.',
          required: true,
        },
      ],
      action: {
        execute: async (options) => {
          CdLogg.info('Executing auto-git clone command...', options);
          const cdAutoGitController = new CdAutoGitController();
          await cdAutoGitController.cloneRepoToLocal(
            options.repoName,
            options.repoDirectory,
            options.gitHost,
          );
        },
      },
    },
    {
      name: 'init',
      description: 'Initiate a project by creating and cloning a repository.',
      options: [
        {
          flags: '--repo-name <repoName>',
          description: 'Name of the repository to create and clone.',
          required: true,
        },
        {
          flags: '--description <repoDescription>',
          description: 'Description of the repository.',
          defaultValue: 'A new repo created via cd-auto-git.',
        },
        {
          flags: '--private',
          description: 'Set the repository as private.',
          defaultValue: true,
        },
        {
          flags: '--repo-directory <repoDirectory>',
          description: 'Directory where the repository should be cloned.',
          defaultValue: '~/cd-projects',
        },
        {
          flags: '--git-host <gitHost>',
          description:
            'GitHub username or organization hosting the repository.',
          required: true,
        },
      ],
      action: {
        execute: async (options) => {
          CdLogg.info('Executing auto-git init command...', options);
          const cdAutoGitController = new CdAutoGitController();
          await cdAutoGitController.createGitHubRepo(
            options.repoName,
            options.repoDescription,
            options.private,
          );
          await cdAutoGitController.cloneRepoToLocal(
            options.repoName,
            options.repoDirectory,
            options.gitHost,
          );
        },
      },
    },
  ],
};

/**
 * Prompts for setting up a GitHub profile.
 * Used for creating or updating GitHub configurations in the profiles.
 */
export const GitHubProfilePromptData = [
  {
    type: 'input',
    name: 'gitHubUser',
    message: 'Enter your GitHub username:',
    default: '',
  },
  {
    type: 'password',
    name: 'gitHubToken',
    message: 'Enter your GitHub personal access token (PAT):',
    mask: '*',
  },
  {
    type: 'input',
    name: 'baseRepoUrl',
    message: 'Enter the base URL for GitHub repositories:',
    default: 'https://github.com',
  },
  {
    type: 'input',
    name: 'repoDirectory',
    message: 'Enter the local directory where repositories should be cloned:',
    default: '~/cd-projects/',
  },
];

/**
 * Prompts for creating a new GitHub repository.
 */
export const GitHubRepoCreatePromptData: any = [
  {
    type: 'input',
    name: 'repoName',
    message: 'Enter the repository name:',
    default: 'new-repo',
  },
  {
    type: 'input',
    name: 'repoDescription',
    message: 'Enter a description for your repository:',
    default: 'A new repo created via cd-auto-git',
  },
  {
    type: 'confirm',
    name: 'isPrivate',
    message: 'Should the repository be private?',
    default: true,
  },
];

/**
 * Interface representing GitHub access details within a profile.
 */
export interface GitAccess {
  cdVault: CdVault[]; // Vaulted sensitive data (e.g., PAT)
  gitHubToken: string; // Personal Access Token or reference to a vault item
  gitHubUser: string; // GitHub username
  baseRepoUrl: string; // Base URL for GitHub operations (e.g., "https://github.com")
}

/**
 * Interface representing the structure of a GitHub repository creation request.
 */
export interface GitHubRepoCreateRequest {
  name: string; // Repository name
  description: string; // Repository description
  private: boolean; // Visibility of the repository (true = private, false = public)
}

/**
 * Interface representing cloning details for a repository.
 */
export interface GitHubCloneDetails {
  repoName: string; // Name of the repository to clone
  repoDirectory: string; // Local directory where the repository will be cloned
  gitHost: string; // GitHub username or organization (corpdesk, for example)
}
