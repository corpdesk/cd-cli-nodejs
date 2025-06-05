import { createClient } from 'redis';
import Redis from 'ioredis';
import { CdObjModel } from '../../moduleman/models/cd-obj.model';
import { CD_FX_FAIL, CdFxReturn } from '../../base/IBase';
import { CdObjTypeModel } from '../../moduleman/models/cd-obj-type.model';
import {
  CdDescriptor,
  mapDescriptorToCdObj,
} from '../../dev-descriptor/models/dev-descriptor.model';
import CdLog from '../../cd-comm/controllers/cd-logger.controller';

export class CdCliStoreService {
  client;
  // redisClient;

  constructor() {
    // this.client = createClient();
    // this.client.connect();

    ////////////////////////////
    // io redis
    this.client = new Redis({
      host: 'localhost', // Update this if needed
      port: 6379,
      enableAutoPipelining: true,
      showFriendlyErrorStack: true,
    });
  }

  async createCdObjType(cdObjType: CdObjTypeModel): Promise<void> {
    if (!cdObjType.cdObjTypeGuid) {
      throw new Error('cdObjTypeGuid is required for saving CdObjType');
    }

    const key = `cd_obj_type:${cdObjType.cdObjTypeGuid}`;
    await this.client.json.set(key, '$', cdObjType);
    await this.client.hSet(
      'cd_obj_type_index',
      cdObjType.cdObjTypeGuid,
      cdObjType.cdObjTypeName,
    );
  }

