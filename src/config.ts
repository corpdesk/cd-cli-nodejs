// /* eslint-disable ts/consistent-type-imports */
// import { description, name, version } from '../package.json';
// import { ISessResp } from './CdCli/sys/base/IBase';
// import { PROFILE_CMD } from './CdCli/sys/cd-cli/models/cd-cli-profile.model';
// import {
//   MODULE_CMD,
//   TEMPLATE_CMD,
// } from './CdCli/sys/moduleman/models/mod-craft.model';
// import { LOGIN_CMD, LOGOUT_CMD } from './CdCli/sys/user/models/user.model';

// export interface CommandOption {
//   flags: string;
//   description: string;
// }

// export interface CommandAction {
//   execute: (options: any) => Promise<void>;
// }

// export interface Command {
//   name: string;
//   description: string;
//   options?: CommandOption[]; // options are optional
//   action: CommandAction;
//   subcommands?: Command[]; // Subcommands are optional
// }

// const sess: ISessResp = {
//   jwt: null,
//   ttl: 300,
// };
// export default {
//   cdApiEndPoint: 'https://localhost:3001/api',
//   cdSession: sess,
//   meta: {
//     name: 'cd-cli',
//     version,
//     description,
//     showHelpAfterError: true,
//   },
//   commands: [
//     LOGIN_CMD,
//     LOGOUT_CMD,
//     PROFILE_CMD,
//     MODULE_CMD,
//     TEMPLATE_CMD,
//   ] as Command[],
// };

import type { ISessResp } from './CdCli/sys/base/IBase';
import { Command } from 'commander';
import { PROFILE_CMD } from './CdCli/sys/cd-cli/models/cd-cli-profile.model';
import {
  logger,
  setLogLevel,
} from './CdCli/sys/cd-comm/controllers/cd-winston';
import {
  MODULE_CMD,
  TEMPLATE_CMD,
} from './CdCli/sys/moduleman/models/mod-craft.model';
import { LOGIN_CMD, LOGOUT_CMD } from './CdCli/sys/user/models/user.model';

// const program = new Command();

// // Declare the global debug flag
// program.option(
//   '--debug <level>',
//   'Set the debug level (0-4)',
//   Number.parseInt,
//   0,
// );

// // Parse the arguments
// program.parse(process.argv);

// // Get the debug level using program.opts()
// const options = program.opts();
// const debugLevel = options.debug; // This will now contain the value of --debug
// logger.setDebugLevel(debugLevel);
// ---------------------------

const sess: ISessResp = {
  jwt: null,
  ttl: 300,
};

// const dbg = {
//   flags: '--debug <level>',
//   description: 'set debug level',
//   defaultValue: 1, // Default template file
// };
// const commands = [LOGIN_CMD, LOGOUT_CMD, PROFILE_CMD, MODULE_CMD, TEMPLATE_CMD];
// const cmds = getCommandsWithDebug(commands, dbg);
// console.log('cmds:', JSON.stringify(cmds));

export default {
  cdApiEndPoint: 'https://localhost:3001/api',
  cdSession: sess,
  meta: {
    name: 'cd-cli',
    version: '1.0.0',
    description: 'Your description here',
    showHelpAfterError: true,
  },
  commands: [
    LOGIN_CMD,
    LOGOUT_CMD,
    PROFILE_CMD,
    MODULE_CMD,
    TEMPLATE_CMD,
  ] as any,
};

// function getCommandsWithDebug(commands, dbg) {
//   for (const command of commands) {
//     if ('command' in command) {
//       if ('options' in command) {
//         command.options.push(dbg);
//       } else {
//         command.options = [dbg];
//       }
//     }
//     if ('subcommands' in command) {
//       for (const subcommand of command.subcommands) {
//         if ('options' in subcommand) {
//           subcommand.options.push(dbg);
//         } else {
//           subcommand.options = [dbg];
//         }
//       }
//     }
//   }
//   return commands;
// }
