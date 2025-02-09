import type { ICdRequest } from '../../base/IBase';

export class CdObjModel {
  static env: ICdRequest = {
    ctx: 'Sys',
    m: 'Moduleman',
    c: 'CdObj',
    a: '',
    dat: {
      f_vals: [],
      token: '',
    },
    args: {},
  };
}
