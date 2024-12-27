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
          const userController = new UserController();
          await userController.auth(options.user, options.password);
        },
      },
    },
    {
      name: 'logout',
      description: 'Log out from the system.',
      action: {
        execute: () => {
          const userController = new UserController();
          userController.logout();
        },
      },
    },
    {
      name: 'module',
      description: 'Manage modules.',
      subcommands: [
        {
          name: 'init',
          description: 'Initialize a new module from a repository.',
          options: [
            {
              flags: '--type <templateType>',
              description:
                'Type of the module template (e.g., module-api, module-frontend)',
            },
            {
              flags: '--repo <gitRepo>',
              description: 'Git repository URL of the module',
            },
            {
              flags: '--dev-srv <devServer>',
              description: 'Development server to SSH into',
            },
          ],
          action: {
            execute: async (options) => {
              if (!options.type || !options.repo || !options.devSrv) {
                throw new Error(
                  'Both --type, --repo, and --dev-srv options are required.',
                );
              }
              const modCraftController = new ModCraftController();
              await modCraftController.initModuleFromRepo(
                options.repo,
                options.devSrv,
              );
            },
          },
        },
      ],
    },
    {
      name: 'template',
      description: 'Manage module templates.',
      subcommands: [
        {
          name: 'init',
          description: 'Initialize a new module from a template.',
          options: [
            {
              flags: '--type <templateType>',
              description:
                'Type of the module template (e.g., module-api, module-frontend)',
            },
            {
              flags: '--url <gitRepo>',
              description: 'Git repository URL of the template',
            },
          ],
          action: {
            execute: async (options) => {
              if (!options.type || !options.url) {
                throw new Error('Both --type and --url options are required.');
              }
              const modCraftController = new ModCraftController();
              await modCraftController.initTemplate(options.type, options.url);
            },
          },
        },
      ],
    },
  ],
};
