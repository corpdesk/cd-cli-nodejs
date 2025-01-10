/* eslint-disable style/brace-style */
/* eslint-disable ts/consistent-type-imports */
import https from 'node:https';
import axios from 'axios';
import config, { CONFIG_FILE_PATH, loadCdCliConfig } from '../../../config';
import CdLogg from '../cd-comm/controllers/cd-logger.controller';
import { ICdRequest } from './IBase'; // Assuming this is imported correctly from your core module

export class HttpService {
  private axiosInstance: any;

  constructor() {}

  /**
   * Initialize the HTTP service by loading configuration and setting up axios.
   * Ensures `axiosInstance` is available before making requests.
   */
  async init(profileName: string): Promise<void> {
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

      // Create axios instance with settings from the profile
      this.axiosInstance = axios.create({
        baseURL: profile.cdCliProfileData.details.cdEndpoint,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Ignore SSL certificate validation
        }),
      });

      CdLogg.info(
        `HttpService initialized with endpoint: ${profile.cdCliProfileData.details.cdEndpoint}`,
      );
    } catch (error) {
      CdLogg.error(
        `Error initializing HttpService: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Process a POST request using the axios instance.
   * @param params The request payload
   */
  async proc(params: ICdRequest): Promise<any> {
    CdLogg.debug('starting proc():', {
      p: params,
    });
    if (!this.axiosInstance) {
      throw new Error('HttpService is not initialized.');
    }

    try {
      CdLogg.debug('Sending request:', params);
      const response = await this.axiosInstance.post('/', params);
      return response.data;
    } catch (error: any) {
      CdLogg.error('Error during HTTP request:', error.message);
      throw new Error(`HTTP Request Failed: ${error.message}`);
    }
  }
}
