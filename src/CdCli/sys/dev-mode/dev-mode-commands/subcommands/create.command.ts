import chalk from 'chalk';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { DevModeModel } from '../../models/dev-mode.model';
import { CdModuleController } from '@/CdCli/app/mod-craft/controllers/cd-module.controller';
import { CICdRunnerService } from '@/CdCli/sys/dev-descriptor/services/cd-ci-runner.service';
import { SessionService } from '@/CdCli/sys/user/services/session.service';
import { CdAiModel } from '@/CdCli/app/mod-craft/workshop/cd-api/model/cd-ai-module.model';
import { CdControllerController } from '@/CdCli/app/mod-craft/controllers/cd-controller.controller';
import { CdModelController } from '@/CdCli/app/mod-craft/controllers/cd-model.controller';

// export const createCommand = {
//   name: 'create',
//   description: 'Setup different environments or modules dynamically.',
//   options: [
//     { flags: 'env', description: 'Setup environment' },
//     { flags: 'name', description: 'Name of the module or environment' },
//     { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
//     { flags: 'workstation', description: 'Target workstation' },
//     {
//       flags: 'method',
//       description: 'Method of module creation (json, context, wizard, ai)',
//     },
//     { flags: 'json-file', description: 'Path to JSON module descriptor file' },
//     { flags: 'model-file', description: 'Path to JSON workflow model file' },
//   ],
//   action: {
//     execute: async (options: any) => {
//       CdLog.debug(
//         `CreateCommand: name: ${options._optionValues.name}, type: ${options._optionValues.type}`,
//       );

//       if (!options._optionValues.name || !options._optionValues.type) {
//         console.log(chalk.red('You must specify the namd and type.'));
//         return;
//       }

//       /**
//        * get current session
//        * This can also be provided via profile data
//        */
//       const sess = new SessionService();
//       const cdToken = await sess.sessData.cdToken;

//       /**
//        * Use options._optionValues.name and options._optionValues.type from the command
//        * to load descriptor and workflow
//        */
//       const ctlModuleController = new CdModuleController();
//       const svCdCiRunner = new CICdRunnerService();
//       const { moduleDescriptor, workflowModel } =
//         await svCdCiRunner.loadModuleDescriptorAndWorkflow(
//           options._optionValues.name,
//           options._optionValues.type,
//           cdToken,
//         );

//       const devModel: DevModeModel = {
//         method: 'json',
//         process: 'create',
//         workflow: workflowModel,
//       };
//       // Now invoke creation
//       await ctlModuleController.create(moduleDescriptor, devModel);
//       console.log(chalk.green(`✔ Module "${moduleDescriptor.name}" created.`));
//     },
//   },
// };

export const createCommand = {
  name: 'create',
  description:
    'Setup environments, modules, controllers, or models dynamically.',
  options: [
    { flags: 'module', description: 'Create a module' },
    { flags: 'controller', description: 'Create a controller' },
    { flags: 'model', description: 'Create a model' },
    { flags: 'name', description: 'Name of the item to create' },
    { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
    {
      flags: 'method',
      description: 'Creation method (json, context, wizard, ai)',
    },
    { flags: 'json-file', description: 'Path to JSON module descriptor file' },
    { flags: 'model-file', description: 'Path to JSON workflow model file' },
    { flags: 'workstation', description: 'Target workstation' },
  ],
  action: {
    execute: async (options: any) => {
      const name = options.name;
      const type = options.type;
      const isModule = options.module;
      const isController = options.controller;
      const isModel = options.model;

      CdLog.debug('createCommand::execute()/name:', name);
      CdLog.debug('createCommand::execute()/type:', type);

      if (!name) {
        console.log(chalk.red('❌ You must specify the name.'));
        return;
      }

      CdLog.debug('createCommand::execute()/01');
      const cdaiModel = new CdAiModel();
      const sess = new SessionService();
      const cdToken = await sess.sessData.cdToken;
      CdLog.debug('createCommand::execute()/02');
      const devModel: DevModeModel = cdaiModel.getDefaultModuleModel();
      CdLog.debug('createCommand::execute()/03');

      const runner = new CICdRunnerService();

      if (isModule) {
        CdLog.debug('createCommand::execute()/04');
        CdLog.debug('createCommand::execute()/type:', type);
        if (!type) {
          console.log(
            chalk.red('❌ You must specify the type for module creation.'),
          );
          return;
        }

        CdLog.debug('createCommand::execute()/05');
        const { moduleDescriptor, workflowModel } =
          await runner.loadModuleDescriptorAndWorkflow(name, type, cdToken);

        CdLog.debug('createCommand::execute()/06');
        devModel.workflow = workflowModel;

        const ctlModuleController = new CdModuleController();
        CdLog.debug('createCommand::execute()/07');
        await ctlModuleController.create(moduleDescriptor, devModel);
        console.log(
          chalk.green(`✔ Module "${moduleDescriptor.name}" created.`),
        );
      } else if (isController) {
        // const controllerDescriptor =
        //   await runner.loadControllerDescriptor(name); // Placeholder for logic
        // const ctlControllerController = new CdControllerController();
        // await ctlControllerController.create(controllerDescriptor, devModel);
        // console.log(chalk.green(`✔ Controller "${name}" created.`));
      } else if (isModel) {
        // const modelDescriptor = await runner.loadModelDescriptor(name); // Placeholder for logic
        // const ctlModelController = new CdModelController();
        // await ctlModelController.create(modelDescriptor, devModel);
        // console.log(chalk.green(`✔ Model "${name}" created.`));
      } else {
        console.log(
          chalk.red(
            '❌ You must specify either --module, --controller, or --model.',
          ),
        );
      }
    },
  },
};
