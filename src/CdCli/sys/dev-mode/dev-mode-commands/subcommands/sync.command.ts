import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { DevDescriptorController } from '@/CdCli/sys/dev-descriptor/controllers/dev-descriptor.controller';

export const syncCommand = {
  name: 'sync',
  description: 'Synchronize different resources.',
  options: [
    { flags: 'descriptors', description: 'Sync descriptors.' },
    { flags: 'apps', description: 'Sync apps.' },
    { flags: 'modules', description: 'Sync modules.' },
  ],
  action: {
    execute: async (options: any) => {
      const resource = options._[0]; // First positional argument (resource type)
      const names = options._.slice(1); // Additional positional arguments (list of names)

      if (!resource) {
        console.log(chalk.red('Error: Please specify a resource to sync.'));
        return;
      }

      CdLogg.debug(
        `DevModeModel::syncCommand()/resource:${resource}, names:${JSON.stringify(names)}`,
      );

      const devDescriptor = new DevDescriptorController();

      switch (resource.toLowerCase()) {
        case 'descriptors':
          await devDescriptor.syncDescriptors(names);
          console.log(chalk.green('✔ Synced descriptors successfully.'));
          break;
        case 'apps':
          await devDescriptor.syncApps(names);
          console.log(chalk.green('✔ Synced apps successfully.'));
          break;
        case 'modules':
          await devDescriptor.syncModules(names);
          console.log(chalk.green('✔ Synced modules successfully.'));
          break;
        default:
          console.log(chalk.red(`Unknown sync resource: ${resource}`));
          break;
      }
    },
  },
};
