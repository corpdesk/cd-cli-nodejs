import { exec } from 'node:child_process';
import util from 'node:util';

// import { Observable } from 'rxjs';

// import { Validators } from "@angular/forms";

/**
 * @path // the path of the controller relative to the BaseService file
 * @clsName // class name
 * @action // class method to invoke
 */

// export interface EnvConfig {
//   clientAppGuid: string;
//   appId: string;
//   production: boolean;
//   apiEndpoint: string;
//   sioEndpoint: string;
//   wsEndpoint: string;
//   wsMode: string;
//   pushConfig: any;
//   consumerToken?: string; // current company consumer. To depricate in favour of clientContext which will include consumerToken, entity:eg company name or project name eg ASDAP, MPEP etc
//   clientContext: any;
//   USER_RESOURCES: string;
//   apiHost: string;
//   shellHost: string;
//   sioHost: string;
//   CD_PORT?: number; // optional setting for apiEndpoint
//   consumer: string;
//   clientAppId: number; // this client application identifies itself to the server with this id
//   SOCKET_IO_PORT: number; // push server port
//   defaultauth?: string;
//   mfManifestPath?: string;
//   apiOptions?: any;
//   sioOptions?: any;
//   wsOptions?: any;
//   initialPage?: string;
//   firebaseConfig?: any;
// }
/**
 * @path // the path of the controller relative to the BaseService file
 * @clsName // class name
 * @action // class method to invoke
 */

export interface EnvConfig {
  clientAppGuid: string;
  appId: string;
  production: boolean;
  apiEndpoint: string;
  sioEndpoint: string;
  wsEndpoint: string;
  wsMode: string;
  pushConfig: any;
  consumerToken?: string; // current company consumer. To depricate in favour of clientContext which will include consumerToken, entity:eg company name or project name eg ASDAP, MPEP etc
  clientContext: any;
  USER_RESOURCES: string;
  apiHost: string;
  shellHost: string;
  sioHost: string;
  CD_PORT?: number; // optional setting for apiEndpoint
  consumer: string;
  clientAppId: number; // this client application identifies itself to the server with this id
  SOCKET_IO_PORT: number; // push server port
  defaultauth?: string;
  mfManifestPath?: string;
  apiOptions?: any;
  sioOptions?: any;
  wsOptions?: any;
  initialPage?: string;
  firebaseConfig?: any;
}

// export interface CdResponse {
//     app_state: {
//         success: number;
//         info: {
//             messages: string;
//             code: number;
//             app_msg: any;
//         };
//         sess: {
//             cd_token: string;
//             jwt: string;
//             p_sid: string;
//             ttl: number;
//         };
//         cache: object;
//     };
//     data: [];
// }

// {
//     f_vals: [
//         {
//             data: {}
//         }
//     ],
//     token: ''
// }

export const SYS_CTX = 'Sys';
export const DEFAULT_DAT: EnvelopDat = {
  f_vals: [
    {
      query: null,
      data: null,
    },
  ],
  token: null,
};

export const DEFAULT_ARGS = {};

export const DEFAULT_ENVELOPE_CREATE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Create',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Get',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET_PAGED: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'GetCount',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_GET_TYPE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'GetCount',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_UPDATE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Update',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export const DEFAULT_ENVELOPE_DELETE: ICdRequest = {
  ctx: SYS_CTX,
  m: '',
  c: '',
  a: 'Delete',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export interface CdResponse {
  app_state: IAppState;
  data: any[];
}

export interface ICdResponse {
  app_state: IAppState;
  data: any;
}

/////////////////////
// export interface ICdResponse {
//     app_state: {
//         success: boolean;
//         info: IRespInfo;
//         sess: ISessResp;
//         cache: object;
//         sConfig?:IServerConfig;
//     };
//     data: object;
// }

// export interface ISessResp {
//     cd_token?: string;
//     userId?: number | string | null;
//     jwt?: string;
//     ttl: number;
// }

// export interface IRespInfo {
//     messages: string[];
//     code: string;
//     app_msg: any;
// }

export interface IServerConfig {
  usePush: boolean;
  usePolling: boolean;
  useCacheStore: boolean;
}

////////////////////

export const DEFAULT_CD_RESPONSE: ICdResponse = {
  app_state: {
    success: false,
    info: {
      messages: [],
      code: '',
      app_msg: '',
    },
    sess: {
      cd_token: '',
      jwt: null,
      ttl: 600,
    },
    cache: {},
  },
  data: [],
};

