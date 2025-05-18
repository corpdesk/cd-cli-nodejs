import { ObjectLiteral } from 'typeorm';
import { CdFxReturn, IQuery, IServiceInput } from '../../base/IBase';
import { CdObjModel } from '../models/cd-obj.model';
import { CdObjService } from '../services/cd-obj.service';

export class CdObjController {
  private svCdObj = new CdObjService();

  async create(
    req,
    res,
    serviceInput: IServiceInput<CdObjModel>,
  ): Promise<CdFxReturn<CdObjModel | ObjectLiteral | null>> {
    return await this.svCdObj.create(null, null, serviceInput);
  }

  async getCdObj(
    q: IQuery,
  ): Promise<CdFxReturn<CdObjModel[] | ObjectLiteral[] | unknown>> {
    return await this.svCdObj.getCdObj(q);
  }

  async update(
    req,
    res,
    serviceInput: IServiceInput<CdObjModel>,
  ): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    return await this.svCdObj.update(req, res, serviceInput);
  }

  async delete(
    req,
    res,
    serviceInput: IServiceInput<CdObjModel>,
  ): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    return await this.svCdObj.delete(req, res, serviceInput);
  }
}
