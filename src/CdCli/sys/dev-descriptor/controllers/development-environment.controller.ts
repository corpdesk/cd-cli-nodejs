/* eslint-disable style/operator-linebreak */
import type { CdFxReturn, CdRequest, IQuery } from '../../base/IBase';
import type { CdDescriptor } from '../models/dev-descriptor.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import {
  type DevelopmentEnvironmentDescriptor,
  developmentEnvironments,
  getDevEnvironmentByName,
} from '../models/development-environment.model';
import { DevelopmentEnvironmentService } from '../services/development-environment.service';
import { DevDescriptorController } from './dev-descriptor.controller';

export class DevelopmentEnvironmentController {
  svDevelopmentEnvironment: DevelopmentEnvironmentService;
  ctlDevDescriptor: DevDescriptorController;
  constructor() {
    this.svDevelopmentEnvironment = new DevelopmentEnvironmentService();
    this.ctlDevDescriptor = new DevDescriptorController();
  }

  async createEnvironment(name: string): Promise<CdFxReturn<null>> {
    const developmentEnvironment: DevelopmentEnvironmentDescriptor =
      await getDevEnvironmentByName(name, developmentEnvironments);

    if (!developmentEnvironment) {
      return {
        data: null,
        state: false,
        message: `Failed to get descriptor with the name ${name}`,
      };
    }
    const result = await this.svDevelopmentEnvironment.setupEnvironment(
      developmentEnvironment,
    );
    CdLogg.debug('result:', result);
    return result;
  }

  /**
   * Create a new development environment
   * - scripts to setup development environment.
   *    - npm
   *    - mysql
   *    - redis
   * - idempotency
   *
   * @param ;d: json data for descriptor for DevelopmentEnvironmentService in the format of CdDescriptor
   * @returns
   */
  async create(d: CdDescriptor): Promise<CdFxReturn<null>> {
    return this.svDevelopmentEnvironment.create(d);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svDevelopmentEnvironment.read(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svDevelopmentEnvironment.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svDevelopmentEnvironment.delete(q);
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svDevelopmentEnvironment.getAllApps();
  }

  // Get a single app by name
  async getAppByName(name: string): Promise<CdFxReturn<CdDescriptor[]>> {
    return this.svDevelopmentEnvironment.getAppByName(name);
  }
}
