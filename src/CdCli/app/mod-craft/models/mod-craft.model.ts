import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { ModCraftController } from '../../mod-craft/controllers/mod-craft.controller';

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

export const SSH_TO_DEV_PROMPT_DATA: any = [
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

export const MODULE_CMD = {
  /**
   * Method to connect to a development server via SSH and clone a module repository into a cd-api project.
   * This would be a module that was developed by a 3rd party or by the user.
   * After cloning, it will set up the module structure and configure it for further development or use in the CorpDesk environment.
   *
   * Profile Selection: The user can pass the --profile flag (e.g., --profile=devServer-ssh-profile) in the command to use the specified profile. If the profile exists, the details are extracted and used for the SSH connection. If no profile is provided, the user is prompted to enter the SSH details manually.
   * Profile Data Extraction: If a profile is provided, the method will read the profiles.json file, extract the profile data (e.g., sshKey, remoteUser, devServer, cdApiDir), and use it to connect to the development server.
   * Command Construction: The command is constructed dynamically based on the provided or selected profile data. The ssh -i flag is used if an SSH key is provided; otherwise, it defaults to using ssh without a key.
   *
   * Usaging Profile:
   * cd-cli module init --type=cd-api --repo=https://github.com/corpdesk/cd-geo --profile=devServer-ssh-profile
   * This command will use the SSH settings from the devServer-ssh-profile profile to connect to the development server and clone the repository.
   *
   * Without profile:
   * cd-cli module init --type=cd-api --repo=https://github.com/corpdesk/cd-geo --dev-srv=192.168.1.70
   * If no profile is specified, the user will be prompted to enter the SSH connection details (server, user, key, etc.).
   *
   * Usage:
   * cd-cli module init --type=cd-api --repo=https://github.com/corpdesk/cd-geo --profile=devServer-ssh-profile --debug 4
   * Description:
   * This command initializes a new module from a specified repository.
   * It allows you to specify the type of module, the repository URL, and optionally a development server profile for SSH configuration.
   * The command will clone the repository, set up the module structure, and configure it for use in the CorpDesk environment.
   * Options:
   * --type: Specifies the type of module template to use (e.g., cd-api, module-frontend).
   * --repo: The Git repository URL from which to initialize the module.
   * --dev-srv: Specifies the development server to SSH into, which can be overridden by a profile.
   * --profile: The name of the profile for SSH configuration, which is optional.
   */
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
            'Type of the module template (e.g. as per CdModuleTypeDescriptor: examples cd-api, module-frontend, cd-cli)',
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
          const modCraftController = new ModCraftController();
          await modCraftController.initModuleFromRepo(
            options._optionValues.repo,
            options._optionValues.profile,
          );
        },
      },
    },
  ],
};

export const TEMPLATE_CMD = {
  /**
   * Method to initialize a new module template from repository.
   * The template will be stored in the specified directory and configured for use by cd-cli to auto create modules.
   *
   * Usage:
   * cd-cli template init --type=cd-api --url=https://github.com/corpdesk/abcd.git --debug 4
   *
   * */
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
          if (!options._optionValues.type || !options._optionValues.url) {
            throw new Error('Both --type and --url options are required.');
          }
          const modCraftController = new ModCraftController();
          await modCraftController.initTemplate(
            options._optionValues.type,
            options._optionValues.url,
          );
        },
      },
    },
  ],
};

export interface WorkshopConfig {
  moduleTemplateRepo: string;
  moduleTemplatePath: string;

  // Output folders (controllers, models, services)
  moduleOutputPath: string;
  moduleFolders: {
    // base: string;
    controllers: string;
    models: string;
    services: string;
  };

  // Model descriptor file path
  moduleModelPath: string;

  // Workflow file paths
  moduleWorkflowPaths: {
    create: string;
    createTs: string;
    createSql: string;
    createBash: string;
    edit: string;
    [key: string]: string; // Allow future workflows like 'delete', 'review', etc.
  };
}

export function workshopConfig(
  moduleName: string | null,
  moduleType: string | null,
): WorkshopConfig {
  CdLog.debug('Starting function workshopConfig()');
  const basePath = `./src/CdCli/app/mod-craft/workshop/${moduleType}`;
  return {
    moduleTemplateRepo: `https://github.com/corpdesk/abcd.git`,
    moduleTemplatePath: `${basePath}/template/abcd`,
    moduleModelPath: `${basePath}/model/${moduleName}-module.descriptor.json`,
    moduleWorkflowPaths: {
      create: `${basePath}/workflow/${moduleName}.create.workflow.json`,
      createTs: `${basePath}/workflow/${moduleName}.create.workflow.ts`,
      createSql: `${basePath}/workflow/${moduleName}.create.sql`,
      createBash: `${basePath}/workflow/${moduleName}.create.sh`,
      edit: `${basePath}/workflow/${moduleName}.edit.workflow.json`,
    },
    moduleOutputPath: `${basePath}/output/${moduleName}`,
    moduleFolders: {
      controllers: `${basePath}/output/${moduleName}/controllers`,
      models: `${basePath}/output/${moduleName}/models`,
      services: `${basePath}/output/${moduleName}/services`,
    },
  };
}
