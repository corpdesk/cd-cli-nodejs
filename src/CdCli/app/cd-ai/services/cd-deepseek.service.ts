import {
  DeepSeekChatMessage,
  DeepSeekChatResponse,
  DeepSeekHttpData,
  DeepSeekRequestConfig,
} from '../models/cd-deepseek.model';
import { CdAiPromptRequest, CdAiPromptResponse } from '../models/cd-ai.model';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import { EncryptionMeta } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import { AiServiceRegistry } from './cd-ai-registry.service';
import { HttpService } from '@/CdCli/sys/base/http.service';
import { IProfileDetails } from '@/CdCli/sys/cd-cli/models/cd-cli-profile.model';

export class CdDeepSeekService {
  readonly name = 'Deepseek AI';
  readonly type = 'deepseek-ai';

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
  //         message: 'DeepSeek profile not found or decryption failed.',
  //       };
  //     }

  //     const requestBody: DeepSeekRequestConfig = {
  //       model:
  //         request.model ??
  //         profile.defaultRequestConfig?.model ??
  //         'deepseek-chat',
  //       ...profile.defaultRequestConfig,
  //       temperature: request.temperature ?? 0.7,
  //       max_tokens: request.maxTokens ?? 1024,
  //       messages: [
  //         {
  //           role: 'system',
  //           content:
  //             request.type === 'code'
  //               ? 'You are an expert TypeScript developer. Generate clean, efficient code.'
  //               : 'You are a helpful assistant.',
  //         },
  //         { role: 'user', content: request.prompt ?? '' },
  //       ],
  //     };

  //     DeepSeekHttpData.headers.Authorization = `Bearer ${profile.apiKey}`;
  //     DeepSeekHttpData.body = JSON.stringify(requestBody);

  //     const response: Response = await fetch(
  //       `${profile.baseUrl}/chat/completions`,
  //       DeepSeekHttpData,
  //     );

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       CdLog.error(`❌ DeepSeek API error [${response.status}]: ${errorText}`);
  //       return {
  //         success: false,
  //         message: `DeepSeek API call failed with status ${response.status}.`,
  //       };
  //     }

  //     const result = (await response.json()) as DeepSeekChatResponse;

  //     const content = result.choices?.[0]?.message?.content?.trim();
  //     const tokensUsed = result.usage?.total_tokens;

  //     return {
  //       success: true,
  //       message: 'DeepSeek prompt executed successfully.',
  //       content: content ?? '',
  //       usage: {
  //         tokensUsed,
  //         estimatedCost: this.estimateCost(tokensUsed, requestBody.model),
  //       },
  //     };
  //   } catch (error: any) {
  //     CdLog.error(`DeepSeek sendPrompt() error: ${error.message}`);
  //     return {
  //       success: false,
  //       message: `DeepSeek error: ${error.message}`,
  //     };
  //   }
  // }

  static async sendPrompt(
    request: CdAiPromptRequest,
  ): Promise<CdAiPromptResponse> {
    try {
      const profile = await this.getProfile();

      if (!profile) {
        return {
          success: false,
          message: 'DeepSeek profile not found or decryption failed.',
        };
      }

      const requestBody: DeepSeekRequestConfig = {
        model:
          request.model ??
          profile.defaultRequestConfig?.model ??
          'deepseek-chat',
        ...profile.defaultRequestConfig,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1024,
        messages: [
          {
            role: 'system',
            content:
              request.type === 'code'
                ? 'You are an expert TypeScript developer. Generate clean, efficient code.'
                : 'You are a helpful assistant.',
          },
          { role: 'user', content: request.prompt ?? '' },
        ],
      };

      const http = new HttpService(true); // Enable debug for transparency
      const profileName = 'deepSeek';

      const initOk = await http.init(profileName);
      if (!initOk) {
        return {
          success: false,
          message: `Could not initialize HTTP client for ${profileName}`,
        };
      }

      const response = await http.request<DeepSeekChatResponse>(
        {
          method: 'POST',
          url: '/chat/completions',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${profile.apiKey}`,
          },
          data: requestBody,
        },
        profileName,
      );

      if (!response.state || !response.data) {
        return {
          success: false,
          message: response.message ?? 'DeepSeek request failed',
        };
      }

      const content = response.data.choices?.[0]?.message?.content?.trim();
      const tokensUsed = response.data.usage?.total_tokens;

      return {
        success: true,
        message: 'DeepSeek prompt executed successfully.',
        content: content ?? '',
        usage: {
          tokensUsed,
          estimatedCost: this.estimateCost(tokensUsed, requestBody.model),
        },
      };
    } catch (error: any) {
      CdLog.error(`DeepSeek sendPrompt() error: ${error.message}`);
      return {
        success: false,
        message: `DeepSeek error: ${error.message}`,
      };
    }
  }

  private static async getProfile(): Promise<IProfileDetails | null> {
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.getProfileByName('deepseek');

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
        CdLog.warning('DeepSeek API key decryption failed.');
        return null;
      }

      if (!profileData || !profileData.details) {
        CdLog.warning('DeepSeek profile data or details are missing.');
        return null;
      }
      return {
        ...profileData.details,
        apiKey: {
          ...profileData.details.apiKey,
          value: decryptedApiKey,
          isEncrypted: false,
          encryptedValue: undefined,
          encryptionMeta: undefined,
        },
        baseUrl: profileData.details.baseUrl ?? 'https://api.deepseek.com/v1',
        profileName: 'deepseek-ai',
      };
    }

    CdLog.warning(
      'DeepSeek profile is missing valid encrypted API key information.',
    );
    return null;
  }

  private static estimateCost(tokensUsed: number = 0, model: string): number {
    const pricingPer1K: Record<string, number> = {
      'deepseek-chat': 0.001,
      'deepseek-coder': 0.002,
    };
    const rate = pricingPer1K[model] ?? 0.0015;
    return parseFloat(((tokensUsed / 1000) * rate).toFixed(4));
  }
}

new CdDeepSeekService(); // triggers registration
