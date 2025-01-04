/* eslint-disable ts/consistent-type-imports */
import { description, name, version } from '../package.json';
import { ISessResp } from './CdCli/sys/base/IBase';
import { PROFILE_CMD } from './CdCli/sys/cd-cli/models/cd-cli-profile.model';
import {
  MODULE_CMD,
  TEMPLATE_CMD,
} from './CdCli/sys/moduleman/models/mod-craft.model';
import { LOGIN_CMD, LOGOUT_CMD } from './CdCli/sys/user/models/user.model';

export interface CommandOption {
  flags: string;
  description: string;
}

export interface CommandAction {
  execute: (options: any) => Promise<void>;
}

export interface Command {
  name: string;
  description: string;
  options?: CommandOption[]; // options are optional
  action: CommandAction;
  subcommands?: Command[]; // Subcommands are optional
}

const sess: ISessResp = {
  jwt: null,
  ttl: 300,
};
export default {
  cdApiEndPoint: 'https://localhost:3001/api',
  cdSession: sess,
  meta: {
    name: 'cd-cli',
    version,
    description,
    showHelpAfterError: true,
  },
  commands: [
    LOGIN_CMD,
    LOGOUT_CMD,
    PROFILE_CMD,
    MODULE_CMD,
    TEMPLATE_CMD,
  ] as Command[],
};
