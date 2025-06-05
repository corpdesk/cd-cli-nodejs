// src/CdCli/app/cd-ai/models/cd-ai.model.ts

import { CdAiLogRouterService } from '../services/cd-ai-log-router.service';
import { BudgetStatus } from './budget-guard.model';
import { DeepSeekRequestConfig } from './cd-deepseek.model';
import { OpenAiRequestConfig } from './cd-open-ai.model';

export interface CdAiPromptRequest {
  provider: 'openai' | 'gemini' | 'deepseek';
  type: 'chat' | 'code' | 'image' | 'audio' | 'video';
  model?: string;
  messages?: CdAiMessage[]; // Always unified shape
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, any>;
  files?: Array<{ name: string; type: string; data: string }>;
}

export interface CdAiMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
  parts?: string[]; // Optional for Gemini
}

export interface CdAiPromptResponse {
  success: boolean;
  message: string;
  content?: string;
  data?: any; // For images, audio, etc.
  usage?: {
    tokensUsed?: number;
    estimatedCost?: number;
  };
}

// export interface ProfileDetails {
//   profileName: string;
//   description?: string;
//   apiKey: string;
//   orgId?: string;
//   baseUrl: string;
//   organizationId?: string;
//   openAiProjectName?: string;
//   encrypted?: boolean;
//   cryptFields?: string[];
//   defaultRequestConfig?: Partial<OpenAiRequestConfig | DeepSeekRequestConfig>;
// }

export interface CdAiServiceInterface {
  readonly name: string;
  readonly type: string;
  init(): Promise<void>;
  getBudgetStatus(): Promise<BudgetStatus>;
}

// export const CD_AI_LOGS_CMD = {
//   name: 'logs',
//   description: 'Access internal AI logs.',
//   subcommands: [
//     {
//       name: 'ai',
//       description: 'Show buffered background logs from the AI module.',
//       action: {
//         execute: () => {
//           const logs = CdAiLogRouterService.getLogs();
//           logs.forEach((line) => console.log(line));
//         },
//       },
//     },
//   ],
// };

export const CD_AI_LOGS_CMD = {
  name: 'logs',
  description: 'Access internal AI logs.',
  subcommands: [
    {
      name: 'ai',
      description: 'Show buffered background logs from the AI module.',
      action: {
        execute: () => {
          const logs = CdAiLogRouterService.getLogs();
          if (logs.length === 0) {
            console.log('No logs found.');
            return;
          }

          logs.forEach((line) => console.log(line));
        },
      },
    },
  ],
};
