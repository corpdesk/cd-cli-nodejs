import { CD_AUTO_GIT_CMD } from '@/CdCli/app/cd-auto-git/models/cd-auto-git.model';
import {
  MODULE_CMD,
  TEMPLATE_CMD,
} from '../../moduleman/models/mod-craft.model';
import { LOGIN_CMD, LOGOUT_CMD } from '../../user/models/user.model';
import { DEV_MODE_COMMANDS } from './/dev-mode.model';
import { PROFILE_CMD } from './cd-cli-profile.model';

export const CdCli = {
  commands: [
    LOGIN_CMD,
    LOGOUT_CMD,
    PROFILE_CMD,
    MODULE_CMD,
    TEMPLATE_CMD,
    CD_AUTO_GIT_CMD,
    DEV_MODE_COMMANDS,
  ] as any,
};