export const DEFAULT_CD_REQUEST: ICdRequest = {
  ctx: 'Sys',
  m: '',
  c: '',
  a: '',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

export interface IAppState {
  success: boolean;
  info: IRespInfo | null;
  sess: ISessResp | null;
  cache: object | null;
  sConfig?: IServerConfig;
}

// cd request format
export interface CdRequest {
  ctx: string;
  m: string;
  c: string;
  a: string;
  dat: object;
  args: object;
}

// cd response format
// export interface CdResponse {
//     app_state: {
//         success: number;
//         info: {
//             messages: string;
//             code: number;
//             app_msg: any;
//         };
//         sess: {
//             cd_token: string;
//             jwt: string;
//             p_sid: string;
//             ttl: number;
//         };
//         cache: object;
//     };
//     data: [];
// }

export interface IControllerContext {
  path: string;
  clsName: string;
  action: string;
}

export interface IModelRules {
  create: object;
  update: object;
  remove: object;
}

// cd request format
export interface ICdRequest {
  ctx: string;
  m: string;
  c: string;
  a: string;
  dat: EnvelopDat;
  args: any | null;
}

export interface EnvelopDat {
  f_vals: EnvelopFValItem[];
  token: string | null;
}

export interface EnvelopFValItem {
  query?: IQuery | null;
  data?: any;
  extData?: any;
  jsonUpdate?: any;
}

export enum ModuleScope {
  Sys = 0,
  App = 1,
}

// export interface ISessResp {
//     cd_token?: string | null;
//     jwt?: string | null;
//     ttl: number;
// }

export interface ISessResp {
  cd_token?: string;
  userId?: number | string | null;
  jwt: {
    jwtToken: string | null;
    checked: boolean;
    checkTime: number | null;
    authorized: boolean;
    ttl: number | null;
  } | null;
  ttl: number;
  initUuid?: string;
  initTime?: string;
}

export interface IRespInfo {
  messages: string[];
  code: string | null;
  app_msg: string | null;
}

// export interface ICdPushEnvelop {
//     pushRecepients: any;
//     triggerEvent: string;
//     emittEvent: string;
//     req: ICdRequest;
//     resp: ICdResponse;
//     pushData?: any;
// }

// export interface ICdPushEnvelop {
//     pushData: {
//         appId: string;
//         socketScope: string;
//         pushGuid: string;
//         m?: string,
//         pushRecepients: ICommConversationSub[];
//         triggerEvent: string;
//         emittEvent: string;
//         token: string;
//         commTrack: CommTrack;
//         isNotification: boolean | null;
//     },
//     req: ICdRequest | null,
//     resp: ICdResponse | null
// };
export interface ICdPushEnvelop {
  pushData: {
    appId?: string;
    appSockets?: ISocketItem[];
    pushGuid: string;
    m?: any;
    pushRecepients: ICommConversationSub[];
    triggerEvent: string;
    emittEvent: string;
    token: string;
    commTrack: CommTrack;
    isNotification: boolean | null;
    isAppInit?: boolean | null;
  };
  req: ICdRequest | null;
  resp: ICdResponse | null;
}

export interface ISocketItem {
  socketId: string;
  name: string;
  socketGuid?: string;
}

export interface LsFilter {
  storageType: StorageType;
  cdObjId?: CdObjId;
  appState?: IAppState;
}

// export interface ICdPushEnvelop {
//     pushData: {
//         appId: string;
//         socketScope: string;
//         pushGuid: string;
//         m?: string;
//         pushRecepients: ICommConversationSub[];
//         triggerEvent: string;
//         emittEvent: string;
//         token: string;
//         commTrack: CommTrack;
//         isNotification: boolean | null;
//     },
//     req: ICdRequest | null,
//     resp: ICdResponse | null
// };

// export interface IPushRecepient {
//     userId: number;
//     subTypeId: number;
//     room?: string;
// }

export interface IServiceInput {
  svInstance: any;
  serviceModel: any;
  serviceModelInstance?: any;
  docName?: string;
  cmd?: any;
  data?: any;
  dSource?: number;
}

export interface IDoc {
  docId?: number;
  docGuid?: string;
  docName?: string;
  docDescription?: string;
  companyId?: number;
  docFrom: number;
  docTypeId: number;
  docDate?: Date;
  attachGuid?: string;
  docExpireDate?: Date;
}

export type ClassRef = new (...args: any[]) => any;
export type Fn = () => void;

export interface IUser {
  userID: number;
  userGUID: string;
  userName: string;
}
export interface IBase {
  cdToken: string;
  cRules: object;
  uRules: object;
  dRules: object;
}

// export interface ICommConversationSub {
//     userId: number; // subscriber userId
//     subTypeId: number; // type of subscriber
//     commconversationId?: number;
//     commconversationsubId?: number;
//     commconversationsubInvited?: boolean;
//     commconversationsubAccepted?: boolean;
//     groupId?: number; // can be used to represent chat room in websocket service
//     // commTrack: CommTrack;
//     cdObjId: CdObjId;
// }
export interface ICommConversationSub {
  userId: number; // subscriber userId
  subTypeId: number; // type of subscriber
  commconversationId?: number;
  commconversationsubId?: number;
  commconversationsubInvited?: boolean;
  commconversationsubAccepted?: boolean;
  groupId?: number; // can be used to represent chat room in websocket service
  // commTrack: CommTrack;
  cdObjId: CdObjId;
}

// export interface CommTrack {
//     initTime: number | null,
//     relayTime: number | null,
//     relayed: boolean,
//     deliveryTime: number | null,
//     deliverd: boolean,
// }

export interface CommTrack {
  initTime: number | string | null;
  relayTime: number | string | null;
  pushed: boolean;
  pushTime: number | string | null;
  relayed: boolean;
  deliveryTime: number | string | null;
  delivered: boolean;
  completed?: boolean;
  completedTime?: number | string | null;
  cached?: boolean;
  cachedTime?: number | string | null;
  saved?: boolean;
  savedTime?: number | string | null;
}

export interface CdObjId {
  appId: string;
  ngModule: string | null;
  resourceName: string | null;
  resourceGuid: string | null;
  jwtToken: string | null;
  socket: any;
  socketId?: string;
  commTrack: CommTrack | null;
}

export enum StorageType {
  CdObjId = 0,
  IAppState = 1,
}

export interface LsFilter {
  storageType: StorageType;
  cdObjId?: CdObjId;
  appState?: IAppState;
}

export const DEFAULT_COMM_TRACK = {
  initTime: null,
  relayTime: null,
  relayed: false,
  deliveryTime: null,
  deliverd: false,
  pushed: false,
  pushTime: null,
  delivered: false,
};

export interface IAclCtx {
  memberGuid: string;
  moduleGroupGuid: any;
  consumerId: number;
  moduleName: string;
  currentUser: any;
  module: any;
}

// export const controlFormatt = {
//   text: ['', [Validators.required]],
//   textDisabled: ['', [Validators.required]],
//   email: [
//     '',
//     [
//       Validators.required,
//       Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}$'),
//     ],
//   ],
//   url: ['', [Validators.required, Validators.pattern('https?://.+')]],
//   digits: ['', [Validators.required, Validators.pattern('[0-9]+')]],
//   number: ['', [Validators.required, Validators.pattern('[0-9]+')]],
//   alphanum: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9]+')]],
//   textarea: ['', [Validators.required]],
//   password: ['', [Validators.required, Validators.minLength(6)]],
//   confirmpwd: ['', Validators.required],
// };

export interface IQuery {
  select?: string[];
  update?: object;
  where: object;
  take?: number;
  skip?: number;
}

export enum FieldType {
  number = 0,
  string = 1,
  boolean = 2,
  date = 3,
  json = 4,
  enum = 5,
  action = 6,
  geoLocation = 7,
  decimal = 8,
  any = 9,
}

export const INIT_CD_RESP = {
  app_state: {
    success: false,
    info: {
      messages: [],
      code: '',
      app_msg: '',
    },
    sess: {
      cd_token: null,
      jwt: null,
      ttl: 0,
    },
    cache: {},
  },
  data: null,
};

export interface CacheData {
  key: string;
  value?: string;
  initUuid?: string;
  initTime?: string;
}

export interface ILoginData {
  consumer: IConsumer[];
  menuData: IMenuItem[];
  userData: IUserData;
}

export interface IConsumer {
  consumerId: number | string;
  consumerGuid: string;
  consumerName: string;
  consumerEnabled: number | string | null;
  docId: number | string | null;
  companyId: number | string | null;
  companyGuid: string | null;
}

export interface IMenuItem {
  menuLabel: string | null;
  menuId: number;
  icon: string | null;
  path: string | null;
  isTitle: string | null;
  badge: string | null;
  menuParentId: number | string | null;
  isLayout: number | boolean | null;
  moduleIsPublic: number | string | null;
  moduleGuid: string | null;
  children: IMenuItem[];
}

export interface IUserData {
  userId: number | string;
  userGuid: string | null;
  userName: string | null;
  email: string | null;
  companyId: number | string | null;
  docId: number | string | null;
  mobile: number | string | null;
  gender: number | string | null;
  birthDate: string | null;
  postalAddr: string | null;
  fName: string | null;
  mName: string | null;
  lName: string | null;
  nationalId: number | string | null;
  passportId: number | string | null;
  userEnabled: boolean | number | null;
  zipCode: string | null;
  activationKey: string | null;
  userTypeId: number | string | null;
}

export type SearchTerm = { term: string } | string;
