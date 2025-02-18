/* eslint-disable style/indent */
/* eslint-disable antfu/if-newline */

/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { CdFxReturn, IQuery } from '../../base/IBase';
import type { DependencyDescriptor } from '../models/dependancy-descriptor.model';
import type { CdDescriptor } from '../models/dev-descriptor.model';
import type { DevelopmentEnvironmentDescriptor } from '../models/development-environment.model';
import type { BaseServiceDescriptor } from '../models/service-descriptor.model';
import type {
  OperatingSystemDescriptor,
  WorkstationAccessDescriptor,
  WorkstationDescriptor,
} from '../models/workstations.model';
import { CdAutoGitController } from '@/CdCli/app/cd-auto-git/controllers/cd-auto-git.controller';
import { BaseService } from '../../base/base.service';
import { HttpService } from '../../base/http.service';
import { ProgressTrackerService } from '../../cd-cli/services/progress-tracker.service';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { ServiceController } from '../controllers/service.controller';
import { WorkstationAccessController } from '../controllers/workstation-access.controller';
import { DependencyService } from './dependency.service';
import { DevDescriptorService } from './dev-descriptor.service';
import { SshService } from './ssh.service';
import { WorkstationService } from './workstation.service';

export class DevelopmentEnvironmentService extends BaseService {
  cdToken: string = '';
  svDevDescriptors: DevDescriptorService;
  svWorkstation: WorkstationService;
  svDependency: DependencyService;
  ctlWorkstationAccess: WorkstationAccessController;
  svSsh: SshService;
  progressTracker = new ProgressTrackerService();
  ctlService: ServiceController;

  stepMap: {
    key: string;
    method: () => Promise<CdFxReturn<null>>;
    totalTasks: number;
    completedTasks: number;
  }[] = [];

  constructor() {
    super();
    this.svDevDescriptors = new DevDescriptorService();
    this.svWorkstation = new WorkstationService();
    this.svDependency = new DependencyService();
    this.ctlWorkstationAccess = new WorkstationAccessController();
    this.svSsh = new SshService();
    this.ctlService = new ServiceController();
  }

  initializeStepMap(devEnviron: DevelopmentEnvironmentDescriptor) {
    const steps = [
      {
        key: 'installDependencies',
        method: () => this.installDependencies(devEnviron.workstation),
      },
      {
        key: 'cloneRepositories',
        method: () => this.cloneRepositories(devEnviron),
      },
      {
        key: 'configureServices',
        method: () => this.configureServices(devEnviron),
      },
      {
        key: 'startServices',
        method: () => this.startServices(devEnviron),
      },
    ];

    steps.forEach(({ key, method }) => {
      this.progressTracker.registerStep(key, method, 0); // Register steps in ProgressTrackerService
    });
  }

