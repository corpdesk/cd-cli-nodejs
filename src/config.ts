/* eslint-disable unused-imports/no-unused-vars */
import { description, name, version } from '../package.json';
import { ModCraftController } from './CdCli/sys/moduleman/controllers/mod-craft.controller';
import { UserController } from './CdCli/sys/user/controllers/user.controller';

export default {
  meta: {
    name: 'cd-cli',
    version,
    description,
    showHelpAfterError: true,
  },
  commands: [
    {
      name: 'login',
      description: 'Log in to the system.',
      options: [
        { flags: '-u, --user <username>', description: 'Username' },
        { flags: '-p, --password <password>', description: 'Password' },
      ],
      action: {
        execute: async (options) => {
          const user = new UserController();
          await user.auth(options.user, options.password);
        },
      },
    },
    {
      name: 'logout',
      description: 'Log out from the system.',
      action: {
        execute: () => {
          const user = new UserController();
          user.logout();
        },
      },
    },
    {
      name: 'template-api init',
      description: 'Initialize a new API module from a template.',
      options: [
        { flags: '--name <moduleName>', description: 'Name of the new module' },
        {
          flags: '--url <gitRepo>',
          description: 'Git repository URL of the template',
        },
      ],
      action: {
        execute: async (options) => {
          const modCraftController = new ModCraftController();
          await modCraftController.initTemplate(options.name, options.url);
        },
      },
    },
  ],
};

interface CommandOption {
  flags: string;
  description: string;
}

interface CommandAction {
  execute: (options: any) => Promise<void> | void;
}

interface CommandConfig {
  name: string;
  description: string;
  options?: CommandOption[];
  action: CommandAction;
}

interface AppConfig {
  meta: {
    name: string;
    version: string;
    description: string;
    showHelpAfterError: boolean;
  };
  commands: CommandConfig[];
}
