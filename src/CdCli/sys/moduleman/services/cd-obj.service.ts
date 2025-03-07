// import { SqliteStore } from "../store/SqliteStore";
// import { CdObjModel } from "../entities/CdObjModel";

import { ObjectLiteral } from 'typeorm';
import { CD_FX_FAIL, CdFxReturn, IQuery } from '../../base/IBase';
import { SqliteStore } from '../../base/sqlite-store';
import { CdObjModel } from '../models/cd-obj.model';
import { CdObjTypeModel } from '../models/cd-obj-type.model';
import CdLog from '../../cd-comm/controllers/cd-logger.controller';

export class CdObjService {
  private sqlightStore = new SqliteStore();

  // Define validation rules
  cRules: any = {
    required: ['cdObjName', 'cdObjTypeGuid', 'cdObjGuid'],
    noDuplicate: ['cdObjName', 'cdObjTypeGuid'],
  };

  async create(
    pl: CdObjModel,
  ): Promise<CdFxReturn<CdObjModel | ObjectLiteral | null>> {
    // Validate input
    const validation = await this.validateCreate(pl);
    if (!validation.state) {
      return validation; // Return validation error if failed
    }

    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'Create CdObj',
      dSource: 1,
      data: pl,
    };

    const result = await this.sqlightStore.create(serviceInput);

    // If create was successful, fetch the new record
    if (result.state) {
      return await this.afterCreate(pl);
    } else {
      return CD_FX_FAIL;
    }
  }

  /**
   * Validate input before processing create
   */
  private async validateCreate(pl: CdObjModel): Promise<CdFxReturn<null>> {
    // Ensure required fields exist
    for (const field of this.cRules.required) {
      if (!pl[field]) {
        return {
          data: null,
          state: false,
          message: `Missing required field: ${field}`,
        };
      }
    }

    // Check for duplicates
    const query = {
      where: {
        cdObjName: pl.cdObjName,
        cdObjTypeId: pl.cdObjTypeGuid,
      },
    };
    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'Validate Duplicate CdObj',
      dSource: 1,
      cmd: { query },
    };

    const existingRecords = await this.sqlightStore.read(serviceInput);
    if (existingRecords.state && existingRecords.data!.length > 0) {
      return {
        data: null,
        state: false,
        message: 'Duplicate record found for cdObjName and cdObjTypeId',
      };
    }

    return { data: null, state: true, message: 'Validation passed' };
  }

  /**
   * Fetch newly created record by guid
   */
  private async afterCreate(
    pl: CdObjModel,
  ): Promise<CdFxReturn<CdObjModel | ObjectLiteral>> {
    const query = {
      where: { cdObjGuid: pl.cdObjGuid },
    };

    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'Fetch Created CdObj',
      dSource: 1,
      cmd: { query },
    };

    return await this.sqlightStore.read(serviceInput);
  }

  async getCdObj(
    q: IQuery,
  ): Promise<CdFxReturn<CdObjModel[] | ObjectLiteral[] | unknown>> {
    // Validate query input
    if (!q || !q.where || Object.keys(q.where).length === 0) {
      return {
        data: null,
        state: false,
        message: 'Invalid query: "where" condition is required',
      };
    }

    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'CdObjService::getCdObj',
      cmd: {
        action: 'find',
        query: q,
      },
      dSource: 1,
    };

    try {
      const result = await this.sqlightStore.read(serviceInput);

      if (!result.state || !result.data!.length) {
        return {
          data: [],
          state: false,
          message: 'No matching records found',
        };
      }

      return result; // Successfully return fetched records
    } catch (error: any) {
      CdLog.error(`CdObjService.getCdObj() - Error: ${error.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving CdObj: ${error.message}`,
      };
    }
  }

  async update(q: IQuery): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'CoopService::update',
      cmd: {
        action: 'update',
        query: q,
      },
      dSource: 1,
    };

    try {
      const result = await this.sqlightStore.update(serviceInput);
      if (!result.state || !result.data!.length) {
        return {
          data: [],
          state: false,
          message: 'No matching records found',
        };
      }
      return result; // Successfully return status
    } catch (error: any) {
      CdLog.error(`CdObjTypeService.update() - Error: ${error.message}`);
      return {
        data: null,
        state: false,
        message: `Error updating CdObj: ${error.message}`,
      };
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }

  async delete(q: IQuery): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'CoopService::delete',
      cmd: {
        action: 'delete',
        query: q,
      },
      dSource: 1,
    };

    try {
      const result = await this.sqlightStore.delete(serviceInput);
      if (!result.state || !result.data!.length) {
        return {
          data: [],
          state: false,
          message: 'No matching records found',
        };
      }
      return result; // Successfully return status
    } catch (error: any) {
      CdLog.error(`CdObjTypeService.update() - Error: ${error.message}`);
      return {
        data: null,
        state: false,
        message: `Error deleting CdObj: ${error.message}`,
      };
    }
  }
}
