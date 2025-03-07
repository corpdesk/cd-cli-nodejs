import { ObjectLiteral } from 'typeorm';
import { CdFxReturn, IQuery } from '../../base/IBase';
import { CdObjModel } from '../models/cd-obj.model';
import { CdObjService } from '../services/cd-obj.service';

export class CdObjController {
  private svCdObj = new CdObjService();

  async create(
    pl: CdObjModel,
  ): Promise<CdFxReturn<CdObjModel | ObjectLiteral | null>> {
    return await this.svCdObj.create(pl);
  }

  async getCdObj(
    q: IQuery,
  ): Promise<CdFxReturn<CdObjModel[] | ObjectLiteral[] | unknown>> {
    return await this.svCdObj.getCdObj(q);
  }

  async update(q: IQuery): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    return await this.svCdObj.update(q);
  }

  async delete(q: IQuery): Promise<CdFxReturn<ObjectLiteral[] | unknown>> {
    return await this.svCdObj.delete(q);
  }
}
