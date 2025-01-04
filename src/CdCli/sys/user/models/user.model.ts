import type { ICdRequest } from '../../base/IBase';
import { DEFAULT_ARGS, DEFAULT_DAT, SYS_CTX } from '../../base/IBase';
import { UserController } from '../controllers/user.controller';

export const SESSION_FILE_STORE = 'session.json';

export interface IUserModel {
  userId?: number;
  userGuid?: string;
  userName: string;
  password?: string;
  email?: string;
  companyId?: number;
  docId?: number;
  mobile?: string;
  gender?: number;
  birthDate?: string;
  postalAddr?: string;
  fName?: string;
  mName?: string;
  lName?: string;
  nationalId?: number;
  passportId?: number;
  userEnabled?: boolean | number;
  zipCode?: string;
  activationKey?: string;
  userTypeId?: number;
  userProfile?: string;
}

DEFAULT_DAT.f_vals[0].data = {
  userName: '',
  password: '',
} as IUserModel;

export const DEFAULT_ENVELOPE_LOGIN: ICdRequest = {
  ctx: SYS_CTX,
  m: 'User',
  c: 'User',
  a: 'Login',
  dat: DEFAULT_DAT,
  args: DEFAULT_ARGS,
};

// user.controller.ts
export const LOGIN_CMD = {
  name: 'login',
  description: 'Log in to the system.',
  options: [
    { flags: '-u, --user <username>', description: 'Username' },
    { flags: '-p, --password <password>', description: 'Password' },
  ],
  action: {
    execute: async (options) => {
      const userController = new UserController();
      const { user, password } = options;
      await userController.auth(user, password); // Password is now optional
    },
  },
};

export const LOGOUT_CMD = {
  name: 'logout',
  description: 'Log out from the system.',
  action: {
    execute: () => {
      const userController = new UserController();
      userController.logout();
    },
  },
};
