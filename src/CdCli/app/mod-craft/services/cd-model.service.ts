/* eslint-disable style/brace-style */

import { CdModuleDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-module-descriptor.model';
import { DevModeModel } from '@/CdCli/sys/dev-mode/models/dev-mode.model';
import { CICdRunnerService } from '@/CdCli/sys/dev-descriptor/services/cd-ci-runner.service';
import { CdObjModel } from '@/CdCli/sys/moduleman/models/cd-obj.model';
import { GenericService } from '@/CdCli/sys/base/generic-service';
import { DevDescriptorService } from '@/CdCli/sys/dev-descriptor/services/dev-descriptor.service';
import { CdFxReturn, IQuery } from '@/CdCli/sys/base/IBase';
import { CdDescriptor } from '@/CdCli/sys/dev-descriptor/models/dev-descriptor.model';

export class CdModelService extends GenericService<CdObjModel> {
  cdToken;
  svDevDescriptors;

  constructor() {
    super(CdObjModel);

    this.svDevDescriptors = new DevDescriptorService();
  }

  /**
   * Create a new module by following the provided workflow.
   */
  // async create(
  //   descriptor: CdModuleDescriptor,
  //   model: DevModeModel,
  // ): Promise<CdFxReturn<null>> {
  //   return await this.runner.run(model.workflow, descriptor);
  // }
  async createFromSql(
    moduleDescriptor: CdModuleDescriptor,
    pathToSql: string,
  ) {}

  async createFromDescriptor(
    moduleDescriptor: CdModuleDescriptor,
    pathToSql: string,
  ) {}

  async read(q?: IQuery): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      // Implement the actual read logic here or return a default value
      return {
        data: [],
        state: true,
        message: 'Read executed successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdModel type
  }

  // Get all applications
  async getAllModels(): Promise<CdFxReturn<CdDescriptor[]>> {
    try {
      return await this.read(); // Fetch all applications
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve all models: ${(error as Error).message}`,
      };
    }
  }

  // Get a single model by name
  async getModelByName(name: string): Promise<CdFxReturn<CdDescriptor[]>> {
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
        where: { cdObjName: name }, // Fetch models by name
      };

      return await this.read(q);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve model by name: ${(error as Error).message}`,
      };
    }
  }
}
