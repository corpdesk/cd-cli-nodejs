/**
 * 
 * Usage Guide
 * ***********************************************
//  1. Using Preset Profile (cdApiLocal)
const httpService = new HttpService(true); // Enable debugMode
const postData: ICdRequest;
const result = await httpService.proc(
  postData,
  'cdApiLocal', // Optional since it's the default
);

if (result.state) {
  console.log('✅ Modules:', result.data);
} else {
  console.error('❌ Error:', result.message);
}

***************************************************

// 2. Using profile:
const httpService = new HttpService(true); // With debug logs
// Optionally initialize the profile (skipped automatically if `request()` or `proc()` is called)
await httpService.init('deepseek');

const profileName = 'deepseek';

const config: AxiosRequestConfig = {
  method: 'POST',
  url: '/chat/completions',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer #apiKey', // Will be decrypted automatically
  },
  data: {
    model: 'deepseek-chat',
    messages: [
      { role: 'user', content: 'What is the capital of Kenya?' },
    ],
  },
};

// Make the request (profile must exist in your cd-cli profile list)
const response = await httpService.request(config, profileName);

if (response.state) {
  console.log('✅ Response from Deepseek:', response.data);
} else {
  console.error('❌ Error calling Deepseek:', response.message);
}

*************************************************************************
3.

const profileDetails = profile.cdCliProfileData.details;
const result = await httpService.request(profileDetails.httpConfig, 'deepseek');

*******************************************************************************

4. Typical profile with httpConfig

{
  "cdCliProfileName": "deepseek",
  "cdCliProfileData": {
    "details": {
      "apiKey": {
        "name": "apiKey",
        "description": "Encrypted Deepseek API key",
        "value": null,
        "encryptedValue": "<long-encrypted-string>",
        "isEncrypted": true,
        "encryptionMeta": {
          "name": "default",
          "algorithm": "aes-256-cbc",
          "encoding": "hex",
          "ivLength": 16,
          "iv": "<iv-hex>",
          "encryptedAt": "2025-05-25T10:24:35.527Z"
        }
      },
      "baseUrl": "https://api.deepseek.com/v1",
      "defaultModel": "deepseek-chat",
      "cryptFields": ["apiKey"],
      "httpConfig": {
        "method": "POST",
        "url": "/chat/completions",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer #apiKey"
        },
        "data": null
      },
      "encrypted": true
    }
  }
}




 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as https from 'https';
import { CdCliProfileController } from '../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLog from '../cd-comm/controllers/cd-logger.controller';
import type { CdFxReturn, ICdRequest, ICdResponse } from './IBase';
import { IProfileDetails } from '../cd-cli/models/cd-cli-profile.model';
import config from '@/config';
import CdCliVaultController from '../cd-cli/controllers/cd-cli-vault.controller';

export class HttpService {
  private instances: Map<string, AxiosInstance> = new Map();
  ctlCdCliProfile = new CdCliProfileController();
  cdApiAxiosConfig?: AxiosRequestConfig;

  constructor(private debugMode = false) {
    this.presetConfigs();
  }

  presetConfigs() {
    this.cdApiAxiosConfig = {
      method: 'POST',
      url: config.cdApi.endpoint,
      data: null,
    };

    const defaultInstance = axios.create({
      baseURL: config.cdApi.endpoint,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    this.instances.set('cdApiLocal', defaultInstance);
    CdLog.info(`Preset Axios instance for profile: cdApiLocal`);
  }

  async init(profileName = 'cdApiLocal', endpoint?: string): Promise<boolean> {
    const resolvedEndpoint =
      endpoint || (await this.resolveEndpointFromProfile(profileName));
    if (!resolvedEndpoint) return false;

    const axiosInstance = axios.create({
      baseURL: resolvedEndpoint,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    this.instances.set(profileName, axiosInstance);
    CdLog.info(
      `Initialized Axios for profile: ${profileName} (${resolvedEndpoint})`,
    );
    return true;
  }

  async resolveEndpointFromProfile(
    profileName: string,
  ): Promise<string | null> {
    const result = await this.ctlCdCliProfile.loadProfiles();

    if (!result.state || !result.data) {
      CdLog.error(`Unable to load profiles.`);
      return null;
    }

    const profile = result.data.items.find(
      (item: any) => item.cdCliProfileName === profileName,
    );

    const details: IProfileDetails = profile?.cdCliProfileData?.details || {};
    const endpoint = details.endpoint || details.cdEndpoint;

    if (!endpoint) {
      CdLog.error(`Profile '${profileName}' is missing a valid endpoint.`);
      return null;
    }

    return endpoint;
  }

  resolveEndpointFromDetails(details: IProfileDetails): string {
    if (!details.endpoint) {
      throw new Error("Missing required 'endpoint' in profile details.");
    }
    return details.endpoint;
  }

  async getCdApiUrl(profileName = 'cdApiLocal'): Promise<string | null> {
    const result = await this.ctlCdCliProfile.loadProfiles();

    if (!result.state || !result.data) {
      CdLog.error(`Unable to load profiles.`);
      return null;
    }

    const profile = result.data.items.find(
      (item: any) => item.cdCliProfileName === profileName,
    );

    const endpoint = profile?.cdCliProfileData?.details?.cdEndpoint;
    if (!endpoint) {
      CdLog.error(`Profile '${profileName}' is missing a cdEndpoint.`);
      return null;
    }

    return endpoint;
  }

  /**
   * Generic HTTP request
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    profileName = 'cdApiLocal',
  ): Promise<CdFxReturn<T>> {
    const instance = this.instances.get(profileName);
    if (!instance) {
      return {
        state: false,
        data: null,
        message: `Axios instance for '${profileName}' not initialized.`,
      };
    }

    try {
      if (this.debugMode) {
        CdLog.debug(`HttpService::request()`, config);
      }

      const response = await instance.request<T>(config);

      if (this.debugMode) {
        CdLog.debug('HttpService::response()', {
          status: response.status,
          data: response.data,
        });
      }

      return {
        state: true,
        data: response.data,
        message: 'Request succeeded.',
      };
    } catch (err: any) {
      const message =
        err.response?.data?.app_state?.info?.app_msg ||
        err.response?.data ||
        err.message;

      CdLog.error('HttpService::request()/Error', message);

      return {
        state: false,
        data: null,
        message: `HTTP Request Failed: ${message}`,
      };
    }
  }

  /**
   * Profile-aware proc wrapper with support for httpConfig from profile.details
   */
  async proc(
    params: ICdRequest,
    profileName = 'cdApiLocal',
  ): Promise<CdFxReturn<ICdResponse>> {
    if (!this.instances.has(profileName)) {
      const initialized = await this.init(profileName);
      if (!initialized) {
        throw new Error(`Profile '${profileName}' could not be initialized.`);
      }
    }

    const result = await this.ctlCdCliProfile.loadProfiles();

    if (!result.state || !result.data) {
      throw new Error('Unable to load profiles.');
    }

    const profile = result.data.items.find(
      (item: any) => item.cdCliProfileName === profileName,
    );

    const details: IProfileDetails = profile?.cdCliProfileData?.details || {};
    let config: AxiosRequestConfig;

    if (details.httpConfig) {
      config = JSON.parse(JSON.stringify(details.httpConfig));
      config.data = params;

      // 🔐 Decrypt crypt fields (e.g. apiKey) before using them
      const decryptedFields = await this.decryptProfileFields(details);

      // 🔁 Replace placeholders like #apiKey in all headers
      if (config.headers && typeof config.headers === 'object') {
        for (const [key, val] of Object.entries(config.headers)) {
          if (typeof val === 'string') {
            config.headers[key] = val.replace(
              /#(\w+)/g,
              (_, token) => decryptedFields[token] || '',
            );
          }
        }
      }
    } else {
      if (!this.cdApiAxiosConfig) {
        throw new Error('cdApiAxiosConfig is not initialized.');
      }
      config = { ...this.cdApiAxiosConfig, data: params };
    }

    return this.request<ICdResponse>(config, profileName);
  }

  private async decryptProfileFields(
    details: IProfileDetails,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    if (!details.cryptFields || !Array.isArray(details.cryptFields)) {
      return result;
    }

    for (const fieldName of details.cryptFields) {
      const field = details[fieldName];

      if (field?.isEncrypted && field.encryptedValue && field.encryptionMeta) {
        try {
          const decryptedValue = await CdCliVaultController.decrypt(
            field.encryptionMeta,
            field.encryptedValue,
          );
          result[fieldName] = decryptedValue ?? '';
        } catch (e) {
          CdLog.error(
            `Failed to decrypt field '${fieldName}':${(e as Error).message}`,
          );
          result[fieldName] = ''; // Fail silently with empty string
        }
      } else if (typeof field?.value === 'string') {
        result[fieldName] = field.value;
      }
    }

    return result;
  }
}
