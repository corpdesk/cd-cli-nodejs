// import {
//   ChatMessage,
//   ChatResponse,
//   OpenAiHttpData,
//   type OpenAiModelListResponse,
//   type OpenAiRequestConfig,
// } from '../models/cd-open-ai.model';
// import { join } from 'node:path';
// import fs from 'node:fs';
// import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
// import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
// import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
// import { EncryptionMeta } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
// import { ProfileDetails } from '../models/cd-ai.model';

// export class CdOpenAiService {
//   async getProfile(): Promise<ProfileDetails | null> {
//     const ctlCdCliProfile = new CdCliProfileController();
//     const profileRet = await ctlCdCliProfile.getProfileByName('open-ai');
//     CdLog.debug(
//       `OpenAiService::getProfile()/profileRet:${JSON.stringify(profileRet)}`,
//     );
//     if (!profileRet.state) {
//       return null;
//     }

//     // Step 1: Get the profile data
//     const profile = profileRet.data;
//     if (!profile || !profile.cdCliProfileData) {
//       return null;
//     }
//     const profileData = profile.cdCliProfileData;
//     CdLog.debug(
//       `OpenAiService::getProfile()/profileData:${JSON.stringify(profileData)}`,
//     );

//     // const profileData = profile.cdCliProfileData;
//     const apiKeyField = profileData.details.apiKey;

//     if (
//       apiKeyField &&
//       apiKeyField.isEncrypted &&
//       apiKeyField.encryptedValue &&
//       apiKeyField.encryptionMeta
//     ) {
//       // Step 2: Prepare metadata
//       const encryptionMeta = apiKeyField.encryptionMeta as EncryptionMeta & {
//         iv: string;
//       };
//       const encryptedValue = apiKeyField.encryptedValue;

//       // Step 3: Decrypt
//       const decryptedApiKey = await CdCliVaultController.decrypt(
//         encryptionMeta,
//         encryptedValue,
//       );

//       if (!decryptedApiKey) {
//         CdLog.warning('Decryption failed. Provide a valid OpenAI API key.');
//         // Optional: handle fallback, prompt user, etc.
//         return null;
//       } else {
//         CdLog.debug(`Decrypted OpenAI API key:${decryptedApiKey}`);
//         // Use the key as needed, e.g. store temporarily:
//         profileData.details.apiKey = decryptedApiKey;
//         const baseUrl =
//           profileData.details.baseUrl ?? 'https://api.openai.com/v1';
//         CdLog.debug(`OpenAiService::getProfile()/baseUrl:${baseUrl}`);
//         const apiKey = decryptedApiKey;
//         CdLog.debug(`OpenAiService::getProfile()/apiKey:${apiKey}`);
//         if (!baseUrl || !apiKey) {
//           throw new Error(
//             'Missing GitHub baseUrl or apiKey. Ensure open-ai profile is configured correctly.',
//           );
//         }
//         const profileDetails = {
//           ...profileData.details,
//           apiKey,
//           baseUrl,
//         } as ProfileDetails;
//         if (!profileDetails) {
//           return null;
//         }
//         return profileDetails;
//       }
//     } else {
//       throw new Error('Invalid or incomplete encrypted API key information.');
//     }
//   }

//   async generateFromPrompt(prompt: string): Promise<string> {
//     const profile = await this.getProfile();
//     CdLog.debug(
//       `OpenAiService::generateFromPrompt()/profile:${JSON.stringify(profile)}`,
//     );
//     CdLog.debug(`OpenAiService::generateFromPrompt()/prompt:${prompt}`);
//     if (!profile) return 'OpenAI profile not found.';

//     const requestBody: OpenAiRequestConfig = {
//       model: profile.defaultRequestConfig?.model ?? 'gpt-3.5-turbo',
//       ...profile.defaultRequestConfig,
//       messages: [
//         { role: 'system', content: 'You are a helpful assistant.' },
//         { role: 'user', content: prompt },
//       ],
//     };
//     OpenAiHttpData.headers.Authorization = `Bearer ${profile.apiKey}`;
//     OpenAiHttpData.body = JSON.stringify(requestBody);

//     try {
//       const response = await fetch(
//         `${profile.baseUrl}/chat/completions`,
//         OpenAiHttpData,
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         CdLog.error(`❌ OpenAI API error [${response.status}]: ${errorText}`);
//         return '❌ OpenAI API call failed.';
//       }

//       const result = (await response.json()) as ChatResponse;
//       const output =
//         result.choices?.[0]?.message?.content?.trim() ??
//         '⚠️ No result from OpenAI.';
//       CdLog.info(`Generated Output:\n${output}`);
//       return output;
//     } catch (err: any) {
//       CdLog.error('❌ Exception during OpenAI request:', err);
//       return '❌ Exception occurred while communicating with OpenAI.';
//     }
//   }

//   async chat(messages: ChatMessage[]): Promise<ChatResponse> {
//     const profile = await this.getProfile();
//     if (!profile) throw new Error('OpenAI profile not configured');

//     const response = await fetch(`${profile.baseUrl}/chat/completions`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${profile.apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo',
//         messages,
//       }),
//     });

//     return (await response.json()) as ChatResponse;
//   }

//   async getModelList(): Promise<string[]> {
//     const profile = await this.getProfile();
//     if (!profile) return [];

//     const response = await fetch(`${profile.baseUrl}/models`, {
//       headers: {
//         Authorization: `Bearer ${profile.apiKey}`,
//       },
//     });

//     const result = (await response.json()) as OpenAiModelListResponse;
//     return result.data?.map((m: any) => m.id) ?? [];
//   }
// }

// src/CdCli/app/cd-ai/services/cd-open-ai.service.ts

import {
  ChatMessage,
  ChatResponse,
  OpenAiHttpData,
  OpenAiRequestConfig,
} from '../models/cd-open-ai.model';
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

  static async sendPrompt(
    request: CdAiPromptRequest,
  ): Promise<CdAiPromptResponse> {
    try {
      const profile = await this.getProfile();

      if (!profile) {
        return {
          success: false,
          message: 'OpenAI profile not found or decryption failed.',
        };
      }

      const requestBody: OpenAiRequestConfig = {
        model:
          request.model ??
          profile.defaultRequestConfig?.model ??
          'gpt-3.5-turbo',
        ...profile.defaultRequestConfig,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1024,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: request.prompt ?? '' },
        ],
      };

      OpenAiHttpData.headers.Authorization = `Bearer ${profile.apiKey}`;
      OpenAiHttpData.body = JSON.stringify(requestBody);

      const response = await fetch(
        `${profile.baseUrl}/chat/completions`,
        OpenAiHttpData,
      );

      if (!response.ok) {
        const errorText = await response.text();
        CdLog.error(`❌ OpenAI API error [${response.status}]: ${errorText}`);
        return {
          success: false,
          message: `OpenAI API call failed with status ${response.status}.`,
        };
      }

      const result = (await response.json()) as ChatResponse;

      const content = result.choices?.[0]?.message?.content?.trim();
      const tokensUsed = result.usage?.total_tokens;

      return {
        success: true,
        message: 'OpenAI prompt executed successfully.',
        content: content ?? '',
        usage: {
          tokensUsed,
          estimatedCost: this.estimateCost(tokensUsed, requestBody.model),
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

  private static async getProfile(): Promise<ProfileDetails | null> {
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
        apiKey: decryptedApiKey,
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
