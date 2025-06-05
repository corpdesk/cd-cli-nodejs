import type { CdVault } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { CdAutoGitController } from '../controllers/cd-auto-git.controller';

export const CD_AUTO_GIT_CMD = {
  name: 'auto-git',
  description: 'Automate GitHub repository operations.',
  subcommands: [
    {
      /**
       * Usage example:
       * cd-cli auto-git create --name abcXyz --desc "project for testing auto-git" --priv false --repoHost corpdesk --debug 4
       */
      name: 'create',
      description: 'Create a new GitHub repository.',
      options: [
        {
          flags: '--name <repoName>',
          description: 'Name of the repository to create.',
          defaultValue: 'new-repo',
        },
        {
          flags: '--desc <repoDescription>',
          description: 'Description of the repository.',
          defaultValue: 'A new repo created via cd-auto-git.',
        },
        {
          flags: '--priv <private>',
          description: 'Set the repository as private.',
          defaultValue: false,
        },
        {
          flags: '--repoHost <repoHost>',
          description: 'Set account name or git organization.',
          defaultValue: 'corpdesk',
        },
      ],
      action: {
        execute: async (options) => {
          // CdLog.debug('Executing auto-git create command...', options);
          const cdAutoGitController = new CdAutoGitController();
          await cdAutoGitController.createGitHubRepo(
            options.name,
            options.desc,
            options.priv,
            options.repoHost,
          );
        },
      },
    },
    {
      /**
       * Usage example:
       * cd-cli auto-git clone --repo-name abcXyz --repo-directory ~/cd-projects --git-host corpdesk
       */
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
          flags: '--git-host <repoHost>',
          description:
            'GitHub username or organization hosting the repository.',
          required: true,
        },
      ],
      action: {
        execute: async (options) => {
          // CdLog.info('Executing auto-git clone command...', options);
          const cdAutoGitController = new CdAutoGitController();
          await cdAutoGitController.cloneRepoToLocal(
            options.repoName,
            options.repoDirectory,
            options.repoHost,
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
          flags: '--git-host <repoHost>',
          description:
            'GitHub username or organization hosting the repository.',
          required: true,
        },
      ],
      action: {
        execute: async (options) => {
          CdLog.info('Executing auto-git init command...', options);
          const cdAutoGitController = new CdAutoGitController();
          await cdAutoGitController.createGitHubRepo(
            options.repoName,
            options.repoDescription,
            options.private,
            options.repoHost,
          );
          await cdAutoGitController.cloneRepoToLocal(
            options.repoName,
            options.repoDirectory,
            options.repoHost,
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
  repoHost: string; // GitHub username or organization (corpdesk, for example)
}