  async createCdObj(
    cdObjects: CdObjModel[],
  ): Promise<CdFxReturn<CdObjModel[]>> {
    try {
      const retArr: CdObjModel[] = [];

      // Ensure 'descriptor' type exists in Redis
      let resultCdObjTypeGuid = await this.getCdObjTypeByName('descriptor');
      if (!resultCdObjTypeGuid.state || !resultCdObjTypeGuid.data) {
        return CD_FX_FAIL;
      }
      let cdObjTypes: CdObjTypeModel[] = resultCdObjTypeGuid.data;
      let descriptorCdObjTypeGuid = cdObjTypes[0].cdObjTypeGuid;
      if (!descriptorCdObjTypeGuid) {
        descriptorCdObjTypeGuid = this.generateGuid();
        await this.createCdObjType({
          cdObjTypeName: 'descriptor',
          cdObjTypeGuid: descriptorCdObjTypeGuid,
        });
      }

      for (const d of cdObjects) {
        CdLog.debug(
          'CdCliStoreService::createCdObj()/processing descriptor:',
          d,
        );

        const cdObj: CdObjModel = mapDescriptorToCdObj(d);
        cdObj.cdObjTypeGuid = descriptorCdObjTypeGuid;

        // Generate a valid GUID if missing
        if (!cdObj.cdObjGuid) {
          cdObj.cdObjGuid = this.generateGuid();
        }

        if (d.cdObjId === -1) {
          cdObj.parentModuleGuid = 'd3f1a14d-6fb1-468c-b627-9a098ead6d5d';
        }

        // Skip saving if cdObjGuid is still invalid
        if (!cdObj.cdObjGuid) {
          CdLog.warning('Skipping save: Invalid cdObjGuid for', cdObj);
          continue;
        }

        // Store in Redis
        const key = `cd_obj:${cdObj.cdObjGuid}`;
        await this.client.json.set(key, '$', cdObj);
        await this.client.hSet(
          'cd_obj_index',
          cdObj.cdObjGuid,
          cdObj.cdObjName,
        );

        retArr.push(cdObj);
      }

      return {
        data: retArr,
        state: true,
        message: 'Descriptors stored successfully in Redis',
      };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error storing descriptors in Redis: ${error.message}`,
      };
    }
  }

  /**
   * Retrieves CdObjTypeModel GUID by name from Redis
   */
  // async getCdObjTypeByName(
  //   cdObjTypeName: string,
  // ): Promise<CdFxReturn<CdObjTypeModel[]>> {
  //   try {
  //     const key = `cd_obj_type:${cdObjTypeName}`;
  //     const cdObjTypeData = await this.client.json.get(key);
  //     CdLog.debug(`getCdObjTypeByName()/${JSON.stringify(cdObjTypeData)}`);

  //     if (!cdObjTypeData) {
  //       return {
  //         data: [],
  //         state: false,
  //         message: `No CdObjType found for name: ${cdObjTypeName}`,
  //       };
  //     }

  //     return {
  //       data: [cdObjTypeData as CdObjTypeModel],
  //       state: true,
  //       message: 'CdObjType retrieved successfully',
  //     };
  //   } catch (error: any) {
  //     return {
  //       data: [],
  //       state: false,
  //       message: `Error retrieving CdObjType: ${error.message}`,
  //     };
  //   }
  // }
  async getCdObjTypeByName(
    cdObjTypeName: string,
  ): Promise<CdFxReturn<CdObjTypeModel[]>> {
    try {
      const key = `cd_obj_type:${cdObjTypeName}`;

      // Check if Redis supports JSON.GET before executing
      const modules = await this.client.call('MODULE', 'LIST');
      if (!modules.some((mod: any) => mod[1] === 'ReJSON')) {
        throw new Error('RedisJSON module is not enabled.');
      }

      const cdObjTypeData = await this.client.json.get(key);
      CdLog.debug(`getCdObjTypeByName()/${JSON.stringify(cdObjTypeData)}`);

      if (!cdObjTypeData) {
        return {
          data: [],
          state: false,
          message: `No CdObjType found for name: ${cdObjTypeName}`,
        };
      }

      return {
        data: [cdObjTypeData as CdObjTypeModel],
        state: true,
        message: 'CdObjType retrieved successfully',
      };
    } catch (error: any) {
      if (error.message.includes("unknown command 'JSON.GET'")) {
        return {
          data: [],
          state: false,
          message:
            'RedisJSON module is not enabled. Please install Redis Stack or enable the module.',
        };
      }
      return {
        data: [],
        state: false,
        message: `Error retrieving CdObjType: ${error.message}`,
      };
    }
  }

  /**
   * Generates a new GUID
   */
  private generateGuid(): string {
    return crypto.randomUUID(); // Replace with appropriate GUID generator if needed
  }

  async getDescriptorCdObjTypeGuid(): Promise<CdFxReturn<string>> {
    const resultCdObjTypeGuid = await this.getCdObjTypeByName('descriptor');
    if (!resultCdObjTypeGuid.state || !resultCdObjTypeGuid.data) {
      return CD_FX_FAIL;
    }
    let cdObjTypes: CdObjTypeModel[] = resultCdObjTypeGuid.data;
    let descriptorCdObjTypeGuid = cdObjTypes[0].cdObjTypeGuid;

    // return ret.length > 0 ? ret[0].cdObjTypeGuid : this.generateGuid();
    if (!descriptorCdObjTypeGuid) {
      descriptorCdObjTypeGuid = this.generateGuid();
    }
    let ret = {
      data: descriptorCdObjTypeGuid,
      state: true,
      message: '',
    };
    return ret;
  }

  async getCdObj(cdObjId: number): Promise<CdFxReturn<CdObjModel>> {
    try {
      const key = `cd_obj:${cdObjId}`;
      const result = (await this.client.json.get(key)) as CdObjModel | null;

      if (!result) {
        return { data: null, state: false, message: 'CdObj not found' };
      }
      return { data: result, state: true };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error fetching CdObj: ${error.message}`,
      };
    }
  }

  async searchCdObjByName(name: string): Promise<CdFxReturn<CdObjModel[]>> {
    try {
      const ids = await this.client.hKeys('cd_obj_index');
      const matchingIds = ids.filter((id) => id.includes(name));

      const results: CdObjModel[] = [];
      for (const id of matchingIds) {
        const cdObj = await this.getCdObj(parseInt(id));
        if (cdObj.state && cdObj.data) {
          results.push(cdObj.data);
        }
      }

      return { data: results, state: true };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error searching CdObj: ${error.message}`,
      };
    }
  }

  async deleteCdObj(cdObjId: number): Promise<CdFxReturn<null>> {
    try {
      const key = `cd_obj:${cdObjId}`;
      await this.client.del(key);
      await this.client.hDel('cd_obj_index', cdObjId.toString());

      return { data: null, state: true, message: 'CdObj deleted successfully' };
    } catch (error: any) {
      return {
        data: null,
        state: false,
        message: `Error deleting CdObj: ${error.message}`,
      };
    }
  }
}
