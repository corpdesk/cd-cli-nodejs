import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { EnvironmentController } from '@/CdCli/sys/dev-descriptor/controllers/environment.controller';

export const createCommand = {
  name: 'create',
  description: 'Synchronize different resources.',
  options: [
    { flags: 'dev-env', description: 'development environment' },
    { flags: 'run-env', description: 'production environment' },
    { flags: 'name', description: 'name of given item eg dev-env.' },
  ],
  action: {
    execute: async (options: any) => {
      const resource = options._[0]; // First positional argument (resource type)

      if (!resource) {
        console.log(chalk.red('Error: Please specify a resource to sync.'));
        return;
      }

      CdLogg.debug(
        `DevModeModel::createCommand()/resource:${resource}, name:${options.name}`,
      );

      const ctlEnvironment = new EnvironmentController();

      switch (resource.toLowerCase()) {
        case 'dev-env':
          await ctlEnvironment.createEnvironment(options.name, options.wsName);
          console.log(chalk.green('✔ Setup completed successfully.'));
          break;
        case 'run-env':
          await ctlEnvironment.createEnvironment(options.name, options.wsName);
          console.log(chalk.green('✔ Synced apps successfully.'));
          break;
        default:
          console.log(chalk.red(`Unknown sync resource: ${resource}`));
          break;
      }
    },
  },
};
