import { CdFxReturn, IQuery } from '@/CdCli/sys/base/IBase';
import { CdControllerService } from '../services/cd-controller.service';
import { CdControllerDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-controller-descriptor.model';
import { DevModeModel } from '@/CdCli/sys/dev-mode/models/dev-mode.model';

export class CdControllerController {
  svCdController;
  constructor() {
    this.svCdController = new CdControllerService();
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
  async create(
    d: CdControllerDescriptor,
    devModel: DevModeModel,
  ): Promise<CdFxReturn<null>> {
    return this.svCdController.create(d, devModel);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdControllerDescriptor[]>> {
    return this.svCdController.read(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdController.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdController.delete(q);
  }

  // Get all applications
  async getAllApps(): Promise<CdFxReturn<CdControllerDescriptor[]>> {
    return this.svCdController.getAllApps();
  }

  // Get a single controller by name
  async getControllerByName(
    name: string,
  ): Promise<CdFxReturn<CdControllerDescriptor[]>> {
    return this.svCdController.getControllerByName(name);
  }
}
