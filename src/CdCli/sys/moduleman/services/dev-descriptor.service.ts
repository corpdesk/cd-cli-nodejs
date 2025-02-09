import type { IQuery } from '../../base/IBase';
// import type { CdDescriptor } from '../models/dev-descriptor.model';
/* eslint-disable style/brace-style */
import config from '@/config';
import { HttpService } from '../../base/http.service';
import { ISessResp } from '../../base/IBase';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { SessonController } from '../../user/controllers/session.controller';

export class CdObjService {
  cdToken = '';
  baseUrl = '';
  httpService;
  headers: any = {
    method: 'POST',
    url: '/',
    data: null,
  };

  constructor() {
    this.init();
  }

  async init() {
    CdLogg.debug(' CdObjService::init()/starting...');
    const createCdCliProfile = new CdCliProfileController();
    // const ctlSession = new SessonController();
    const sid: any = await createCdCliProfile.getSessionData(config.cdApiLocal);
    CdLogg.debug('DevDescritorService::init()/sid:', sid);
    if (sid) {
      CdLogg.debug('DevDescritorService::init()/sid2:', sid);
      this.cdToken = sid;
      this.httpService = new HttpService(true); // Enable debug mode
      const ret = await this.httpService.getCdApiUrl(config.cdApiLocal);
      CdLogg.debug('DevDescritorService::init()/ret:', ret);
      if (ret) {
        this.baseUrl = ret;
        CdLogg.debug(
          `DevDescritorService::init()/this.baseUrl:${this.baseUrl}`,
        );
      }
    } else {
      CdLogg.error('Session is invalid');
    }
  }

  // /** Pageable request:
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "CdObj",
  //         "a": "GetCount",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "select":["cdObjId","cdObjName"],
  //                         "where": {cdObjTypeGuid: '5ab9a944-1014-4664-ad96-8ceb737d1857'},
  //                         "take": 5,
  //                         "skip": 1
  //                         }
  //                 }
  //             ],
  //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  async getCdObj(q: IQuery) {
    CdLogg.debug(' CdObjService::getCdObj()/starting...');
    const payload = this.setEnvelopeGetCdObj(q);
    this.headers.data = payload;

    const httpService = new HttpService();
    await httpService.init(); // Ensure this is awaited
    return await httpService.proc2(this.headers); // Ensure this is awaited
  }

  setEnvelopeGetCdObj(q: IQuery) {
    CdLogg.debug(' CdObjService::setEnvelopeGetCdObj()/starting...');
    return {
      ctx: 'Sys',
      m: 'Moduleman',
      c: 'CdObj',
      a: 'GetCount',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: this.cdToken,
      },
      args: {},
    };
  }
}
