import { CdFxReturn, IQuery } from '@/CdCli/sys/base/IBase';
import { CdModuleService } from '../services/cd-module.service';
import { CdModuleDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-module-descriptor.model';
import { DevModeModel } from '@/CdCli/sys/dev-mode/models/dev-mode.model';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';

export class CdModuleController {
  svCdModule: CdModuleService;
  constructor() {
    this.svCdModule = new CdModuleService();
  }

  /**
   * Create a new module
   *
   * @param moduleDescriptor
   * @returns
   */
  async create(
    d: CdModuleDescriptor,
    model: DevModeModel,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CdModuleController::create()');
    return this.svCdModule.create(d, model);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    return this.svCdModule.read(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    /**
     * - [test -> modify -> new features] cycle
     * - sync module to repository
     */
    return this.svCdModule.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdModule.delete(q);
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    return await this.svCdModule.getAllModules();
  }

  // Get a single module by name
  async getModuleByName(
    name: string,
  ): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    return this.svCdModule.getModuleByName(name);
  }
}
