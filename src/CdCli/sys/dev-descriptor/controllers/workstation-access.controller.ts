/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
import type { CdFxReturn } from '../../base/IBase';
import type { WorkstationAccessDescriptor } from '../models/workstations.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { WorkstationAccessService } from '../services/workstation-access.service';

export class WorkstationAccessController {
  svWorkstationAccess: WorkstationAccessService;
  constructor() {
    this.svWorkstationAccess = new WorkstationAccessService();
  }

  /**
   * Initiates an SSH connection and executes a command on the remote workstation.
   */
  async executeRemoteCommand(
    workstationAccess: WorkstationAccessDescriptor,
    command: string,
  ): Promise<CdFxReturn<string>> {
    CdLogg.debug('Executing remote command:', { command, workstationAccess });

    if (
      workstationAccess.accessScope !== 'remote' ||
      !workstationAccess.transport
    ) {
      return {
        data: null,
        state: false,
        message:
          'Invalid access: Remote access required with a valid transport protocol.',
      };
    }

    try {
      const result = await this.svWorkstationAccess.executeRemoteCommand(
        workstationAccess,
        command,
      );
      return {
        data: result.data,
        state: true,
        message: 'Command executed successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to execute command: ${(error as Error).message}`,
      };
    }
  }

  async execute(command: string): Promise<CdFxReturn<null>> {
    return await this.svWorkstationAccess.execute(command);
  }
}
