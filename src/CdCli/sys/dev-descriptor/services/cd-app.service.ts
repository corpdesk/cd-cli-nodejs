/* eslint-disable style/brace-style */
import type { CdFxReturn, CdRequest, IQuery } from '../../base/IBase';
import type { CdDescriptor } from '../models/dev-descriptor.model';
import { BaseService } from '../../base/base.service';
import { HttpService } from '../../base/http.service';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { CdObjModel } from '../../moduleman/models/cd-obj.model';
import { DevDescriptorService } from './dev-descriptor.service';

export class CdAppService extends BaseService {
  cdToken;
  svDevDescriptors;
  constructor() {
    super();
    this.svDevDescriptors = new DevDescriptorService();
  }

  /**
   * Create a new application
   * CdApi:
   * - setup development environment
   *    - npm
   *    - mysql
   *    - redis
   *    - ssl
   * - migration files
   * - clone corpdesk if not yet done
   * - create repository for new module
   * - sync workstation to repository
   * - sync db data
   *
   * @param appDescriptor
   * @returns
   */
  async create(d: CdDescriptor): Promise<CdFxReturn<null>> {
    try {
      const payload = this.svDevDescriptors.setEnvelope('Create', { data: d });
      const httpService = new HttpService();
      await httpService.init(); // Ensure this is awaited
      httpService.headers.data = payload;
      return await httpService.proc3(httpService.headers);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      /**
       * The q is allowed to be null
       * If null it is substituted by { where: {} }
       * Which would then fetch all the data
       */
      const payload = this.svDevDescriptors.setEnvelope('Read', {
        query: q ?? { where: {} },
      });
      const httpService = new HttpService();
      await httpService.init(); // Ensure this is awaited
      httpService.headers.data = payload;
      return await httpService.proc3(httpService.headers);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      const payload = this.svDevDescriptors.setEnvelope('Update', { query: q });
      const httpService = new HttpService();
      await httpService.init(); // Ensure this is awaited
      httpService.headers.data = payload;
      return await httpService.proc3(httpService.headers);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      const payload = this.svDevDescriptors.setEnvelope('Delete', { query: q });
      const httpService = new HttpService();
      await httpService.init(); // Ensure this is awaited
      httpService.headers.data = payload;
      return await httpService.proc3(httpService.headers);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdApp type
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      return await this.read(); // Fetch all applications
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve all apps: ${(error as Error).message}`,
      };
    }
  }

  // Get a single app by name
  async getAppByName(name: string): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      // Validate input
      if (!name.trim()) {
        return {
          data: null,
          state: false,
          message: 'Application name is required.',
        };
      }

      // Define the query
      const q: IQuery = {
        select: ['cdObjId', 'cdObjName', 'cdObjGuid', 'jDetails'], // Fields to select
        where: { cdObjName: name }, // Fetch apps by name
      };

      return await this.read(q);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve app by name: ${(error as Error).message}`,
      };
    }
  }
}
