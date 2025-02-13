// /* eslint-disable style/brace-style */
// /* eslint-disable ts/consistent-type-imports */

import https from 'node:https';
/* eslint-disable style/brace-style */
import type { AxiosRequestConfig } from 'axios';
import type { CdFxReturn, ICdRequest } from './IBase';
import axios from 'axios';
import { CdCliProfileController } from '../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLogg from '../cd-comm/controllers/cd-logger.controller';

export class HttpService {
  private axiosInstance: any;
  ctlCdCliProfile = new CdCliProfileController();

  constructor(private debugMode: boolean = false) {}

  headers: any = {
    method: 'POST',
    url: '/',
    data: null,
  };

  async init(): Promise<void> {
    try {
      const ret = await this.ctlCdCliProfile.getEndPoint();
      if (!ret.state) {
        CdLogg.error('error occured while getting end point data');
        return;
      }
      const baseURL = ret.data;
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
      const ret = await this.ctlCdCliProfile.loadProfiles();

      if (!ret.state || !ret.data) {
        CdLogg.error('error occured while loading profiles');
        return null;
      }

      const cdCliConfig = ret.data;
      // Find the profile named eg: config.cdApiLocal
      const profile = cdCliConfig.items.find(
        (item: any) => item.cdCliProfileName === profileName,
      );

      if (!profile || !profile.cdCliProfileData?.details?.cdEndpoint) {
        throw new Error(
          `Profile config.cdApiLocal with 'cdEndpoint' not found in configuration.`,
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
    // config.cdApiLocal

    try {
      // const url = await this.getCdApiUrl(config.cdApiLocal);

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

  async proc3<T = any>(params: AxiosRequestConfig): Promise<CdFxReturn<T>> {
    if (!this.axiosInstance) {
      return {
        data: null,
        state: false,
        message: 'HttpService is not initialized.',
      };
    }

    if (this.debugMode) {
      CdLogg.debug('HttpService::proc2()/Request:', {
        method: params.method,
        url: params.url,
        headers: params.headers,
        data: params.data,
      });
    }

    try {
      // We remove the explicit type <T> here
      const response = await this.axiosInstance.request(params);

      if (this.debugMode) {
        CdLogg.debug('HttpService::proc2()/Response:', {
          status: response.status,
          data: response.data,
        });
      }

      return { data: response.data as T, state: true };
    } catch (error: any) {
      const errorMessage = error.response ? error.response.data : error.message;

      CdLogg.error(
        'HttpService::proc2()/Error during HTTP request:',
        errorMessage,
      );

      return {
        data: null,
        state: false,
        message: `HTTP Request Failed: ${errorMessage}`,
      };
    }
  }
}
