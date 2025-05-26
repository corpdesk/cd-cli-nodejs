// export interface GeminiChatMessage {
//   role: 'user' | 'model' | 'system' | 'assistant'; // Gemini typically uses 'user' and 'model' roles
//   content?: string; // The main content of the message
//   parts?: Array<{
//     text: string;
//   }>;
// }

// export interface GeminiCandidate {
//   content?: GeminiChatMessage;
//   finishReason?: string; // e.g., 'STOP', 'MAX_TOKENS'
//   safetyRatings?: Array<{
//     category: string;
//     probability: string;
//   }>;
// }

// export interface GeminiChatResponse {
//   candidates: GeminiCandidate[];
//   usageMetadata?: {
//     promptTokenCount: number;
//     candidatesTokenCount: number;
//     totalTokenCount: number;
//   };
// }

// export interface GeminiModel {
//   name: string; // e.g., "models/gemini-pro"
//   baseModelId?: string;
//   version?: string;
//   displayName?: string;
//   description?: string;
//   inputTokenLimit?: number;
//   outputTokenLimit?: number;
//   supportedGenerationMethods?: string[]; // e.g., "generateContent", "countTokens"
//   temperature?: number;
//   topP?: number;
//   topK?: number;
// }

// export interface GeminiModelListResponse {
//   models: GeminiModel[];
// }

// export interface GeminiRequestConfig {
//   contents: GeminiChatMessage[];
//   generationConfig?: {
//     temperature?: number;
//     candidateCount?: number;
//     maxOutputTokens?: number;
//     topP?: number;
//     topK?: number;
//     stopSequences?: string[];
//   };
//   safetySettings?: Array<{
//     category: string; // e.g., 'HARM_CATEGORY_HARASSMENT'
//     threshold: string; // e.g., 'BLOCK_NONE'
//   }>;
// }

// export const GeminiHttpData = {
//   method: 'POST',
//   headers: {
//     'x-goog-api-key': ``, // Gemini uses 'x-goog-api-key' for API key in headers
//     'Content-Type': 'application/json',
//   },
//   body: '',
// };

// src/CdCli/app/cd-ai/models/cd-gemini.model.ts

// A message unit sent or received from Gemini
export interface GeminiChatMessage {
  role: 'user' | 'model'; // Gemini supports 'user' and 'model' roles
  parts: Array<{
    text: string; // Only text part is used in v1beta
  }>;
}

// A single candidate response from Gemini
export interface GeminiCandidate {
  content: GeminiChatMessage; // Returned message with role and parts
  finishReason?: string; // Why the generation stopped (e.g., STOP)
  avgLogprobs?: number; // (Optional) average log probabilities
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

// Full response from Gemini's generateContent method
export interface GeminiChatResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    promptTokensDetails?: Array<{
      modality: string;
      tokenCount: number;
    }>;
    candidatesTokensDetails?: Array<{
      modality: string;
      tokenCount: number;
    }>;
  };
  modelVersion?: string;
  responseId?: string;
}

// Basic metadata about the Gemini model itself
export interface GeminiModel {
  name: string; // Full model name, e.g., "models/gemini-2.0-flash"
  baseModelId?: string;
  version?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[]; // e.g., ["generateContent"]
  temperature?: number;
  topP?: number;
  topK?: number;
}

// For listing models from the Gemini model list endpoint
export interface GeminiModelListResponse {
  models: GeminiModel[];
}

// Input body for Gemini API requests
export interface GeminiRequestConfig {
  contents: GeminiChatMessage[]; // One or more chat messages (e.g., user input)
  generationConfig?: {
    temperature?: number;
    candidateCount?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string; // e.g., 'BLOCK_NONE'
  }>;
}

// Default Gemini HTTP request config structure
export const GeminiHttpData = {
  method: 'POST',
  headers: {
    'x-goog-api-key': '', // Fill with actual API key when making requests
    'Content-Type': 'application/json',
  },
  body: '', // Will be populated with JSON.stringify(GeminiRequestConfig)
};
