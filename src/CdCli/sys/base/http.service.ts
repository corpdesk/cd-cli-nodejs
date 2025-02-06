// /* eslint-disable style/brace-style */
// /* eslint-disable ts/consistent-type-imports */
// import https from 'node:https';
// import axios from 'axios';
// import { loadCdCliConfig } from '../../../config';
// import CdLogg from '../cd-comm/controllers/cd-logger.controller';
// import { ICdRequest } from './IBase'; // Assuming this is imported correctly from your core module

// export class HttpService {
//   private axiosInstance: any;

//   constructor() {}

//   /**
//    * Initialize the HTTP service by loading configuration and setting up axios.
//    * Ensures `axiosInstance` is available before making requests.
//    */
//   async init(profileName: string): Promise<void> {
//     try {
//       // Load the configuration file
//       const cdCliConfig = await loadCdCliConfig();

//       // Find the profile named eg: 'cd-api-local'
//       const profile = cdCliConfig.items.find(
//         (item: any) => item.cdCliProfileName === profileName,
//       );

//       if (!profile || !profile.cdCliProfileData?.details?.cdEndpoint) {
//         throw new Error(
//           `Profile 'cd-api-local' with 'cdEndpoint' not found in configuration.`,
//         );
//       }

//       // Create axios instance with settings from the profile
//       this.axiosInstance = axios.create({
//         baseURL: profile.cdCliProfileData.details.cdEndpoint,
//         httpsAgent: new https.Agent({
//           rejectUnauthorized: false, // Ignore SSL certificate validation
//         }),
//       });

//       CdLogg.info(
//         `HttpService initialized with endpoint: ${profile.cdCliProfileData.details.cdEndpoint}`,
//       );
//     } catch (error) {
//       CdLogg.error(
//         `Error initializing HttpService: ${(error as Error).message}`,
//       );
//       throw error;
//     }
//   }

//   /**
//    * Process a POST request using the axios instance.
//    * @param params The request payload
//    */
//   async proc(params: ICdRequest): Promise<any> {
//     await this.init('cd-api-local');
//     CdLogg.debug('starting proc():', {
//       p: params,
//     });
//     if (!this.axiosInstance) {
//       throw new Error('HttpService is not initialized.');
//     }

//     try {
//       CdLogg.debug('Sending request:', params);
//       const response = await this.axiosInstance.post('/', params);
//       return response.data;
//     } catch (error: any) {
//       CdLogg.error('Error during HTTP request:', error.message);
//       throw new Error(`HTTP Request Failed: ${error.message}`);
//     }
//   }
// }

import https from 'node:https';
/* eslint-disable style/brace-style */
import type { AxiosRequestConfig } from 'axios';
import type { ICdRequest } from './IBase';
import config, { loadCdCliConfig } from '@/config';
import axios from 'axios';
import { CdCliProfileController } from '../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLogg from '../cd-comm/controllers/cd-logger.controller';

export class HttpService {
  private axiosInstance: any;

  constructor(private debugMode: boolean = false) {}

  async init(): Promise<void> {
    try {
      const ctlCdCliProfile = new CdCliProfileController();
      const baseURL = await ctlCdCliProfile.getEndPoint(config.cdApiLocal);
      if (baseURL) {
        this.axiosInstance = axios.create({
          baseURL,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        });
      } else {
        CdLogg.error('Could not get baseUrl!');
      }

      CdLogg.info(`HttpService initialized with endpoint: ${baseURL}`);
    } catch (error) {
      CdLogg.error(
        `Error initializing HttpService: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async getCdApiUrl(profileName: string): Promise<string | null> {
    try {
      // Load the configuration file
      const cdCliConfig = await loadCdCliConfig();

      // Find the profile named eg: 'cd-api-local'
      const profile = cdCliConfig.items.find(
        (item: any) => item.cdCliProfileName === profileName,
      );

      if (!profile || !profile.cdCliProfileData?.details?.cdEndpoint) {
        throw new Error(
          `Profile 'cd-api-local' with 'cdEndpoint' not found in configuration.`,
        );
      }

      CdLogg.info(
        `HttpService initialized with endpoint: ${profile.cdCliProfileData.details.cdEndpoint}`,
      );
      return profile.cdCliProfileData.details.cdEndpoint;
    } catch (error) {
      CdLogg.error(
        `Error initializing HttpService: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Process a POST request using the axios instance.
   * @param params The request payload
   */
  async proc(params: ICdRequest): Promise<any> {
    // 'cd-api-local'

    try {
      // const url = await this.getCdApiUrl('cd-api-local');

      await this.init();
      CdLogg.debug('starting proc():', {
        p: params,
      });
      if (!this.axiosInstance) {
        throw new Error('HttpService is not initialized.');
      }

      CdLogg.debug('Sending request:', params);
      const response = await this.axiosInstance.post('/', params);
      return response.data;
    } catch (error: any) {
      CdLogg.error('Error during HTTP request:', error.message);
      throw new Error(`HTTP Request Failed: ${error.message}`);
    }
  }

  async proc2(params: AxiosRequestConfig): Promise<any> {
    if (!this.axiosInstance) {
      throw new Error('HttpService is not initialized.');
    }

    if (this.debugMode) {
      // Log detailed request data
      CdLogg.debug('HttpService::proc()/Request:', {
        method: params.method,
        url: params.url,
        headers: params.headers,
        data: params.data,
      });
    }

    try {
      const response = await this.axiosInstance.request(params);

      if (this.debugMode) {
        // Log detailed response data
        CdLogg.debug('HttpService::proc()/Response:', {
          status: response.status,
          data: response.data,
        });
      }

      return response.data;
    } catch (error: any) {
      CdLogg.error(
        'HttpService::proc()/Error during HTTP request:',
        error.response ? error.response.data : error.message,
      );
      throw new Error(`HTTP Request Failed: ${error.message}`);
    }
  }
}
