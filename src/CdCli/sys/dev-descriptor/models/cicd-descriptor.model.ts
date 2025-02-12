/* eslint-disable antfu/if-newline */

import type { BaseDescriptor } from './base-descriptor.model';
import type { MigrationDescriptor } from './migration-descriptor.model';
import type { TestingFrameworkDescriptor } from './testing-framework.model';

// Main CiCdDescriptor Interface
export interface CiCdDescriptor extends BaseDescriptor {
  cICdPipeline: CICdPipeline; // Details of the pipeline
  cICdTriggers: CICdTrigger; // Details of the triggers
  cICdEnvironment: CICdEnvironment; // Details of the environment
  cICdNotifications?: CICdNotification; // Details of the notifications
  cICdMetadata?: CICdMetadata; // Metadata information
}

// Interface for Pipeline
export interface CICdPipeline {
  name: string; // Name of the pipeline (e.g., "Build and Deploy Pipeline")
  type: 'integration' | 'delivery' | 'deployment'; // Type of pipeline
  stages: CICdStage[]; // List of stages in the pipeline
}

// Interface for Triggers
export interface CICdTrigger {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'other'; // Trigger type
  schedule?: string; // Cron-like schedule (e.g., "0 0 * * *")
  branchFilters?: string[]; // Branches that trigger the pipeline
  conditions?: CICdTriggerConditions; // Conditions for triggering the pipeline
}

// Interface for Environment
export interface CICdEnvironment {
  name: string; // Name of the environment (e.g., "staging", "production")
  url: string; // Environment URL
  type: 'staging' | 'production' | 'testing' | 'custom'; // Environment type
  deploymentStrategy: 'blue-green' | 'canary' | 'rolling' | 'recreate'; // Deployment strategy
}

// Interface for Stages
export interface CICdStage {
  name: string; // Name of the stage (e.g., "Build", "Test", "Deploy")
  description?: string; // Description of the stage
  tasks: CICdTask[]; // List of tasks in the stage
}

export interface CICdTask {
  name: string; // Name of the task (e.g., "Run Unit Tests", "Install Dependencies")
  type: CICdTaskType | string; // More structured task type
  executor: 'script' | 'docker' | 'runner' | 'custom'; // Task executor
  status?: 'pending' | 'running' | 'success' | 'failed'; // Current status of the task
  duration?: string; // Duration of the task (e.g., "2m 30s")
  logs?: string[]; // Logs generated during the task
}

// Task type now allows structured descriptors
export type CICdTaskType =
  | BuildDescriptor
  | TestingFrameworkDescriptor
  | DeploymentDescriptor
  | MigrationDescriptor
  | BashScriptDescriptor // ✅ Added support for Bash scripts
  | CICdNotification;

export interface BuildDescriptor {
  name: 'build';
  buildTool: 'webpack' | 'babel' | 'vite' | 'other';
  sourceDirectory: string; // Directory containing the source files
  outputDirectory: string; // Directory where the build files are stored
  options?: Record<string, any>; // Optional configurations
}

export interface DeploymentDescriptor {
  name: 'deploy';
  strategy: 'blue-green' | 'rolling' | 'recreate' | 'canary';
  targetEnvironment: string; // E.g., "staging", "production"
  rollback?: boolean; // Whether rollback is enabled
  deploymentScript?: string; // Optional script for deployment
}

// Interface for Trigger Conditions
export interface CICdTriggerConditions {
  includeTags: boolean; // Whether to include tags in triggers
  excludeBranches?: string[]; // Branches to exclude
}

// Interface for Notification Channels
export interface CICdNotificationChannel {
  name: string; // Name of the channel (e.g., "Slack", "Email")
  type: 'slack' | 'email' | 'webhook' | 'custom'; // Notification channel type
  recipients?: string[]; // List of recipients
  messageFormat?: 'text' | 'json'; // Format of the message
}

// Interface for Notifications
export interface CICdNotification {
  channels: CICdNotificationChannel[]; // List of notification channels
  onEvents: ('success' | 'failure' | 'start' | 'end')[]; // Events that trigger notifications
}

// Interface for Metadata
export interface CICdMetadata {
  createdBy?: string; // Person or team who created the pipeline
  lastModified?: string; // Last modification date
  version?: string; // Version of the pipeline configuration
  repository?: string; // Associated repository
}

export interface BashScriptDescriptor {
  name: 'bash';
  scriptPath?: string; // Path to the Bash script
  inlineScript?: string; // Inline script content
  environmentVariables?: Record<string, string>; // Env vars to pass to the script
}

export const knownCiCds: CiCdDescriptor[] = [
  {
    cICdPipeline: {
      name: 'Corpdesk CI/CD - Bash Deployment',
      type: 'deployment',
      stages: [
        {
          name: 'Deployment',
          description: 'Deploy Corpdesk using Bash scripts',
          tasks: [
            {
              name: 'Stop existing services',
              type: {
                name: 'bash',
                inlineScript:
                  'systemctl stop corpdesk-api && systemctl stop corpdesk-ui',
              },
              executor: 'script',
              status: 'pending',
            },
            {
              name: 'Pull latest code',
              type: {
                name: 'bash',
                inlineScript: 'git pull origin main',
              },
              executor: 'script',
              status: 'pending',
            },
            {
              name: 'Start services',
              type: {
                name: 'bash',
                inlineScript:
                  'systemctl start corpdesk-api && systemctl start corpdesk-ui',
              },
              executor: 'script',
              status: 'pending',
            },
          ],
        },
      ],
    },
    cICdTriggers: {
      type: 'push',
      branchFilters: ['main'],
      conditions: { includeTags: true },
    },
    cICdEnvironment: {
      name: 'production',
      url: 'https://corpdesk.com',
      type: 'production',
      deploymentStrategy: 'rolling',
    },
  },
];

export const defaultCiCd: CiCdDescriptor = {
  cICdPipeline: {
    name: 'Default CI/CD Pipeline',
    type: 'integration',
    stages: [
      {
        name: 'Build',
        description: 'Default build stage',
        tasks: [
          {
            name: 'Default Build Task',
            type: 'build',
            executor: 'script',
            status: 'pending',
          },
        ],
      },
    ],
  },
  cICdTriggers: {
    type: 'manual',
    conditions: { includeTags: false },
  },
  cICdEnvironment: {
    name: 'Default Environment',
    url: 'http://localhost',
    type: 'testing',
    deploymentStrategy: 'recreate',
  },
};

export function getCiCd(
  names: string[],
  cIcDs: CiCdDescriptor[],
): CiCdDescriptor {
  for (const name of names) {
    const found = cIcDs.find((ciCd) => ciCd.cICdPipeline.name === name);
    if (found) return found;
  }
  return defaultCiCd;
}
