import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { DevDescriptorController } from '@/CdCli/sys/dev-descriptor/controllers/dev-descriptor.controller';
import { DevelopmentEnvironmentController } from '@/CdCli/sys/dev-descriptor/controllers/development-environment.controller';
import { DevelopmentEnvironmentService } from '@/CdCli/sys/dev-descriptor/services/development-environment.service';

export const createCommand = {
  name: 'create',
  description: 'Synchronize different resources.',
  options: [
    { flags: 'dev-env', description: 'development environment' },
    { flags: 'run-env', description: 'runtime environment' },
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

      const ctlDevelopmentEnvironment = new DevelopmentEnvironmentController();

      switch (resource.toLowerCase()) {
        case 'dev-env':
          await ctlDevelopmentEnvironment.createEnvironment(options.name);
          console.log(chalk.green('✔ Setup completed successfully.'));
          break;
        case 'run-env':
          await ctlDevelopmentEnvironment.createEnvironment(options.name);
          console.log(chalk.green('✔ Synced apps successfully.'));
          break;
        default:
          console.log(chalk.red(`Unknown sync resource: ${resource}`));
          break;
      }
    },
  },
};
