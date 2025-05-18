// import { SqliteStore } from "../store/SqliteStore";
// import { CdObjModel } from "../entities/CdObjModel";

import { ObjectLiteral } from 'typeorm';
import { CD_FX_FAIL, CdFxReturn, IQuery } from '../../base/IBase';
import { CdObjModel } from '../models/cd-obj.model';
import CdLog from '../../cd-comm/controllers/cd-logger.controller';
import { BaseService } from '../../base/base.service';
import config from '@/config';
import { GenericService } from '../../base/generic-service';

export class CdObjService extends GenericService<CdObjModel> {
  // private b = new BaseService<CdObjModel>();

  defaultDs = config.ds.sqlite;
  // Define validation rules
  cRules: any = {
    required: ['cdObjName', 'cdObjTypeGuid', 'cdObjGuid'],
    noDuplicate: ['cdObjName', 'cdObjTypeGuid'],
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////
  // ADAPTATION FROM GENERIC SERVICE
  constructor() {
    super(CdObjModel);
  }

  /**
   * Validate input before processing create
   */
  async validateCreate(pl: CdObjModel): Promise<CdFxReturn<boolean>> {
    const retState = true;
    // Ensure required fields exist
    for (const field of this.cRules.required) {
      if (!pl[field]) {
        return {
          data: false,
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
      dSource: this.defaultDs,
      cmd: { query },
    };

    const existingRecords = await this.b.read(null, null, serviceInput);
    if ('state' in existingRecords && 'data' in existingRecords) {
      if (!existingRecords.state || !existingRecords.data) {
        return { data: false, state: false, message: 'Validation failed' };
      }

      if (existingRecords.data.length > 0) {
        return { data: true, state: true, message: 'Validation passed' };
      } else {
        return { data: false, state: false, message: 'Validation failed' };
      }
    }

    return { data: false, state: false, message: 'Validation failed' };
  }

  /**
   * Fetch newly created record by guid
   */
  async afterCreate(
    pl: CdObjModel,
  ): Promise<CdFxReturn<CdObjModel | ObjectLiteral>> {
    const query = {
      where: { cdObjGuid: pl.cdObjGuid },
    };

    const serviceInput = {
      serviceModel: CdObjModel,
      docName: 'Fetch Created CdObj',
      dSource: this.defaultDs,
      cmd: { query },
    };

    const retResult = await this.b.read(null, null, serviceInput);
    if ('state' in retResult) {
      return retResult;
    } else {
      return CD_FX_FAIL;
    }
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
      dSource: this.defaultDs,
    };

    try {
      const retResult = await this.b.read(null, null, serviceInput);

      if ('state' in retResult) {
        return retResult;
      } else {
        return CD_FX_FAIL;
      }
    } catch (e: any) {
      CdLog.error(`CdObjService.getCdObj() - Error: ${e.message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving CdObj: ${e.message}`,
      };
    }
  }

  beforeUpdate(q: any) {
    if (q.update.CoopEnabled === '') {
      q.update.CoopEnabled = null;
    }
    return q;
  }
}
