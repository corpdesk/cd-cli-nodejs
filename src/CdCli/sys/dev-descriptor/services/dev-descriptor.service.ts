import type {
  CdFxReturn,
  CdRequest,
  ICdResponse,
  ISessResp,
} from '../../base/IBase';
import type { CdDescriptor } from '../models/dev-descriptor.model';
/* eslint-disable style/brace-style */
import config from '@/config';
import { HttpService } from '../../base/http.service';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLog from '../../cd-comm/controllers/cd-logger.controller';
import {
  CdObjModel,
  defaultCdObjEnv,
} from '../../moduleman/models/cd-obj.model';
import { CdCliStoreService } from '../../cd-cli/services/cd-cli-store.service';
import { CdObjTypeModel } from '../../moduleman/models/cd-obj-type.model';
import { GenericService } from '../../base/generic-service';

export class DevDescriptorService extends GenericService<CdObjModel> {
  cdToken = '';
  baseUrl = '';
  httpService;
  svCdCliStore = new CdCliStoreService();
  private redisService = new CdCliStoreService();
  constructor() {
    super(CdObjModel);
    this.init();
  }

  async init() {
    CdLog.debug('DevDescriptorService::init()/starting...');
    const createCdCliProfile = new CdCliProfileController();
    // const ctlSession = new SessonController();
    const result = await createCdCliProfile.getSessionData();
    if (!result) {
      CdLog.error(`could not get valid session`);
      return;
    }

    if (!result.state && result.message) {
      CdLog.error(result.message);
      return;
    }

    if (result.data) {
      const sid = result.data;
      this.cdToken = sid;
      const httpService = new HttpService(true); // Enable debug mode
      const ret = await httpService.getCdApiUrl(config.cdApiLocal);
      CdLog.debug(`DevDescritorService::init()/ret:${JSON.stringify(ret)}`);
      if (ret) {
        this.baseUrl = ret;
        CdLog.debug(`DevDescritorService::init()/this.baseUrl:${this.baseUrl}`);
      }
    } else {
      CdLog.error('Session is invalid');
    }
  }

  async syncDescriptors(
    d: CdDescriptor[],
    db: 'mysql' | 'redis' | 'all' = 'all',
  ): Promise<CdFxReturn<ICdResponse | CdObjModel[]>> {
    CdLog.debug(`DevDescriptorService::syncDescriptors() - Sync Target: ${db}`);

    let mysqlResult: CdFxReturn<ICdResponse> | null = null;
    let redisResult: CdFxReturn<CdObjModel[]> | null = null;

    // Sync to MySQL if needed
    if (db === 'mysql' || db === 'all') {
      try {
        const payload = this.setEnvelope('SyncDescriptors', { data: d });
        this.httpService.headers.data = payload;
        const httpService = new HttpService();
        await httpService.init();
        mysqlResult = await httpService.proc2(this.httpService.headers);

        CdLog.debug(
          `DevDescriptorService::syncDescriptors() - Synced ${d.length} descriptors to MySQL`,
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `MySQL Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    // Sync to Redis if needed
    if (db === 'redis' || db === 'all') {
      try {
        redisResult = await this.redisService.createCdObj(d);

        CdLog.debug(
          `DevDescriptorService::syncDescriptors() - Synced ${d.length} descriptors to Redis`,
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `Redis Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    return {
      data: mysqlResult?.data || redisResult?.data || null,
      state: true,
      message: `Sync to ${db} completed successfully.`,
    };
  }

  async syncDescriptorData(
    descriptorData: any,
    db: 'mysql' | 'redis' | 'all' = 'all',
  ): Promise<CdFxReturn<ICdResponse | CdObjModel[]>> {
    CdLog.debug(
      `DevDescriptorService::syncDescriptorData() - Sync Target: ${db}`,
    );

    let mysqlResult: CdFxReturn<ICdResponse> | null = null;
    let redisResult: CdFxReturn<CdObjModel[]> | null = null;

    if (db === 'mysql' || db === 'all') {
      try {
        const payload = this.setEnvelope('SyncDescriptorData', {
          data: descriptorData,
        });
        this.httpService.headers.data = payload;
        const httpService = new HttpService();
        await httpService.init();
        mysqlResult = await httpService.proc2(this.httpService.headers);

        CdLog.debug(
          'DevDescriptorService::syncDescriptorData() - Synced descriptor data to MySQL',
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `MySQL Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    if (db === 'redis' || db === 'all') {
      try {
        redisResult = await this.redisService.createCdObj(descriptorData);

        CdLog.debug(
          'DevDescriptorService::syncDescriptorData() - Synced descriptor data to Redis',
        );
      } catch (error) {
        return {
          data: null,
          state: false,
          message: `Redis Sync Failed: ${(error as Error).message}`,
        };
      }
    }

    return {
      data: mysqlResult?.data || redisResult?.data || null,
      state: true,
      message: `Sync to ${db} completed successfully.`,
    };
  }

  async getDescriptorDataByNameAndType(
    name: string,
    type: string,
  ): Promise<CdFxReturn<CdObjTypeModel>> {
    try {
      CdLog.debug(
        `DevDescriptorController::getDescriptorDataByNameAndType() - Fetching data for name: ${name}, type: ${type}`,
      );

      // Get the CdObjType GUID for the given type
      const typeResult = await this.svCdCliStore.getCdObjTypeByName(type);
      CdLog.debug(
        `DevDescriptorController::getDescriptorDataByNameAndType()/typeResult:${JSON.stringify(typeResult)}`,
      );
      if (
        !typeResult.state ||
        !typeResult.data ||
        typeResult.data.length === 0
      ) {
        const errorMsg = `No CdObjType found for type: ${type}`;
        CdLog.error(errorMsg);
        return { data: null, state: false, message: errorMsg };
      }

      const cdObjTypeGuid = typeResult.data[0].cdObjTypeGuid;

      // Retrieve the object from Redis using the name and type GUID
      const indexKey = 'cd_obj_index';
      const objGuid = await this.svCdCliStore.client.hGet(indexKey, name);

      if (!objGuid) {
        const errorMsg = `No descriptor found for name: ${name}`;
        CdLog.error(errorMsg);
        return { data: null, state: false, message: errorMsg };
      }

      const objKey = `cd_obj:${objGuid}`;
      const descriptorData = await this.svCdCliStore.client.json.get(objKey);

      if (!descriptorData) {
        const errorMsg = `No descriptor data found for GUID: ${objGuid}`;
        CdLog.error(errorMsg);
        return { data: null, state: false, message: errorMsg };
      }

      CdLog.debug(`Successfully retrieved descriptor data for ${name}`);
      return {
        data: descriptorData as CdObjTypeModel,
        state: true,
        message: 'Data retrieved successfully',
      };
    } catch (error: any) {
      CdLog.error(`Error retrieving descriptor data: ${error.message}`);
      return { data: null, state: false, message: `Error: ${error.message}` };
    }
  }

  setEnvelope(action: string, data: any): CdRequest {
    CdLog.debug('CdAppService::setEnvelope()/starting...');
    // Reset f_vals array to avoid unintended accumulation
    defaultCdObjEnv.dat.f_vals = [];
    // Update the envelope with new action and data
    defaultCdObjEnv.a = action;
    defaultCdObjEnv.dat.f_vals.push(data);
    defaultCdObjEnv.dat.token = this.cdToken;
    return defaultCdObjEnv;
  }
}
