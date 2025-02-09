/* eslint-disable style/brace-style */
import type { CdFxReturn, IQuery } from '../../base/IBase';
import type { CdDescriptor } from '../models/dev-descriptor.model';
import type { DevelopmentEnvironmentDescriptor } from '../models/development-environment.model';
import type {
  OperatingSystemDescriptor,
  WorkstationDescriptor,
} from '../models/workstations.model';
import { BaseService } from '../../base/base.service';
import { HttpService } from '../../base/http.service';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { DependencyService } from './dependency.service';
import { DevDescriptorService } from './dev-descriptor.service';
import { WorkstationService } from './workstation.service';

export class DevelopmentEnvironmentService extends BaseService<CdDescriptor> {
  cdToken: string = '';
  svDevDescriptors: DevDescriptorService;
  svWorkstation: WorkstationService;
  svDependency: DependencyService;
  constructor() {
    super();
    this.svDevDescriptors = new DevDescriptorService();
    this.svWorkstation = new WorkstationService();
    this.svDependency = new DependencyService();
  }

  async setupEnvironment(
    descriptor: DevelopmentEnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      // Step 1: Install Dependencies
      const workstation = descriptor.workstation;
      await this.installDependencies(workstation);

      // Step 2: Clone Repositories
      await this.cloneRepositories(descriptor);

      // Step 3: Configure Services
      await this.configureServices(descriptor);

      // Step 4: Start Required Processes
      await this.startServices(descriptor);

      return {
        data: null,
        state: true,
        message: 'Environment setup successful',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Setup failed: ${(error as Error).message}`,
      };
    }
  }

  private async installDependencies(
    workstation: WorkstationDescriptor,
  ): Promise<CdFxReturn<null>> {
    const totalTasks = workstation.requiredSoftware.length;
    let completedTasks = 0;
    if (!workstation.sshCredentials) {
      return {
        data: null,
        state: true,
        message: `Ssh credentials are missing in the workstation data`,
      };
    }
    try {
      // Detect OS
      const osResult = await this.svWorkstation.detectOs(
        workstation.sshCredentials,
      );
      if (!osResult.state || !osResult.data) {
        return {
          data: null,
          state: false,
          message: `Failed to detect OS for ${workstation.name}: ${osResult.message}`,
        };
      }
      const os = osResult.data;
      console.log(`Detected OS: ${os.name} on ${workstation.name}`);

      for (const dependency of workstation.requiredSoftware) {
        console.log(
          `Checking dependency: ${dependency.name} on ${workstation.name}`,
        );

        // Check if the dependency is already installed
        const isInstalledResult = await this.svDependency.isDependencyInstalled(
          workstation,
          dependency,
        );
        if (!isInstalledResult.state) {
          console.warn(
            `Failed to check if ${dependency.name} is installed: ${isInstalledResult.message}`,
          );
          continue; // Skip to the next dependency
        }

        if (isInstalledResult.data) {
          console.log(
            `Dependency ${dependency.name} is already installed on ${workstation.name}. Skipping...`,
          );
          completedTasks++;
          continue;
        }

        // Fetch relevant installation script
        const scriptResult = await this.svDependency.getInstallationScript(
          dependency,
          os,
        );
        if (!scriptResult.state || !scriptResult.data) {
          console.warn(
            `No installation script found for ${dependency.name} on ${os.name}. Skipping...`,
          );
          completedTasks++;
          continue;
        }

        // Execute the script
        console.log(`Installing ${dependency.name} on ${workstation.name}...`);
        if (workstation.sshCredentials) {
          const executionResult = await this.svWorkstation.executeScript(
            workstation.sshCredentials,
            scriptResult.data,
          );
          if (executionResult.state) {
            console.log(
              `Successfully installed ${dependency.name} on ${workstation.name}`,
            );
          } else {
            console.error(
              `Failed to install ${dependency.name} on ${workstation.name}: ${executionResult.message}`,
            );
          }
        }

        completedTasks++;
        console.log(
          `Progress: ${completedTasks}/${totalTasks} tasks completed`,
        );
      }

      return {
        data: null,
        state: true,
        message: `Dependency installation completed for ${workstation.name}`,
      };
    } catch (error) {
      console.error(
        `Failed to process workstation ${workstation.name}: ${(error as Error).message}`,
      );
      return {
        data: null,
        state: false,
        message: `Failed to install dependencies on ${workstation.name}: ${(error as Error).message}`,
      };
    }
  }

  private async cloneRepositories(
    descriptor: DevelopmentEnvironmentDescriptor,
  ) {
    // Clone 'cd-api', 'sio', and required App modules
    CdLogg.debug(
      'DevelopmentEnvironmentService::cloneRepositories()/descriptor:',
      descriptor,
    );
  }

  private async configureServices(
    descriptor: DevelopmentEnvironmentDescriptor,
  ) {
    // Configure Redis, MySQL, and environment variables
    CdLogg.debug(
      'DevelopmentEnvironmentService::configureServices()/descriptor:',
      descriptor,
    );
  }

  private async startServices(descriptor: DevelopmentEnvironmentDescriptor) {
    // Start services using PM2 or Docker
    CdLogg.debug(
      'DevelopmentEnvironmentService::startServices()/descriptor:',
      descriptor,
    );
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
    return 1; // DevelopmentEnvironment type
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
