// export interface DeepSeekChatMessage {
//   role: 'system' | 'user' | 'assistant';
//   content: string;
// }

// export interface DeepSeekChatResponse {
//   id: string;
//   object: string;
//   created: number;
//   model: string;
//   choices: Array<{
//     index: number;
//     message: DeepSeekChatMessage;
//     finish_reason: string;
//   }>;
//   usage?: {
//     prompt_tokens: number;
//     completion_tokens: number;
//     total_tokens: number;
//   };
// }

// export interface DeepSeekCompletionResponse {
//   id: string;
//   object: string;
//   created: number;
//   model: string;
//   choices: Array<{
//     text: string;
//     index: number;
//     finish_reason: string;
//   }>;
//   usage?: {
//     prompt_tokens: number;
//     completion_tokens: number;
//     total_tokens: number;
//   };
// }

// export interface DeepSeekModel {
//   id: string;
//   object: string;
//   created?: number;
//   owned_by?: string;
//   [key: string]: any; // to allow extra fields
// }

// export interface DeepSeekModelListResponse {
//   object: string;
//   data: DeepSeekModel[];
// }

// export interface DeepSeekRequestConfig {
//   model: string; // "deepseek-chat", "deepseek-coder", etc.
//   messages: DeepSeekChatMessage[];
//   temperature?: number;
//   max_tokens?: number;
//   top_p?: number;
//   stream?: boolean;
//   stop?: string[];
//   frequency_penalty?: number;
//   presence_penalty?: number;
// }

// export const DeepSeekHttpData = {
//   method: 'POST',
//   headers: {
//     Authorization: ``,
//     'Content-Type': 'application/json',
//   },
//   body: '',
// };

// src/CdCli/app/cd-ai/models/cd-deepseek.model.ts

export interface DeepSeekChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Response from /chat/completions endpoint
export interface DeepSeekChatResponse {
  id: string;
  object: string; // "chat.completion"
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: DeepSeekChatMessage;
    logprobs?: any; // can be null or object if enabled in future
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens: number;
    };
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  };
  system_fingerprint?: string;
}

// (Optional) Only keep if you're calling /completions endpoint
export interface DeepSeekCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Model metadata (for listing)
export interface DeepSeekModel {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
  [key: string]: any;
}

export interface DeepSeekModelListResponse {
  object: string;
  data: DeepSeekModel[];
}

// Config for a DeepSeek chat request
export interface DeepSeekRequestConfig {
  model: string; // e.g., "deepseek-chat", "deepseek-coder"
  messages: DeepSeekChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Request structure
export const DeepSeekHttpData = {
  method: 'POST',
  headers: {
    Authorization: '', // Set your Bearer token here dynamically
    'Content-Type': 'application/json',
  },
  body: '', // Set with JSON.stringify(DeepSeekRequestConfig)
};
