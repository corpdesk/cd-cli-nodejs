import {
  GeminiChatMessage,
  GeminiChatResponse,
  GeminiHttpData,
  GeminiRequestConfig,
} from '../models/cd-gemini.model';
import {
  CdAiPromptRequest,
  CdAiPromptResponse,
  ProfileDetails,
} from '../models/cd-ai.model';
import { join } from 'node:path';
import fs from 'node:fs';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import { EncryptionMeta } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
import { AiServiceRegistry } from './cd-ai-registry.service';
import { BudgetStatus } from '../models/budget-guard.model';

export class CdGeminiService {
  readonly name = 'Gemini AI';
  readonly type = 'gemini-ai';

  constructor() {
    AiServiceRegistry.register(this);
  }

  async init() {
    // Initialize API clients, keys etc.
  }

  async getBudgetStatus(): Promise<BudgetStatus> {
    // Pull from service or cache
    return { used: 10, limit: 100, remaining: 90 };
  }

  static async sendPrompt(
    request: CdAiPromptRequest,
  ): Promise<CdAiPromptResponse> {
    try {
      const profile = await this.getProfile();

      if (!profile) {
        return {
          success: false,
          message: 'Gemini profile not found or decryption failed.',
        };
      }

      // Default model for Gemini is 'gemini-pro' for text generation
      const model =
        request.model ?? profile.defaultRequestConfig?.model ?? 'gemini-pro';

      const requestBody: GeminiRequestConfig = {
        contents: [
          // Gemini generally doesn't require a 'system' role.
          // The 'user' role is used for all input prompts.
          { role: 'user', parts: [{ text: request.prompt ?? '' }] },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 1024,
          // Add other generationConfig properties as needed based on Gemini API
          // candidateCount: 1, // Default to 1 candidate
          // topP: 0.9,
          // topK: 40,
        },
        // safetySettings: [ // Example safety settings, can be customized
        //   { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        //   { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        // ],
      };

      // If messages are provided (for chat interactions), override the prompt-based contents
      if (Array.isArray(request.messages) && request.messages.length > 0) {
        requestBody.contents = request.messages.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user', // Map 'assistant' to 'model' for Gemini
          parts: [{ text: msg.content }],
        }));
      }

      GeminiHttpData.headers['x-goog-api-key'] = profile.apiKey; // Set API key in header
      GeminiHttpData.body = JSON.stringify(requestBody);

      const response = await fetch(
        `${profile.baseUrl}/v1beta/models/${model}:generateContent`, // Gemini API endpoint for content generation
        GeminiHttpData,
      );

      if (!response.ok) {
        const errorText = await response.text();
        CdLog.error(`❌ Gemini API error [${response.status}]: ${errorText}`);
        return {
          success: false,
          message: `Gemini API call failed with status ${response.status}.`,
        };
      }

      const result = (await response.json()) as GeminiChatResponse;

      const content = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      const tokensUsed = result.usageMetadata?.totalTokenCount;

      return {
        success: true,
        message: 'Gemini prompt executed successfully.',
        content: content ?? '',
        usage: {
          tokensUsed,
          estimatedCost: this.estimateCost(tokensUsed, model),
        },
      };
    } catch (error: any) {
      CdLog.error(`Gemini sendPrompt() error: ${error.message}`);
      return {
        success: false,
        message: `Gemini error: ${error.message}`,
      };
    }
  }

  private static async getProfile(): Promise<ProfileDetails | null> {
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.getProfileByName('gemini'); // Fetch profile for 'gemini'

    if (!profileRet.state) return null;

    const profile = profileRet.data;
    const profileData = profile?.cdCliProfileData;
    const apiKeyField = profileData?.details?.apiKey;

    if (
      apiKeyField?.isEncrypted &&
      apiKeyField?.encryptedValue &&
      apiKeyField?.encryptionMeta
    ) {
      const encryptionMeta = apiKeyField.encryptionMeta as EncryptionMeta & {
        iv: string;
      };
      const decryptedApiKey = await CdCliVaultController.decrypt(
        encryptionMeta,
        apiKeyField.encryptedValue,
      );

      if (!decryptedApiKey) {
        CdLog.warning('Gemini API key decryption failed.');
        return null;
      }

      if (!profileData || !profileData.details) {
        CdLog.warning('Gemini profile data or details are missing.');
        return null;
      }
      return {
        ...profileData.details,
        apiKey: decryptedApiKey,
        baseUrl:
          profileData.details.baseUrl ??
          'https://generativelanguage.googleapis.com', // Default Gemini API base URL
      };
    }

    CdLog.warning(
      'Gemini profile is missing valid encrypted API key information.',
    );
    return null;
  }

  private static estimateCost(tokensUsed: number = 0, model: string): number {
    // Note: Gemini pricing can vary significantly based on model and region.
    // This is a placeholder and should be updated with actual pricing.
    // As of my last update, specific per-token pricing for all Gemini models
    // is often tiered or usage-based, so a direct per-token rate might not be
    // as straightforward as OpenAI's.
    // For general text models (like gemini-pro), example pricing for 1K tokens
    // might be around $0.00025 for input and $0.0005 for output, but verify
    // the latest Google Cloud pricing for Generative AI.
    const pricingPer1K: Record<string, number> = {
      'gemini-pro': 0.00075, // Placeholder: average of input/output for general use
      'gemini-ultra': 0.005, // Placeholder: assuming a higher tier model
      // Add other Gemini models and their specific pricing here
    };
    const rate = pricingPer1K[model] ?? 0.001; // Default fallback rate
    return parseFloat(((tokensUsed / 1000) * rate).toFixed(6)); // More precision for lower costs
  }

  // adapter service methods for Gemini API
  static toGeminiRequest(input: CdAiPromptRequest): GeminiRequestConfig {
    return {
      contents: (input.messages || [])
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: msg.parts
            ? msg.parts.map((text) => ({ text }))
            : [{ text: msg.content }],
        })),
      generationConfig: {
        temperature: input.temperature,
        maxOutputTokens: input.maxTokens,
      },
    };
  }

  static fromGeminiResponse(response: GeminiChatResponse): CdAiPromptResponse {
    const content =
      response.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      '';
    return {
      success: true,
      message: 'OK',
      content,
      data: response,
      usage: {
        tokensUsed: response.usageMetadata?.totalTokenCount,
      },
    };
  }
}

new CdGeminiService(); // triggers registration
