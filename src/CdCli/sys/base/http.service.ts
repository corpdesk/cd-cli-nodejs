/* eslint-disable style/brace-style */
/* eslint-disable ts/consistent-type-imports */
import https from 'node:https';
import axios from 'axios';
import config from '../../../config';
import { ICdRequest } from './IBase'; // Assuming this is imported correctly from your core module

export class HttpService {
  debug = false;
  postData: any; // You can define a type for postData if needed
  module = '';
  controller = '';
  resp$: any; // Define this based on your response structure
  token: any;
  params: ICdRequest = {
    ctx: '',
    m: '',
    c: '',
    a: '',
    dat: {
      f_vals: [],
      token: '',
    },
    args: {},
  };

  private axiosInstance: any;

  constructor() {
    // Create axios instance with default settings
    this.axiosInstance = axios.create({
      baseURL: config.cdApiEndPoint, // Change this to the correct endpoint if needed
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Ignore SSL certificate validation
      }),
    });
  }

  // This method processes requests using the axios instance
  async proc(params: ICdRequest): Promise<any> {
    try {
      if (this.debug) {
        console.log('Sending request:', params);
      }

      // Ensure the params are valid and then make the POST request
      const response = await this.axiosInstance.post('/', params);

      // If successful, log or return the response data
      if (this.debug) {
        console.log('Received response:', response);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error during HTTP request:', error.message);
      throw new Error(`HTTP Request Failed: ${error.message}`);
    }
  }

  // Example method for sending a POST request
  async postDataToServer(data: any): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/path-to-endpoint', data);
      return response.data;
    } catch (error: any) {
      console.error('Post data error:', error.message);
      throw new Error(`Post Data Error: ${error.message}`);
    }
  }
}
