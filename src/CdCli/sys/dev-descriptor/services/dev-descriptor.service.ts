import type { CdDescriptors } from '../models/dev-descriptor.model';
/* eslint-disable style/brace-style */
import config from '@/config';
import { HttpService } from '../../base/http.service';
import { ISessResp } from '../../base/IBase';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { SessonController } from '../../user/controllers/session.controller';

export class DevDescriptorService {
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

  // async syncDescriptors(localDescriptorsData: CdDescriptors[]) {
  //   CdLogg.debug('DevDescriptorService::syncDescritors()/starting...');
  //   const payload = this.setEnvelopeSyncDescriptors(localDescriptorsData);
  //   this.headers.data = payload;
  //   // CdLogg.debug(
  //   //   'DevDescriptorService::syncDescritors()/this.headers:',
  //   //   this.headers,
  //   // );
  //   const httpService = new HttpService();
  //   await httpService.init();
  //   return await httpService.proc2(this.headers);
  // }
  async syncDescriptors(localDescriptorsData: CdDescriptors[]) {
    CdLogg.debug('DevDescriptorService::syncDescritors()/starting...');
    const payload = this.setEnvelopeSyncDescriptors(localDescriptorsData);
    this.headers.data = payload;

    const httpService = new HttpService();
    await httpService.init(); // Ensure this is awaited
    return await httpService.proc2(this.headers); // Ensure this is awaited
  }

  setEnvelopeSyncDescriptors(d: any) {
    CdLogg.debug(
      'DevDescriptorService::setEnvelopeSyncDescriptors()/starting...',
    );
    return {
      ctx: 'Sys',
      m: 'Moduleman',
      c: 'CdObj',
      a: 'SyncDescriptors',
      dat: {
        f_vals: [
          {
            data: d,
          },
        ],
        token: this.cdToken,
      },
      args: {},
    };
  }
}
