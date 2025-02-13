/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/IBase';
import type {
  OperatingSystemDescriptor,
  SshCredentials,
  WorkstationDescriptor,
} from '../models/workstations.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';

export class WorkstationService {
  async executeScript(
    sshCredentials: SshCredentials,
    script: string,
  ): Promise<CdFxReturn<string>> {
    CdLogg.debug('executeScript()/sshCredentials:', sshCredentials);
    CdLogg.debug(`executeScript()/script: ${script}`);

    try {
      // Simulate SSH execution (replace with actual SSH library logic)
      const output = `Simulated script execution output for ${sshCredentials.host}`;

      return {
        data: output,
        state: true,
        message: 'Script executed successfully',
      };
    } catch (error) {
      CdLogg.error(`executeScript()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to execute script: ${(error as Error).message}`,
      };
    }
  }

  async detectOs(
    sshCredentials: SshCredentials,
  ): Promise<CdFxReturn<OperatingSystemDescriptor>> {
    CdLogg.debug('detectOs()/sshCredentials:', sshCredentials);

    try {
      // Simulate OS detection (replace with actual SSH logic)
      const os: OperatingSystemDescriptor = {
        name: 'Ubuntu',
        version: '22.04',
        architecture: 'x86_64',
        timezone: '',
        allocatedResources: {
          cpuCores: 4, // Number of CPU cores
          memory: { units: 'GB', value: 32 }, // e.g., "32GB"
          storage: { units: 'TB', value: 1 }, // e.g., "1TB"
        },
        // hostname: '',
        // ipAddresses: [],
        // isVirtualized: false,
      };

      return {
        data: os,
        state: true,
        message: 'OS detected successfully',
      };
    } catch (error) {
      CdLogg.error(`detectOs()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to detect OS: ${(error as Error).message}`,
      };
    }
  }
}
