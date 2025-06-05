/* eslint-disable style/brace-style */
// import type { CdFxReturn, CdRequest, IQuery } from '../../base/IBase';
// import type { CdDescriptor } from '../models/dev-descriptor.model';
// import { HttpService } from '../../base/http.service';
// import { CdObjModel } from '../../moduleman/models/cd-obj.model';
// import { DevDescriptorService } from './dev-descriptor.service';
// import { GenericService } from '../../base/generic-service';
// import { CdControllerDescriptor } from '../models/cd-controller-descriptor.model';

import { GenericService } from '@/CdCli/sys/base/generic-service';
import { CD_FX_FAIL, CdFxReturn, IQuery } from '@/CdCli/sys/base/IBase';
import { CdControllerDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-controller-descriptor.model';
import { CdDescriptor } from '@/CdCli/sys/dev-descriptor/models/dev-descriptor.model';
import { DevDescriptorService } from '@/CdCli/sys/dev-descriptor/services/dev-descriptor.service';
import { CdObjModel } from '@/CdCli/sys/moduleman/models/cd-obj.model';

export class CdControllerService extends GenericService<CdObjModel> {
  cdToken;
  svDevDescriptors;
  constructor() {
    super(CdObjModel);
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
   * - create repository for new controller
   * - sync workstation to repository
   * - sync db data
   *
   * @param controllerDescriptor
   * @returns
   */
  async create(d: CdControllerDescriptor): Promise<CdFxReturn<null>> {
    try {
      // const payload = this.svDevDescriptors.setEnvelope('Create', { data: d });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
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
      // const payload = this.svDevDescriptors.setEnvelope('Read', {
      //   query: q ?? { where: {} },
      // });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
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
      // const payload = this.svDevDescriptors.setEnvelope('Update', { query: q });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
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
      // const payload = this.svDevDescriptors.setEnvelope('Delete', { query: q });
      // const httpService = new HttpService();
      // await httpService.init(); // Ensure this is awaited
      // httpService.headers.data = payload;
      // return await httpService.proc3(httpService.headers);
      return CD_FX_FAIL;
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdController type
  }

  // Get all applications
  async getAllControllers(): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      return await this.read(); // Fetch all applications
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve all controllers: ${(error as Error).message}`,
      };
    }
  }

  // Get a single controller by name
  async getControllerByName(name: string): Promise<CdFxReturn<CdDescriptor[]>> {
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
        where: { cdObjName: name }, // Fetch controllers by name
      };

      return await this.read(q);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve controller by name: ${(error as Error).message}`,
      };
    }
  }
}