  /**
   * Example Usage
    Run Full Setup:
    await devEnvService.setupEnvironment(devEnviron);
    Run Only Step 2 (Clone Repositories):
    await devEnvService.setupEnvironment(devEnviron, [2]);
    Run Steps 2 & 4:
    await devEnvService.setupEnvironment(devEnviron, [2, 4]);
   * @param devEnviron
   * @param steps
   * @returns
   */
  async setupEnvironment(
    devEnviron: DevelopmentEnvironmentDescriptor,
    steps?: number[],
  ): Promise<CdFxReturn<null>> {
    try {
      // ✅ Ensure steps are registered first
      this.initializeStepMap(devEnviron);

      const registeredSteps = this.progressTracker.getSteps();

      for (let i = 0; i < registeredSteps.length; i++) {
        if (steps && !steps.includes(i + 1)) continue; // Skip steps not included

        const { key, method, totalTasks } = registeredSteps[i];

        // Update progress
        this.progressTracker.updateProgress(key, 'in-progress', totalTasks, 0);

        const result = await method();

        if (!result.state) {
          this.progressTracker.updateProgress(key, 'failed');
          return result; // Stop execution on failure
        }

        this.progressTracker.updateProgress(
          key,
          'completed',
          totalTasks,
          totalTasks,
        );
      }

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
    const stepKey = 'installDependencies';
    const totalTasks = workstation.requiredSoftware?.length || 0;
    let completedTasks = 0;

    this.progressTracker.updateProgress(
      stepKey,
      'in-progress',
      totalTasks,
      completedTasks,
    );

    try {
      if (
        !workstation.workstationAccess.accessScope ||
        !workstation.workstationAccess.physicalAccess ||
        !workstation.workstationAccess.transport
      ) {
        this.progressTracker.updateProgress(
          stepKey,
          'completed',
          totalTasks,
          totalTasks,
        );
        return {
          data: null,
          state: true,
          message: 'No software is registered for installation',
        };
      }

      const result: CdFxReturn<{ completedTasks: number }> =
        this.svSsh.requiresSSH(
          workstation.workstationAccess.accessScope,
          workstation.workstationAccess.physicalAccess,
          workstation.workstationAccess.transport,
        )
          ? await this.svDependency.handleRemoteInstallation(
              workstation,
              totalTasks,
              completedTasks,
            )
          : await this.svDependency.handleLocalInstallation(
              workstation,
              totalTasks,
              completedTasks,
            );

      completedTasks = result.data?.completedTasks ?? completedTasks;

      this.progressTracker.updateProgress(
        stepKey,
        'completed',
        totalTasks,
        completedTasks,
      );
      return {
        data: null,
        state: true,
        message: 'Dependency installation completed',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Dependency installation failed: ${(error as Error).message}`,
      };
    }
  }

  getPackageManager(dependency: DependencyDescriptor): string {
    switch (dependency.source) {
      case 'npm':
        return 'npm';
      case 'cdn':
        return 'wget';
      case 'repository':
        return 'git';
      case 'system':
      case 'local':
        return 'apt'; // Default for Linux, can be extended for macOS (brew) or Windows (choco)
      default:
        return 'custom-installer'; // Fallback for unknown sources
    }
  }

  async installSoftware(
    workstation: WorkstationDescriptor,
    os: any | null,
    sshCredentials: any | null,
    totalTasks: number,
    completedTasks: number,
  ): Promise<CdFxReturn<null>> {
    for (const dependency of workstation.requiredSoftware) {
      console.log(
        `Checking dependency: ${dependency.name} on ${workstation.name}`,
      );
      const isInstalledResult = await this.svDependency.isDependencyInstalled(
        workstation,
        dependency,
      );

      if (!isInstalledResult.state) {
        console.warn(
          `Failed to check if ${dependency.name} is installed: ${isInstalledResult.message}`,
        );
        continue;
      }

      if (isInstalledResult.data) {
        console.log(
          `Dependency ${dependency.name} is already installed. Skipping...`,
        );
        completedTasks++;
        continue;
      }

      const scriptResult = await this.svDependency.getInstallationScript(
        dependency,
        os,
      );
      if (!scriptResult.state || !scriptResult.data) {
        console.warn(
          `No installation script found for ${dependency.name}. Skipping...`,
        );
        completedTasks++;
        continue;
      }

      console.log(`Installing ${dependency.name} on ${workstation.name}...`);
      if (sshCredentials) {
        const executionResult = await this.svWorkstation.executeScript(
          sshCredentials,
          scriptResult.data,
        );
        if (!executionResult.state) {
          console.error(
            `Failed to install ${dependency.name}: ${executionResult.message}`,
          );
        }
      }

      completedTasks++;
      console.log(`Progress: ${completedTasks}/${totalTasks} tasks completed`);
    }

    return {
      data: null,
      state: true,
      message: `Dependency installation completed for ${workstation.name}`,
    };
  }

  private async cloneRepositories(
    devEnviron: DevelopmentEnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    const stepKey = 'cloneRepositories';
    this.progressTracker.updateProgress(stepKey, 'in-progress', 1, 0);

    try {
      // Initialize the controller instance manually
      const ctlCdAutoGit = new CdAutoGitController();

      for (const dependancy of devEnviron.workstation.requiredSoftware) {
        const repo = dependancy.dependancyRepository?.repository;

        if (repo && repo.enabled) {
          const repoName = repo.name;
          const repoDirectory = repo.directory ?? '/default/path'; // Provide fallback if undefined
          const repoHost = repo.repoHost ?? 'corpdesk'; // Provide fallback if undefined

          await ctlCdAutoGit.cloneRepoToLocal(
            repoName,
            repoDirectory,
            repoHost,
          );
        }
      }

      this.progressTracker.updateProgress(stepKey, 'completed', 1, 1);
      return {
        data: null,
        state: true,
        message: 'Repositories cloned successfully',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Failed to clone repositories: ${(error as Error).message}`,
      };
    }
  }

  private async configureServices(
    devEnviron: DevelopmentEnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    const stepKey = 'configureServices';
    this.progressTracker.updateProgress(stepKey, 'in-progress', 1, 0);

    try {
      if (!devEnviron.services || devEnviron.services.length === 0) {
        return {
          data: null,
          state: true,
          message: 'No services to configure.',
        };
      }

      for (const service of devEnviron.services) {
        CdLogg.info(`Configuring service: ${service.serviceName}`);

        if (!service.configuration) {
          CdLogg.warning(
            `Skipping ${service.serviceName}: No configuration found.`,
          );
          continue;
        }

        // Validate credentials (if required)
        if (service.credentials) {
          const isAuthenticated = await this.authenticateService(service);
          if (!isAuthenticated) {
            throw new Error(`Authentication failed for ${service.serviceName}`);
          }
        }

        // Apply configuration (Placeholder for actual implementation)
        await this.applyServiceConfiguration(service);

        CdLogg.success(`Successfully configured ${service.serviceName}`);
      }

      this.progressTracker.updateProgress(stepKey, 'completed', 1, 1);

      return {
        data: null,
        state: true,
        message: 'All services configured successfully.',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Failed to configure services: ${(error as Error).message}`,
      };
    }
  }

  // private async authenticateService(
  //   service: ServiceDescriptor,
  // ): Promise<boolean> {
  //   const { credentials } = service;
  //   if (!credentials) return true; // No authentication required

  //   switch (credentials.type) {
  //     case 'apiKey':
  //       CdLogg.info(`Authenticating ${service.serviceName} using API key...`);
  //       return !!credentials.apiKey;

  //     case 'usernamePassword':
  //       CdLogg.info(
  //         `Authenticating ${service.serviceName} with username/password...`,
  //       );
  //       return !!credentials.username && !!credentials.password;

  //     case 'oauth':
  //       CdLogg.info(
  //         `Authenticating ${service.serviceName} with OAuth token...`,
  //       );
  //       return !!credentials.token;

  //     case 'custom':
  //       CdLogg.info(
  //         `Authenticating ${service.serviceName} with custom method...`,
  //       );
  //       return !!credentials.customAuthConfig;

  //     default:
  //       CdLogg.warning(
  //         `Unknown authentication method for ${service.serviceName}`,
  //       );
  //       return false;
  //   }
  // }
  private async authenticateService(
    service: BaseServiceDescriptor, // Now accepts BaseServiceDescriptor
  ): Promise<boolean> {
    const { credentials } = service;
    if (!credentials) return true; // No authentication required

    switch (credentials.type) {
      case 'apiKey':
        CdLogg.info(`Authenticating ${service.serviceName} using API key...`);
        return !!credentials.apiKey;

      case 'usernamePassword':
        CdLogg.info(
          `Authenticating ${service.serviceName} with username/password...`,
        );
        return !!credentials.username && !!credentials.password;

      case 'oauth':
        CdLogg.info(
          `Authenticating ${service.serviceName} with OAuth token...`,
        );
        return !!credentials.token;

      case 'custom':
        CdLogg.info(
          `Authenticating ${service.serviceName} with custom method...`,
        );
        return !!credentials.customAuthConfig;

      default:
        CdLogg.warning(
          `Unknown authentication method for ${service.serviceName}`,
        );
        return false;
    }
  }

  private async applyServiceConfiguration(
    service: BaseServiceDescriptor,
  ): Promise<void> {
    // Placeholder for actual configuration logic
    CdLogg.debug(
      `Applying configuration for ${service.serviceName}:`,
      service.configuration,
    );
  }

  private async startServices(
    devEnviron: DevelopmentEnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    const stepKey = 'startServices';
    this.progressTracker.updateProgress(stepKey, 'in-progress', 1, 0);

    try {
      if (!devEnviron.services || devEnviron.services.length === 0) {
        return {
          data: null,
          state: true,
          message: 'No services to start.',
        };
      }

      for (const service of devEnviron.services) {
        CdLogg.info(`Starting service: ${service.serviceName}`);

        if (!service.configuration) {
          CdLogg.warning(
            `Skipping ${service.serviceName}: No configuration found.`,
          );
          continue;
        }

        // Ensure authentication before starting
        if (service.credentials) {
          const isAuthenticated = await this.authenticateService(service);
          if (!isAuthenticated) {
            throw new Error(`Authentication failed for ${service.serviceName}`);
          }
        }

        // Start service based on its type
        await this.ctlService.startService(service);

        CdLogg.success(`Successfully started ${service.serviceName}`);
      }

      this.progressTracker.updateProgress(stepKey, 'completed', 1, 1);

      return {
        data: null,
        state: true,
        message: 'All services started successfully.',
      };
    } catch (error) {
      this.progressTracker.updateProgress(stepKey, 'failed');
      return {
        data: null,
        state: false,
        message: `Failed to start services: ${(error as Error).message}`,
      };
    }
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
