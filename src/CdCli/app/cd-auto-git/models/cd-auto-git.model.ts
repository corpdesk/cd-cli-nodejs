export const GitHubProfilePromptData = [
  {
    type: 'input',
    name: 'gitHubUsername',
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
    name: 'repoDirectory',
    message: 'Enter the local directory where the project should be cloned:',
    default: '~/cd-projects/',
  },
];

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

export interface GitHubProfile {
  gitHubUsername: string;
  gitHubToken: string;
  repoDirectory: string; // Directory where the repo will be cloned
}
