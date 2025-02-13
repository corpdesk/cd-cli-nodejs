/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/IBase';
import type { DependencyDescriptor } from '../models/dependancy-descriptor.model';
import type {
  OperatingSystemDescriptor,
  WorkstationDescriptor,
} from '../models/workstations.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { WorkstationService } from './workstation.service';

export class DependencyService {
  svWorkstation: WorkstationService;
  constructor() {
    this.svWorkstation = new WorkstationService();
  }

  async installDependency(
    workstation: WorkstationDescriptor,
    dependency: DependencyDescriptor,
  ): Promise<CdFxReturn<null>> {
    CdLogg.debug('installDependency()/workstation:', workstation);
    CdLogg.debug('installDependency()/dependency:', dependency);

    try {
      const isInstalled = await this.isDependencyInstalled(
        workstation,
        dependency,
      );
      if (isInstalled.data) {
        return {
          data: null,
          state: true,
          message: `Dependency ${dependency.name} is already installed on ${workstation.name}`,
        };
      }

      const sshCredentials =
        workstation.workstationAccess.transport.credentials?.sshCredentials;
      if (sshCredentials) {
        const osResult = await this.svWorkstation.detectOs(sshCredentials);
        if (!osResult.state || !osResult.data) {
          return {
            data: null,
            state: false,
            message: `Failed to determine OS for ${workstation.name}`,
          };
        }
        const scriptResult = await this.getInstallationScript(
          dependency,
          osResult.data,
        );
        if (!scriptResult.state || !scriptResult.data) {
          return {
            data: null,
            state: false,
            message: `No installation script found for ${dependency.name} on ${osResult.data.name}`,
          };
        }

        const executionResult = await this.svWorkstation.executeScript(
          sshCredentials,
          scriptResult.data,
        );
        if (!executionResult.state) {
          return {
            data: null,
            state: false,
            message: `Installation of ${dependency.name} failed on ${workstation.name}: ${executionResult.message}`,
          };
        }

        return {
          data: null,
          state: false,
          message: `Successfully installed ${dependency.name} on ${workstation.name}`,
        };
      } else {
        CdLogg.error(`Could not get the workstation credentials`);
        return {
          data: null,
          state: false,
          message: `Could not get the workstation credentials`,
        };
      }
    } catch (error) {
      CdLogg.error(`installDependency()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to install dependency: ${(error as Error).message}`,
      };
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
}
