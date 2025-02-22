/* eslint-disable style/brace-style */
/* eslint-disable antfu/if-newline */

import type { CdFxReturn } from '../../base/IBase';
import type { BaseDescriptor } from './base-descriptor.model';
import type { EnvironmentDescriptor } from './environment.model';
import type { MigrationDescriptor } from './migration-descriptor.model';
import type { TestingFrameworkDescriptor } from './testing-framework.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { EnvironmentService } from '../services/environment.service';

// Main CiCdDescriptor Interface
export interface CiCdDescriptor extends BaseDescriptor {
  cICdPipeline: CICdPipeline; // Details of the pipeline
  cICdTriggers?: CICdTrigger; // Details of the triggers
  cICdEnvironment?: CICdEnvironment; // Details of the environment
  cICdNotifications?: CICdNotification; // Details of the notifications
  cICdMetadata?: CICdMetadata; // Metadata information
}

// Interface for Pipeline
export interface CICdPipeline extends BaseDescriptor {
  name: string; // Name of the pipeline (e.g., "Build and Deploy Pipeline")
  type: 'integration' | 'delivery' | 'deployment'; // Type of pipeline
  stages: CICdStage[]; // List of stages in the pipeline
}

// Interface for Triggers
export interface CICdTrigger extends BaseDescriptor {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'other'; // Trigger type
  schedule?: string; // Cron-like schedule (e.g., "0 0 * * *")
  branchFilters?: string[]; // Branches that trigger the pipeline
  conditions?: CICdTriggerConditions; // Conditions for triggering the pipeline
}

// Interface for Environment
export interface CICdEnvironment extends BaseDescriptor {
  name: string; // Name of the environment (e.g., "staging", "production")
  url: string; // Environment URL
  type: 'staging' | 'production' | 'testing' | 'custom'; // Environment type
  deploymentStrategy: 'blue-green' | 'canary' | 'rolling' | 'recreate'; // Deployment strategy
}

export interface CICdStage extends BaseDescriptor {
  name: string; // Name of the stage (e.g., "Build", "Test", "Deploy")
  description?: string; // Description of the stage
  tasks: CICdTask[]; // List of tasks in the stage
}

export interface CICdTask<T = any> extends BaseDescriptor {
  name: string;
  type: { name: string; inlineScript: string };
  executor: string;
  status: string;
  methodName?: string; // Store method as a string reference
  method?: (input?: T) => Promise<CdFxReturn<null>>; // Ensure it returns a promise
}

export const methodRegistry = {
  async installDependencies(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input?.workstation) {
      return this.installDependencies(input.workstation);
    } else {
      CdLogg.warning('Skipping installDependencies: workstation is undefined.');
      return { state: false, data: null };
    }
  },
  async cloneRepositories(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input) {
      return this.cloneRepositories(input);
    } else {
      CdLogg.warning('Skipping cloneRepositories: input is undefined.');
      return { state: false, data: null };
    }
  },
  async configureServices(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input) {
      return this.configureServices(input);
    } else {
      CdLogg.warning('Skipping configureServices: input is undefined.');
      return { state: false, data: null };
    }
  },
  async startServices(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input) {
      return this.startServices(input);
    } else {
      CdLogg.warning('Skipping startServices: input is undefined.');
      return { state: false, data: null };
    }
  },
};

export const CdApiSetupTasks: CICdTask<EnvironmentDescriptor>[] = [
  {
    name: 'installDependencies',
    type: { name: 'bash', inlineScript: 'npm install' },
    executor: 'script',
    status: 'pending',
    methodName: 'installDependencies',
  },
  {
    name: 'cloneRepositories',
    type: { name: 'bash', inlineScript: 'git clone <repo_url>' },
    executor: 'script',
    status: 'pending',
    methodName: 'cloneRepositories',
  },
  {
    name: 'configureServices',
    type: { name: 'bash', inlineScript: 'cp .env.example .env' },
    executor: 'script',
    status: 'pending',
    methodName: 'configureServices',
  },
  {
    name: 'startServices',
    type: { name: 'bash', inlineScript: 'pm2 start app.js' },
    executor: 'script',
    status: 'pending',
    methodName: 'startServices',
  },
];

// Function to execute a task given its method name and input
export async function executeTask(
  task: CICdTask<EnvironmentDescriptor>,
  input: EnvironmentDescriptor,
) {
  if (task.methodName && methodRegistry[task.methodName]) {
    // Dynamically call the method from the registry
    const result = await methodRegistry[task.methodName].call(
      new EnvironmentService(),
      input,
    );
    return result;
  } else {
    throw new Error(`Method ${task.methodName} not found in the registry.`);
  }
}

// Task type now allows structured descriptors
export type CICdTaskType =
  | BuildDescriptor
  | TestingFrameworkDescriptor
  | DeploymentDescriptor
  | MigrationDescriptor
  | BashScriptDescriptor // ✅ Added support for Bash scripts
  | CICdNotification;

export interface BuildDescriptor extends BaseDescriptor {
  name: 'build';
  buildTool: 'webpack' | 'babel' | 'vite' | 'other';
  sourceDirectory: string; // Directory containing the source files
  outputDirectory: string; // Directory where the build files are stored
  options?: Record<string, any>; // Optional configurations
}

export interface DeploymentDescriptor extends BaseDescriptor {
  name: 'deploy';
  strategy: 'blue-green' | 'rolling' | 'recreate' | 'canary';
  targetEnvironment: string; // E.g., "staging", "production"
  rollback?: boolean; // Whether rollback is enabled
  deploymentScript?: string; // Optional script for deployment
}

// Interface for Trigger Conditions
export interface CICdTriggerConditions extends BaseDescriptor {
  includeTags: boolean; // Whether to include tags in triggers
  excludeBranches?: string[]; // Branches to exclude
}

// Interface for Notification Channels
export interface CICdNotificationChannel extends BaseDescriptor {
  name: string; // Name of the channel (e.g., "Slack", "Email")
  type: 'slack' | 'email' | 'webhook' | 'custom'; // Notification channel type
  recipients?: string[]; // List of recipients
  messageFormat?: 'text' | 'json'; // Format of the message
}

// Interface for Notifications
export interface CICdNotification extends BaseDescriptor {
  channels: CICdNotificationChannel[]; // List of notification channels
  onEvents: ('success' | 'failure' | 'start' | 'end')[]; // Events that trigger notifications
}

// Interface for Metadata
export interface CICdMetadata extends BaseDescriptor {
  createdBy?: string; // Person or team who created the pipeline
  lastModified?: string; // Last modification date
  version?: string; // Version of the pipeline configuration
  repository?: string; // Associated repository
}

export interface BashScriptDescriptor extends BaseDescriptor {
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
            type: { name: 'bash', inlineScript: '' },
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

export function getCiCdByName(
  names: string[],
  cIcDs: CiCdDescriptor[],
): CiCdDescriptor {
  for (const name of names) {
    const found = cIcDs.find((ciCd) => ciCd.cICdPipeline.name === name);
    if (found) return found;
  }
  return defaultCiCd;
}
