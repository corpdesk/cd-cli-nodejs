/* eslint-disable style/indent */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/IBase';
import type { DependencyDescriptor } from '../models/dependancy-descriptor.model';
import type {
  OperatingSystemDescriptor,
  WorkstationAccessDescriptor,
  WorkstationDescriptor,
} from '../models/workstations.model';
import { ProgressTrackerService } from '../../cd-cli/services/progress-tracker.service';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { WorkstationAccessController } from '../controllers/workstation-access.controller';
import { SshService } from './ssh.service';
import { WorkstationService } from './workstation.service';
import { WorkstationAccessService } from './workstation-access.service';

export class DependencyService {
  svWorkstation: WorkstationService;
  progressTracker: ProgressTrackerService;
  svSsh: SshService;
  svWorkstationAccess: WorkstationAccessService;
  ctlWorkstationAccess: WorkstationAccessController;
  constructor() {
    this.svWorkstation = new WorkstationService();
    this.progressTracker = new ProgressTrackerService();
    this.svSsh = new SshService();
    this.svWorkstationAccess = new WorkstationAccessService();
    this.ctlWorkstationAccess = new WorkstationAccessController();
  }

  // async installDependency(
  //   workstation: WorkstationDescriptor,
  //   dependency: DependencyDescriptor,
  // ): Promise<CdFxReturn<null>> {
  //   CdLogg.debug('installDependency()/workstation:', workstation);
  //   CdLogg.debug('installDependency()/dependency:', dependency);

  //   try {
  //     const isInstalled = await this.isDependencyInstalled(
  //       workstation,
  //       dependency,
  //     );
  //     if (isInstalled.data) {
  //       return {
  //         data: null,
  //         state: true,
  //         message: `Dependency ${dependency.name} is already installed on ${workstation.name}`,
  //       };
  //     }

  //     const sshCredentials =
  //       workstation.workstationAccess.transport?.credentials?.sshCredentials;
  //     if (sshCredentials) {
  //       const osResult = await this.svWorkstation.detectOs(sshCredentials);
  //       if (!osResult.state || !osResult.data) {
  //         return {
  //           data: null,
  //           state: false,
  //           message: `Failed to determine OS for ${workstation.name}`,
  //         };
  //       }
  //       const scriptResult = await this.getInstallationScript(
  //         dependency,
  //         osResult.data,
  //       );
  //       if (!scriptResult.state || !scriptResult.data) {
  //         return {
  //           data: null,
  //           state: false,
  //           message: `No installation script found for ${dependency.name} on ${osResult.data.name}`,
  //         };
  //       }

  //       const executionResult = await this.svWorkstation.executeScript(
  //         sshCredentials,
  //         scriptResult.data,
  //       );
  //       if (!executionResult.state) {
  //         return {
  //           data: null,
  //           state: false,
  //           message: `Installation of ${dependency.name} failed on ${workstation.name}: ${executionResult.message}`,
  //         };
  //       }

