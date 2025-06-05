/* eslint-disable style/brace-style */

import { GenericService } from '@/CdCli/sys/base/generic-service';
import { HttpService } from '@/CdCli/sys/base/http.service';
import { CD_FX_FAIL, CdFxReturn, IQuery } from '@/CdCli/sys/base/IBase';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { CdModuleDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-module-descriptor.model';
import { CdDescriptor } from '@/CdCli/sys/dev-descriptor/models/dev-descriptor.model';
import { CICdRunnerService } from '@/CdCli/sys/dev-descriptor/services/cd-ci-runner.service';
import { DevDescriptorService } from '@/CdCli/sys/dev-descriptor/services/dev-descriptor.service';
import { DevModeModel } from '@/CdCli/sys/dev-mode/models/dev-mode.model';
import { CdObjModel } from '@/CdCli/sys/moduleman/models/cd-obj.model';

export class CdModuleService extends GenericService<CdObjModel> {
  cdToken;
  svDevDescriptors;
  private runner!: CICdRunnerService;

  constructor() {
    super(CdObjModel);
    this.svDevDescriptors = new DevDescriptorService();
  }

  init(): this {
    this.runner = new CICdRunnerService();
    return this;
  }

  async create(
    descriptor: CdModuleDescriptor,
    model: DevModeModel,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CdModuleService::create()');
    return await this.runner.run(descriptor, model.workflow);
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
  async createByAi(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async createByJson(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async createByWizard(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async createByContext(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    try {
      /**
       * The q is allowed to be null
       * If null it is substituted by { where: {} }
       * Which would then fetch all the data
       */
      const payload = this.svDevDescriptors.setEnvelope('Read', {
        query: q ?? { where: {} },
      });
      return CD_FX_FAIL; // placeholder until this method is properly implemented
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
      return CD_FX_FAIL; // placeholder until this method is properly implementedce.headers);
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
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdModule type
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdModuleDescriptor[]>> {
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
  async getModuleByName(
    name: string,
  ): Promise<CdFxReturn<CdModuleDescriptor[]>> {
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
