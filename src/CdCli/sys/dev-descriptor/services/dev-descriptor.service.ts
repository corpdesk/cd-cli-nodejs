import type { CdDescriptors } from '../models/dev-descriptor.model';
/* eslint-disable style/brace-style */
import config from '@/config';
import { HttpService } from '../../base/http.service';
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
    const ctlSession = new SessonController();
    const sess = ctlSession.getSession(config.cdApiLocal);
    if (sess && sess.cd_token) {
      this.cdToken = sess.cd_token;
      this.httpService = new HttpService(true); // Enable debug mode
      const ret = await this.httpService.getCdApiUrl(config.cdApiLocal);
      if (ret) {
        this.baseUrl = ret;
      }
    } else {
      CdLogg.error('Session is invalid');
    }
  }

  syncDescriptors(localDescriptorsData: CdDescriptors[]) {
    const payload = this.setEnvelopeSyncDescriptors(localDescriptorsData);
    this.headers.data = payload;
    return this.httpService.proc2(this.headers);
  }

  setEnvelopeSyncDescriptors(d: any) {
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