  //       return {
  //         data: null,
  //         state: false,
  //         message: `Successfully installed ${dependency.name} on ${workstation.name}`,
  //       };
  //     } else {
  //       CdLogg.error(`Could not get the workstation credentials`);
  //       return {
  //         data: null,
  //         state: false,
  //         message: `Could not get the workstation credentials`,
  //       };
  //     }
  //   } catch (error) {
  //     CdLogg.error(`installDependency()/error:${error}`);
  //     return {
  //       data: null,
  //       state: false,
  //       message: `Failed to install dependency: ${(error as Error).message}`,
  //     };
  //   }
  // }
  async installDependencies(
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
          ? await this.handleRemoteInstallation(
              workstation,
              totalTasks,
              completedTasks,
            )
          : await this.handleLocalInstallation(
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

  async handleRemoteInstallation(
    workstation: WorkstationDescriptor,
    totalTasks: number,
    completedTasks: number,
  ): Promise<CdFxReturn<{ completedTasks: number }>> {
    for (const dependency of workstation.requiredSoftware) {
      console.log(`Installing ${dependency.name} on remote workstation...`);
      await this.installDependencyRemotely(
        dependency,
        workstation.workstationAccess,
      );

      completedTasks++; // ✅ Increment progress
      this.progressTracker.updateProgress(
        'installDependencies',
        'in-progress',
        totalTasks,
        completedTasks,
      );
    }

    return {
      data: { completedTasks },
      state: true,
      message: 'Remote installation completed',
    };
  }

  async installDependencyRemotely(
    dependency: DependencyDescriptor,
    workstationAccess: WorkstationAccessDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      this.validateDependency(dependency);
      this.svWorkstationAccess.validateWorkstationAccess(workstationAccess);

      const packageManager = this.getPackageManager(dependency);
      const command =
        dependency.installCommand ||
        `${packageManager} install -y ${dependency.name}`;

      const result = await this.svWorkstationAccess.executeRemoteCommand(
        workstationAccess,
        command,
      );

      if (!result.state) {
        throw new Error(result.message);
      }

      return {
        data: null,
        state: true,
        message: `Remote installation of ${dependency.name} completed successfully.`,
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to install ${dependency.name} remotely: ${(error as Error).message}`,
      };
    }
  }

  async handleLocalInstallation(
    workstation: WorkstationDescriptor,
    totalTasks: number,
    completedTasks: number,
  ): Promise<CdFxReturn<{ completedTasks: number }>> {
    for (const dependency of workstation.requiredSoftware) {
      console.log(`Installing ${dependency.name} locally...`);
      await this.installDependencyLocally(dependency);

      completedTasks++; // ✅ Increment progress
      this.progressTracker.updateProgress(
        'installDependencies',
        'in-progress',
        totalTasks,
        completedTasks,
      );
    }

    return {
      data: { completedTasks },
      state: true,
      message: 'Local installation completed',
    };
  }

  async installDependencyLocally(
    dependency: DependencyDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      this.validateDependency(dependency);

      console.log(`Starting local installation of ${dependency.name}...`);

      const packageManager = this.getPackageManager(dependency);
      const command =
        dependency.installCommand ||
        `${packageManager} install -y ${dependency.name}`;

      const result = await this.ctlWorkstationAccess.execute(command);

      if (!result.state) {
        throw new Error(`Local installation failed: ${result.message}`);
      }

      console.log(`Successfully installed ${dependency.name} locally.`);

      return {
        data: null,
        state: true,
        message: `Local installation of ${dependency.name} completed successfully.`,
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to install ${dependency.name} locally: ${(error as Error).message}`,
      };
    }
  }

  private validateDependency(dependency: DependencyDescriptor): void {
    if (!dependency.name) {
      throw new Error('Dependency name is required.');
    }
    if (!dependency.source) {
      throw new Error(`Dependency source is required for ${dependency.name}.`);
    }
  }

  async isDependencyInstalled(
    workstation: WorkstationDescriptor,
    dependency: DependencyDescriptor,
  ): Promise<CdFxReturn<boolean>> {
    CdLogg.debug('isDependencyInstalled()/workstation:', workstation);
    CdLogg.debug('isDependencyInstalled()/dependency:', dependency);

    try {
      // Simulate checking for dependency installation
      const isInstalled = false; // Replace with actual SSH command execution

      return {
        data: isInstalled,
        state: true,
        message: `Checked installation status for ${dependency.name}`,
      };
    } catch (error) {
      CdLogg.error(`isDependencyInstalled()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to check dependency installation: ${(error as Error).message}`,
      };
    }
  }

  async getInstallationScript(
    dependency: DependencyDescriptor,
    os: OperatingSystemDescriptor,
  ): Promise<CdFxReturn<string>> {
    CdLogg.debug('getInstallationScript()/dependency:', dependency);
    CdLogg.debug('getInstallationScript()/os:', os);

    try {
      // Simulate fetching script from database
      const script = `sudo apt-get install -y ${dependency.name}`; // Example script

      return {
        data: script,
        state: true,
        message: `Fetched installation script for ${dependency.name}`,
      };
    } catch (error) {
      CdLogg.error(`getInstallationScript()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to get installation script: ${(error as Error).message}`,
      };
    }
  }

  async getPackageManager(
    dependency: DependencyDescriptor,
  ): Promise<CdFxReturn<string>> {
    if (!dependency.source) {
      return {
        data: null,
        state: false,
        message: 'Dependency source is missing.',
      };
    }

    let packageManager: string | null = null;

    switch (dependency.source) {
      case 'npm':
        packageManager = 'npm';
        break;
      case 'cdn':
        packageManager = 'unpkg / jsDelivr';
        break;
      case 'repository':
        packageManager = 'git / custom registry';
        break;
      case 'local':
        packageManager = 'local file system';
        break;
      case 'system':
        packageManager = 'system package manager (apt, yum, brew)';
        break;
      case 'custom':
      case 'external':
        packageManager = 'custom / external installer';
        break;
      default:
        return {
          data: null,
          state: false,
          message: 'Unknown dependency source.',
        };
    }

    return {
      data: packageManager,
      state: true,
      message: `Package manager resolved: ${packageManager}`,
    };
  }
}
