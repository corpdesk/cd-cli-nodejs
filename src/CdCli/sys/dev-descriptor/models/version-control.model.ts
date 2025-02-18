// import type { ServiceDescriptor } from './app-descriptor.model';
import type {
  BaseServiceDescriptor,
  VendorDescriptor,
} from './service-descriptor.model';
// import type { ServiceDescriptor } from './service-provider.model';
/* eslint-disable style/operator-linebreak */
// import type { VersionControlDescriptor } from './dev-descriptor.model';
import { execSync } from 'node:child_process';
// Example Usage

/**
 * const descriptor = getVersionControlDescriptor('.');
    console.log(descriptor);
 */

// Interface for Tags
export interface VersionControlTag {
  name: string; // Tag name (e.g., "v1.0.0")
  commitHash: string; // Hash of the commit the tag points to
  description?: string; // Description of the tag
  date?: string; // Date of tagging
}

// Interface for Metadata
export interface VersionControlMetadata {
  creationDate?: string; // Date the repository was created
  lastUpdated?: string; // Date of the last update
  license?: string; // License of the repository (e.g., "MIT")
  repositorySize?: string; // Human-readable size of the repository (e.g., "20 MB")
  language?: string; // Primary programming language of the repository
}

// Main VersionControlDescriptor Interface
export interface VersionControlDescriptor {
  repository: RepoDescriptor; // Repository details
  versionControlBranch?: VersionControlBranch; // Branch details
  versionControlWorkflow?: VersionControlWorkflow; // Workflow details
  sourceContributors?: SourceContributor[]; // List of contributors
  versionControlTags?: VersionControlTag[]; // List of tags
  versionControlMetadata?: VersionControlMetadata; // Metadata information
}

// Interface for Commit
export interface VersionControlCommit {
  hash: string; // Commit hash (e.g., "abc123")
  author: string; // Author of the commit
  date: string; // Date of the commit
  message: string; // Commit message
}

// Interface for Branch Protection Rules
export interface BranchProtectionRules {
  isProtected: boolean; // Whether the branch is protected
  rules?: string[]; // Protection rules (e.g., "require pull request")
}

// Interface for Branch
export interface VersionControlBranch {
  name: string; // Name of the branch (e.g., "main", "develop")
  type: 'main' | 'feature' | 'hotfix' | 'release' | 'custom'; // Type of branch
  lastCommit?: VersionControlCommit; // Details of the last commit
  protection?: BranchProtectionRules; // Branch protection details
}

// Interface for Workflow Policies
export interface WorkflowPolicies {
  reviewRequired: boolean; // Whether reviews are mandatory for merging
  ciChecksRequired: boolean; // Whether CI checks are required
}

// Interface for Workflow
export interface VersionControlWorkflow {
  strategy: 'trunk-based' | 'gitflow' | 'forking' | 'other'; // Version control workflow strategy
  mergeMethod: 'merge' | 'rebase' | 'squash'; // Preferred merge method
  policies?: WorkflowPolicies; // Workflow policies
}

// Interface for Contributors
export interface SourceContributor {
  name: string; // Contributor's name
  email: string; // Contributor's email
  role: 'owner' | 'maintainer' | 'contributor' | 'reviewer'; // Role in the repository
}

export interface RepoDescriptor {
  name: string;
  description?: string;
  url: string;
  type: 'git' | 'svn' | 'mercurial' | 'other';
  enabled?: boolean;
  isPrivate?: boolean;
  remote?: string;
  service?: BaseServiceDescriptor;
  directory?: string; // NEW: Local directory where the repo should be cloned
  credentials: RepoCredentials;
}

export interface DeveloperDescriptor {
  name: string; // Developer or group name
  role?: string; // Role in the project (e.g., 'Lead Developer', 'Contributor')
  contact?: string; // Email or contact link
  profileLink?: string; // Link to personal or group profile (e.g., GitHub)
}

export interface RepoCredentials {
  repoHost: string;
  password?: string;
  accessToken?: string;
}

export interface CommunityDescriptor {
  name: string; // Community name
  type: 'forum' | 'github' | 'mailingList' | 'other';
  link: string; // URL to the community
}

export interface ContributorDescriptor {
  vendors?: VendorDescriptor[];
  developers?: DeveloperDescriptor[];
  communities?: CommunityDescriptor[];
}

export function getVersionControlDescriptor(
  repoPath: string,
): VersionControlDescriptor[] {
  const execGit = (command: string): string =>
    execSync(`git -C ${repoPath} ${command}`, { encoding: 'utf8' }).trim();

  const repositoryName =
    execGit('rev-parse --show-toplevel').split('/').pop() || 'unknown';
  const repositoryUrl = execGit('remote get-url origin');
  const branchName = execGit('rev-parse --abbrev-ref HEAD');
  const lastCommitHash = execGit('rev-parse HEAD');
  const lastCommitMessage = execGit('log -1 --pretty=%B').trim();
  const lastCommitAuthor = execGit('log -1 --pretty=%an');
  const lastCommitDate = execGit('log -1 --pretty=%ad --date=iso');

  return [
    {
      repository: {
        name: repositoryName,
        url: repositoryUrl,
        type: 'git',
        remote: 'origin',
        description: 'A repository managed using Git',
        credentials: { repoHost: 'corpdesk', accessToken: '#CdVault' },
      },
      versionControlBranch: {
        name: branchName,
        type:
          branchName === 'main' || branchName === 'master' ? 'main' : 'custom',
        lastCommit: {
          hash: lastCommitHash,
          author: lastCommitAuthor,
          date: lastCommitDate,
          message: lastCommitMessage,
        },
        protection: {
          isProtected: branchName === 'main' || branchName === 'master',
          rules:
            branchName === 'main' || branchName === 'master'
              ? ['require pull request']
              : [],
        },
      },
      versionControlWorkflow: {
        strategy: 'gitflow',
        mergeMethod: 'merge',
        policies: {
          reviewRequired: true,
          ciChecksRequired: true,
        },
      },
      versionControlMetadata: {
        creationDate: execGit('log --reverse --pretty=%ad --date=iso').split(
          '\n',
        )[0],
        lastUpdated: lastCommitDate,
        license: 'MIT', // Replace with dynamic lookup if needed
        language: 'TypeScript', // Replace with dynamic detection if needed
      },
    },
  ];
}
