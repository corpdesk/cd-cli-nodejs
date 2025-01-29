/* eslint-disable antfu/if-newline */

import type { BaseDescriptor } from './base-descriptor.model';

// Main CiCdDescriptor Interface
export interface CiCdDescriptor extends BaseDescriptor {
  cICdPipeline: CICdPipeline; // Details of the pipeline
  cICdTriggers: CICdTrigger; // Details of the triggers
  cICdEnvironment: CICdEnvironment; // Details of the environment
  cICdNotifications?: CICdNotification; // Details of the notifications
  cICdMetadata?: CICdMetadata; // Metadata information
}

// Interface for Tasks
export interface CICdTask {
  name: string; // Name of the task (e.g., "Run Unit Tests", "Install Dependencies")
  type: 'build' | 'test' | 'deploy' | 'notification' | 'custom'; // Type of task
  executor: 'script' | 'docker' | 'runner' | 'custom'; // Task executor
  status?: 'pending' | 'running' | 'success' | 'failed'; // Current status of the task
  duration?: string; // Duration of the task (e.g., "2m 30s")
  logs?: string[]; // Logs generated during the task
}

// Interface for Stages
export interface CICdStage {
  name: string; // Name of the stage (e.g., "Build", "Test", "Deploy")
  description?: string; // Description of the stage
  tasks: CICdTask[]; // List of tasks in the stage
}

// Interface for Pipeline
export interface CICdPipeline {
  name: string; // Name of the pipeline (e.g., "Build and Deploy Pipeline")
  type: 'integration' | 'delivery' | 'deployment'; // Type of pipeline
  stages: CICdStage[]; // List of stages in the pipeline
}

// Interface for Trigger Conditions
export interface CICdTriggerConditions {
  includeTags: boolean; // Whether to include tags in triggers
  excludeBranches?: string[]; // Branches to exclude
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

export const knownCiCds: CiCdDescriptor[] = [
  {
    cICdPipeline: {
      name: 'GitHub Actions - Build and Deploy',
      type: 'integration',
      stages: [
        {
          name: 'Build',
          description: 'Build the application',
          tasks: [
            {
              name: 'Install Dependencies',
              type: 'build',
              executor: 'runner',
              status: 'success',
              duration: '2m 15s',
            },
            {
              name: 'Compile Code',
              type: 'build',
              executor: 'runner',
              status: 'success',
              duration: '1m 45s',
            },
          ],
        },
        {
          name: 'Test',
          description: 'Run tests for the application',
          tasks: [
            {
              name: 'Run Unit Tests',
              type: 'test',
              executor: 'script',
              status: 'success',
              duration: '3m 10s',
            },
          ],
        },
        {
          name: 'Deploy',
          description: 'Deploy to production',
          tasks: [
            {
              name: 'Deploy to Staging',
              type: 'deploy',
              executor: 'docker',
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
      name: 'Production',
      url: 'https://app.example.com',
      type: 'production',
      deploymentStrategy: 'blue-green',
    },
  },
  {
    cICdPipeline: {
      name: 'CircleCI - Test and Deploy',
      type: 'delivery',
      stages: [
        {
          name: 'Test',
          description: 'Run all automated tests',
          tasks: [
            {
              name: 'Run Integration Tests',
              type: 'test',
              executor: 'docker',
              status: 'running',
            },
          ],
        },
        {
          name: 'Deploy',
          description: 'Deploy to staging environment',
          tasks: [
            {
              name: 'Deploy Docker Image',
              type: 'deploy',
              executor: 'docker',
              status: 'pending',
            },
          ],
        },
      ],
    },
    cICdTriggers: {
      type: 'pull_request',
      branchFilters: ['develop'],
    },
    cICdEnvironment: {
      name: 'Staging',
      url: 'https://staging.example.com',
      type: 'staging',
      deploymentStrategy: 'rolling',
    },
    cICdNotifications: {
      channels: [
        {
          name: 'Slack',
          type: 'slack',
          recipients: ['#devops'],
          messageFormat: 'text',
        },
      ],
      onEvents: ['failure', 'success'],
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
