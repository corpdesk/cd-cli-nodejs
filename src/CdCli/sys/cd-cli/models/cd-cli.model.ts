import {
  MODULE_CMD,
  TEMPLATE_CMD,
} from '../../moduleman/models/mod-craft.model';
import { LOGIN_CMD, LOGOUT_CMD } from '../../user/models/user.model';
import { PROFILE_CMD } from './cd-cli-profile.model';

export const CdCli = {
  commands: [
    LOGIN_CMD,
    LOGOUT_CMD,
    PROFILE_CMD,
    MODULE_CMD,
    TEMPLATE_CMD,
  ] as any,
};
