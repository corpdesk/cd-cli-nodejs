// import { Inject, Injectable } from '@angular/core';
// import {
//   BaseService,
//   ServerService,
//   IQuery,
//   ICdRequest,
//   EnvConfig,
//   DEFAULT_ENVELOPE_CREATE,
//   DEFAULT_ENVELOPE_GET,
//   DEFAULT_ENVELOPE_GET_PAGED,
//   DEFAULT_ENVELOPE_GET_TYPE,
//   DEFAULT_ENVELOPE_UPDATE,
//   DEFAULT_ENVELOPE_DELETE,
// } from '@corpdesk/core';
// import { CoopRole, CoopsAclScope } from './coop-member.model';
// import { MemberMeta } from '../coops.model';

import type { ICdRequest, IQuery } from '../../base/IBase';
import { HttpService } from '../../base/http.service';
import { DEFAULT_ENVELOPE_CREATE } from '../../base/IBase';

// @Injectable({
//   providedIn: 'root',
// })
export class CdCliProfileService {
  svServer = new HttpService();
  postData: ICdRequest = DEFAULT_ENVELOPE_CREATE;
  constructor() {} // @Inject('env') private env: EnvConfig, // private svServer: ServerService,

  /**
   *
   * @param newModule
   * {
        "ctx": "Sys",
        "m": "Moduleman",
        "c": "Module",
        "a": "Create",
        "dat": {
            "f_vals": [
                {
                    "data": {
                        "moduleName": "xxx30102021",
                        "isSysModule": false
                    }
                }
            ],
            "token": "3ffd785f-e885-4d37-addf-0e24379af338"
        },
        "args": {}
    }
   */
  createCdCliProfile(newCdCliProfile: any, cdToken: string) {
    console.log('starting createCdCliProfile()/01:');
    this.setEnvelopeCreateCdCliProfile(newCdCliProfile, cdToken);
    console.log(
      'createCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return this.svServer.proc(
      this.setEnvelopeCreateCdCliProfile(newCdCliProfile, cdToken),
    );
  }

  setEnvelopeCreateCdCliProfile(d: any, cdToken: string) {
    console.log('starting setEnvelopeCreateCdCliProfile()/01:');
    console.log('starting setEnvelopeCreateCdCliProfile()/d:', d);
    console.log('starting setEnvelopeCreateCdCliProfile()/d.data:', d.data);
    return {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'Create',
      dat: {
        f_vals: [
          {
            data: d.data,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  getCdCliProfile(q: IQuery, cdToken: string) {
    this.setEnvelopeCdCliProfile(q, cdToken);
    console.log(
      'getCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return this.svServer.proc(this.postData);
  }

  //   getCdCliProfile(q: IQuery, cdToken: string) {
  //     console.log('CdCliProfileService::getCdCliProfile()/q:', q);
  //     this.setEnvelopeCdCliProfile(q, cdToken);
  //     console.log(
  //       'CdCliProfileService::getCdCliProfile()/this.postData:',
  //       JSON.stringify(this.postData),
  //     );
  //     return this.svServer.proc(this.postData);
  //   }

  getCdCliProfileProfile(uidObject: { userId: number }, cdToken: string) {
    console.log(
      'CdCliProfileService::getCdCliProfileProfile()/uidObject:',
      uidObject,
    );
    this.setEnvelopeGetCdCliProfileProfile(uidObject, cdToken);
    console.log(
      'CdCliProfileService::getCdCliProfileProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return this.svServer.proc(this.postData);
  }

  getCdCliProfileType(q: IQuery, cdToken: string) {
    this.setEnvelopeCdCliProfileType(q, cdToken);
    console.log(
      'getCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return this.svServer.proc(this.postData);
  }

  setEnvelopeCdCliProfile(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'GetCount',
      dat: {
        f_vals: [
          {
            data: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  setEnvelopeGetCdCliProfileProfile(
    uidObject: { userId: number },
    cdToken: string,
  ) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'GetCdCliProfileProfile',
      dat: {
        f_vals: [
          {
            data: uidObject,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  setEnvelopeCdCliProfileType(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'GetType',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  updateCdCliProfile(q: IQuery, cdToken: string) {
    this.setEnvelopeUpdate(q, cdToken);
    console.log(
      'updateCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return this.svServer.proc(this.postData);
  }

  setEnvelopeUpdate(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'Update',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }

  deleteCdCliProfile(q: IQuery, cdToken: string) {
    this.setEnvelopeDelete(q, cdToken);
    console.log(
      'deleteCdCliProfile()/this.postData:',
      JSON.stringify(this.postData),
    );
    return this.svServer.proc(this.postData);
  }

  setEnvelopeDelete(q: IQuery, cdToken: string) {
    this.postData = {
      ctx: 'Sys',
      m: 'CdCli',
      c: 'CdCliProfile',
      a: 'Delete',
      dat: {
        f_vals: [
          {
            query: q,
          },
        ],
        token: cdToken,
      },
      args: {},
    };
  }
}
