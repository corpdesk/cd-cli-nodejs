import type { CdRequest, ISessResp } from '../../base/IBase';
import type { CdDescriptor } from '../models/dev-descriptor.model';
/* eslint-disable style/brace-style */
import config from '@/config';
import { HttpService } from '../../base/http.service';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { CdObjModel } from '../../moduleman/models/cd-obj.model';
import { SessonController } from '../../user/controllers/session.controller';

export class DevDescriptorService {
  cdToken = '';
  baseUrl = '';
  httpService;
  svSession;
  sess: ISessResp;
  constructor() {
    this.init();
    this.svSession = new SessonController();
    this.sess = this.svSession.getSession(config.cdApiLocal);
    if (this.sess.cd_token) {
      this.cdToken = this.sess.cd_token;
    }
  }

  async init() {
    CdLogg.debug('DevDescriptorService::init()/starting...');
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

  async syncDescriptors(d: CdDescriptor[]) {
    CdLogg.debug('DevDescriptorService::syncDescritors()/starting...');
    // const payload = this.setEnvelopeSyncDescriptors(localDescriptorsData);
    const payload = this.setEnvelope('SyncDescriptors', { data: d });
    this.httpService.headers.data = payload;

    const httpService = new HttpService();
    await httpService.init(); // Ensure this is awaited
    return await httpService.proc2(this.httpService.headers); // Ensure this is awaited
  }

  // setEnvelopeSyncDescriptors(d: any) {
  //   CdLogg.debug(
  //     'DevDescriptorService::setEnvelopeSyncDescriptors()/starting...',
  //   );
  //   return {
  //     ctx: 'Sys',
  //     m: 'Moduleman',
  //     c: 'CdObj',
  //     a: 'SyncDescriptors',
  //     dat: {
  //       f_vals: [
  //         {
  //           data: d,
  //         },
  //       ],
  //       token: this.cdToken,
  //     },
  //     args: {},
  //   };
  // }

  setEnvelope(action: string, data: any): CdRequest {
    CdLogg.debug('CdAppService::setEnvelope()/starting...');
    // Reset f_vals array to avoid unintended accumulation
    CdObjModel.env.dat.f_vals = [];
    // Update the envelope with new action and data
    CdObjModel.env.a = action;
    CdObjModel.env.dat.f_vals.push(data);
    CdObjModel.env.dat.token = this.cdToken;
    return CdObjModel.env;
  }
}
