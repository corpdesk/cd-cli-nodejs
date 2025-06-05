// import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import { ModCraftController } from '../controllers/mod-craft.controller';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';

export const InitModuleFromRepoPromptData: any = [
  {
    type: 'input',
    name: 'remoteServer',
    message: 'Enter development server address:',
    default: '192.168.1.70',
  },
  {
    type: 'input',
    name: 'remoteUser',
    message: 'Enter remote SSH user (default: devops):',
    default: 'devops',
  },
  {
    type: 'input',
    name: 'sshKey',
    message: 'Enter path to your SSH key:',
    default: '~/path/to/sshKey',
  },
  {
    type: 'input',
    name: 'cdApiDir',
    message: 'Enter directory on the server (e.g., ~/cd-api):',
    default: '~/cd-api',
  },
];

export interface PromptMeta {
  type: string;
  name: string;
  message: string;
  default: string;
}

export const DEFAULT_PROMPT_DATA = {
  cdCliProfileName: '',
  cdCliProfileData: null,
  cdCliProfileTypeId: -1,
  userId: -1,
};

export const CREATE_SSH_PROFILE_CMD = {
  name: 'create-ssh',
  description: 'Create a new SSH profile for a development server.',
  action: {
    execute: async () => {
      const cdCliProfileController = new CdCliProfileController();
      await cdCliProfileController.createProfile('create-ssh');
    },
  },
};

export const MODULE_CMD = {
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
            'Type of the module template (e.g., cd-api, module-frontend)',
        },
        {
          flags: '--repo <gitRepo>',
          description: 'Git repository URL of the module',
        },
        {
          flags: '--dev-srv <devServer>',
          description:
            'Development server to SSH into (can be overridden by profile)',
        },
        {
          flags: '--profile <profileName>',
          description: 'Profile name for SSH configuration (optional)',
        },
      ],
      action: {
        execute: async (options) => {
          CdLog.debug(`MODULE_CMD/execute()/options:${options}`);
          CdLog.debug(
            `MODULE_CMD/execute()/options.gitRepo:${options.gitRepo}`,
          );
          CdLog.debug(`MODULE_CMD/execute()/options.repo:${options.repo}`);
          CdLog.debug(
            `MODULE_CMD/execute()/options.profileName:${options.profileName}`,
          );
          CdLog.debug(
            `MODULE_CMD/execute()/options.profile:${options.profile}`,
          );
          const modCraftController = new ModCraftController();
          await modCraftController.initModuleFromRepo(
            options.repo,
            options.profile,
          );
        },
      },
    },
  ],
};

export const TEMPLATE_CMD = {
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
            'Type of the module template (e.g., cd-api, module-frontend)',
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
};
