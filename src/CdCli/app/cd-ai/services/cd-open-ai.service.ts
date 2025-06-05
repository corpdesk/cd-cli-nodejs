// src/CdCli/app/cd-ai/services/cd-open-ai.service.ts

import {
  ChatMessage,
  ChatResponse,
  OpenAiHttpData,
  OpenAiRequestConfig,
} from '../models/cd-open-ai.model';
import { CdAiPromptRequest, CdAiPromptResponse } from '../models/cd-ai.model';
import { join } from 'node:path';
import fs from 'node:fs';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import { EncryptionMeta } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
import { AiServiceRegistry } from './cd-ai-registry.service';
import { HttpService } from '@/CdCli/sys/base/http.service';
import { IProfileDetails } from '@/CdCli/sys/cd-cli/models/cd-cli-profile.model';

export class CdOpenAiService {
  readonly name = 'Open AI';
  readonly type = 'open-ai';

  constructor() {
    AiServiceRegistry.register(this);
  }
  async init() {
    // Initialize API clients, keys etc.
  }
  async getBudgetStatus(): Promise<{
    used: number;
    limit: number;
    remaining: number;
  }> {
    // Pull from service or cache
    return { used: 10, limit: 100, remaining: 90 };
  }

  // static async sendPrompt(
  //   request: CdAiPromptRequest,
  // ): Promise<CdAiPromptResponse> {
  //   try {
  //     const profile = await this.getProfile();

  //     if (!profile) {
  //       return {
  //         success: false,
  //         message: 'OpenAI profile not found or decryption failed.',
  //       };
  //     }

  //     const requestBody: OpenAiRequestConfig = {
  //       model:
  //         request.model ??
  //         profile.defaultRequestConfig?.model ??
  //         'gpt-3.5-turbo',
  //       ...profile.defaultRequestConfig,
  //       temperature: request.temperature ?? 0.7,
  //       max_tokens: request.maxTokens ?? 1024,
  //       messages: [
  //         { role: 'system', content: 'You are a helpful assistant.' },
  //         { role: 'user', content: request.prompt ?? '' },
  //       ],
  //     };

  //     OpenAiHttpData.headers.Authorization = `Bearer ${profile.apiKey}`;
  //     OpenAiHttpData.body = JSON.stringify(requestBody);

  //     const response = await fetch(
  //       `${profile.baseUrl}/chat/completions`,
  //       OpenAiHttpData,
  //     );

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       CdLog.error(`❌ OpenAI API error [${response.status}]: ${errorText}`);
  //       return {
  //         success: false,
  //         message: `OpenAI API call failed with status ${response.status}.`,
  //       };
  //     }

  //     const result = (await response.json()) as ChatResponse;

  //     const content = result.choices?.[0]?.message?.content?.trim();
  //     const tokensUsed = result.usage?.total_tokens;

  //     return {
  //       success: true,
  //       message: 'OpenAI prompt executed successfully.',
  //       content: content ?? '',
  //       usage: {
  //         tokensUsed,
  //         estimatedCost: this.estimateCost(tokensUsed, requestBody.model),
  //       },
  //     };
  //   } catch (error: any) {
  //     CdLog.error(`OpenAI sendPrompt() error: ${error.message}`);
  //     return {
  //       success: false,
  //       message: `OpenAI error: ${error.message}`,
  //     };
  //   }
  // }
  static async sendPrompt(
    request: CdAiPromptRequest,
  ): Promise<CdAiPromptResponse> {
    const profileName = 'openai';

    try {
      const profile = await this.getProfile();

      if (!profile || !profile.apiKey || !profile.baseUrl) {
        return {
          success: false,
          message: 'OpenAI profile not found or decryption failed.',
        };
      }

      const model =
        request.model ?? profile.defaultRequestConfig?.model ?? 'gpt-3.5-turbo';

      const requestBody: OpenAiRequestConfig = {
        ...profile.defaultRequestConfig,
        model,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1024,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: request.prompt ?? '' },
        ],
      };

      const httpService = new HttpService(true);
      const initialized = await httpService.init(profileName, profile.baseUrl);
      if (!initialized) {
        return {
          success: false,
          message: `Failed to initialize HTTP client for '${profileName}'.`,
        };
      }

      const response = await httpService.request<ChatResponse>(
        {
          method: 'POST',
          url: '/chat/completions',
          headers: {
            Authorization: `Bearer ${profile.apiKey}`,
            'Content-Type': 'application/json',
          },
          data: requestBody,
        },
        profileName,
      );

      if (!response.state || !response.data) {
        return {
          success: false,
          message: response.message || 'OpenAI API call failed.',
        };
      }

      const result = response.data;

      const content = result.choices?.[0]?.message?.content?.trim();
      const tokensUsed = result.usage?.total_tokens;

      return {
        success: true,
        message: 'OpenAI prompt executed successfully.',
        content: content ?? '',
        usage: {
          tokensUsed,
          estimatedCost: this.estimateCost(tokensUsed, model),
        },
      };
    } catch (error: any) {
      CdLog.error(`OpenAI sendPrompt() error: ${error.message}`);
      return {
        success: false,
        message: `OpenAI error: ${error.message}`,
      };
    }
  }

  private static async getProfile(): Promise<IProfileDetails | null> {
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.getProfileByName('open-ai');

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
        CdLog.warning('OpenAI API key decryption failed.');
        return null;
      }

      if (!profileData || !profileData.details) {
        CdLog.warning('OpenAI profile data or details are missing.');
        return null;
      }
      return {
        ...profileData.details,
        apiKey: {
          ...profileData.details.apiKey,
          value: decryptedApiKey,
        },
        baseUrl: profileData.details.baseUrl ?? 'https://api.openai.com/v1',
      };
    }

    CdLog.warning(
      'OpenAI profile is missing valid encrypted API key information.',
    );
    return null;
  }

  private static estimateCost(tokensUsed: number = 0, model: string): number {
    const pricingPer1K: Record<string, number> = {
      'gpt-3.5-turbo': 0.0015,
      'gpt-4': 0.03,
    };
    const rate = pricingPer1K[model] ?? 0.01;
    return parseFloat(((tokensUsed / 1000) * rate).toFixed(4));
  }
}

new CdOpenAiService(); // triggers registration
