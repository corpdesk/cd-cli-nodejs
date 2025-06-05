import { CdFxReturn, IQuery } from '@/CdCli/sys/base/IBase';
import { CdModelService } from '../services/cd-model.service';
import { CdModelDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-model-descriptor.model';
import { CdModuleDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-module-descriptor.model';

export class CdModelController {
  svCdModel;
  constructor() {
    this.svCdModel = new CdModelService();
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
   * - create repository for new model
   * - sync workstation to repository
   * - sync db data
   *
   * @param modelDescriptor
   * @returns
   */
  async create(d: CdModelDescriptor): Promise<CdFxReturn<null>> {
    return this.svCdModel.create(d);
  }

  async createFromSql(
    moduleDescriptor: CdModuleDescriptor,
    pathToSql: string,
  ): Promise<CdFxReturn<null>> {
    return this.svCdModel.createFromSql(moduleDescriptor, pathToSql);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModelDescriptor[]>> {
    return this.svCdModel.read(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdModel.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdModel.delete(q);
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdModelDescriptor[]>> {
    return this.svCdModel.getAllApps();
  }

  // Get a single model by name
  async getModelByName(name: string): Promise<CdFxReturn<CdModelDescriptor[]>> {
    return this.svCdModel.getModelByName(name);
  }
}
