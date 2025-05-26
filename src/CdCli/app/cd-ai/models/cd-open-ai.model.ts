import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { safeStringify } from '@/CdCli/sys/utilities/safe-stringify';
import { CdOpenAiController } from '../controllers/cd-open-ai.controller';

export interface ChatMessage {
  role: 'user' | 'model' | 'system' | 'assistant';
  content: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
}

export interface OpenAiCompletionChoice {
  text: string;
  index: number;
  logprobs: any;
  finish_reason: string;
}

export interface OpenAiCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAiCompletionChoice[];
}

export interface OpenAiModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
  [key: string]: any; // to allow extra fields
}

export interface OpenAiModelListResponse {
  object: string;
  data: OpenAiModel[];
}

/////////////////////////////////////////////////////
export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAiRequestConfig {
  model: string; // "gpt-4" | "gpt-3.5-turbo"
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

// export interface ProfileDetails {
//   apiKey: string;
//   orgId?: string;
//   baseUrl?: string;
// }

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
//   defaultRequestConfig?: Partial<OpenAiRequestConfig>;
// }

export const OpenAiHttpData = {
  method: 'POST',
  headers: {
    Authorization: ``,
    'Content-Type': 'application/json',
  },
  body: '',
};

//////////////////////////////////////////////////////////////////////////

export const CD_OPEN_AI_CMD = {
  name: 'openai',
  description: 'Interact with OpenAI from cd-cli.',
  subcommands: [
    {
      name: 'generate',
      description: 'Generate code from a prompt',
      options: [
        {
          flags: '--prompt <prompt>',
          description: 'Prompt to send to OpenAI',
        },
      ],
      action: {
        execute: async (options: { prompt: string }) => {
          CdLog.debug('CdAutoGitController::getGitHubProfile()/options:', {
            p: safeStringify(options),
          });
          const ctlCdOpenAi = new CdOpenAiController();
          options.prompt =
            'Hi, I am a software engineer. Currently testing the OpenAi API. Just confirming if the prompt is passed correctly.';
          await ctlCdOpenAi.generateFromPrompt(options.prompt);
        },
      },
    },
    {
      name: 'describe',
      description: 'Generate code from Corpdesk descriptors',
      action: {
        execute: async () => {
          const ctlCdOpenAi = new CdOpenAiController();
          await ctlCdOpenAi.generateCodeFromDescriptor(); // already defined
        },
      },
    },
  ],
};
