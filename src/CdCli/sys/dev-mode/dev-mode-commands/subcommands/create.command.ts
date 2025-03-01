import chalk from 'chalk';
import CdLogg from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { EnvironmentController } from '@/CdCli/sys/dev-descriptor/controllers/environment.controller';

export const createCommand = {
  name: 'create',
  description: 'Setup different environments dynamically.',
  options: [
    {
      flags: 'env',
      description: 'Setup an environment (dev or production equivalent).',
    },
    { flags: 'name', description: 'Profile name used as context identifier.' },
    {
      flags: 'workstation',
      description: 'Target workstation for the environment.',
    },
  ],
  action: {
    execute: async (options: any) => {
      const resource = options._[0]; // First positional argument (expected: 'env')

      if (!resource || resource.toLowerCase() !== 'env') {
        console.log(chalk.red('Error: Please specify "env" as the resource.'));
        return;
      }

      if (!options.name || !options.workstation) {
        console.log(
          chalk.red('Error: Both --name and --workstation are required.'),
        );
        return;
      }

      CdLogg.debug(
        `EnvSetup::createCommand()/resource:${resource}, name:${options.name}, workstation:${options.workstation}`,
      );

      const ctlEnvironment = new EnvironmentController();

      await ctlEnvironment.createEnvironment(options.name, options.workstation);
      console.log(
        chalk.green(
          `✔ Environment setup completed for profile: ${options.name}`,
        ),
      );
    },
  },
};
