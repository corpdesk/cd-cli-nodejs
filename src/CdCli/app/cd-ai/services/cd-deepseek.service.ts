// import axios from 'axios';
// import {
//   DeepSeekChatMessage,
//   DeepSeekChatResponse,
//   DeepSeekRequestConfig,
//   DeepSeekHttpData,
// } from '../models/cd-deepseek.model';
// import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
// import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
// import { ProfileDetails } from '../models/cd-ai.model';
// import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
// import { EncryptionMeta } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
// import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';

// export class CdDeepSeekService {
//   private profileService = new CdCliProfileService();
//   private currentProfile?: ProfileDetails;

//   async initialize(profileName?: string): Promise<void> {
//     const profile = await this.getProfile();
//     this.currentProfile = profile === null ? undefined : profile;
//   }

//   async getProfile(): Promise<ProfileDetails | null> {
//     const ctlCdCliProfile = new CdCliProfileController();
//     const profileRet = await ctlCdCliProfile.getProfileByName('deepseek');
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

//   async chat(
//     messages: DeepSeekChatMessage[],
//     config?: Partial<DeepSeekRequestConfig>,
//   ): Promise<DeepSeekChatResponse> {
//     if (!this.currentProfile) {
//       await this.initialize();
//     }

//     const requestConfig: DeepSeekRequestConfig = {
//       ...this.currentProfile?.defaultRequestConfig,
//       ...config,
//       model:
//         config?.model ||
//         this.currentProfile?.defaultRequestConfig?.model ||
//         'deepseek-chat',
//       messages,
//     };

//     const httpData = {
//       ...DeepSeekHttpData,
//       headers: {
//         ...DeepSeekHttpData.headers,
//         Authorization: `Bearer ${this.currentProfile?.apiKey}`,
//       },
//       body: JSON.stringify(requestConfig),
//     };

//     try {
//       const response = await axios.post(
//         `${this.currentProfile?.baseUrl}/chat/completions`,
//         httpData.body,
//         { headers: httpData.headers },
//       );
//       return response.data;
//     } catch (error) {
//       CdLog.error(`DeepSeek chat error: ${error}`);
//       throw error;
//     }
//   }

//   async generateFromPrompt(
//     prompt: string,
//     config?: Partial<DeepSeekRequestConfig>,
//   ): Promise<string> {
//     const messages: DeepSeekChatMessage[] = [{ role: 'user', content: prompt }];

//     const response = await this.chat(messages, config);
//     return response.choices[0]?.message?.content || '';
//   }

//   async generateCode(prompt: string): Promise<string> {
//     const messages: DeepSeekChatMessage[] = [
//       {
//         role: 'system',
//         content:
//           'You are an expert TypeScript developer. Generate clean, efficient code.',
//       },
//       { role: 'user', content: prompt },
//     ];

//     const response = await this.chat(messages, { model: 'deepseek-coder' });
//     return response.choices[0]?.message?.content || '';
//   }

//   async listModels(): Promise<any> {
//     if (!this.currentProfile) {
//       await this.initialize();
//     }

//     try {
//       const response = await axios.get(
//         `${this.currentProfile?.baseUrl}/models`,
//         {
//           headers: {
//             Authorization: `Bearer ${this.currentProfile?.apiKey}`,
//           },
//         },
//       );
//       return response.data;
//     } catch (error) {
//       CdLog.error(`DeepSeek list models error: ${error}`);
//       throw error;
//     }
//   }
// }

import {
  DeepSeekChatMessage,
  DeepSeekChatResponse,
  DeepSeekHttpData,
  DeepSeekRequestConfig,
} from '../models/cd-deepseek.model';
import {
  CdAiPromptRequest,
  CdAiPromptResponse,
  ProfileDetails,
} from '../models/cd-ai.model';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';
import { EncryptionMeta } from '@/CdCli/sys/cd-cli/models/cd-cli-vault.model';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import { AiServiceRegistry } from './cd-ai-registry.service';

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

      DeepSeekHttpData.headers.Authorization = `Bearer ${profile.apiKey}`;
      DeepSeekHttpData.body = JSON.stringify(requestBody);

      const response = await fetch(
        `${profile.baseUrl}/chat/completions`,
        DeepSeekHttpData,
      );

      if (!response.ok) {
        const errorText = await response.text();
        CdLog.error(`❌ DeepSeek API error [${response.status}]: ${errorText}`);
        return {
          success: false,
          message: `DeepSeek API call failed with status ${response.status}.`,
        };
      }

      const result = (await response.json()) as DeepSeekChatResponse;

      const content = result.choices?.[0]?.message?.content?.trim();
      const tokensUsed = result.usage?.total_tokens;

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

  private static async getProfile(): Promise<ProfileDetails | null> {
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
        apiKey: decryptedApiKey,
        baseUrl: profileData.details.baseUrl ?? 'https://api.deepseek.com/v1',
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
