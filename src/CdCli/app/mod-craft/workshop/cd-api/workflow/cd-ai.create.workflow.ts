import { CdModuleDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-module-descriptor.model';
import { CiCdDescriptor } from '@/CdCli/sys/dev-descriptor/models/cicd-descriptor.model';
import { workshopConfig } from '../../../models/mod-craft.model';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';

export class CdAiWorkFlow {
  createWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    cdToken: string,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    return {
      cICdPipeline: {
        name: 'Module Creation Pipeline',
        type: 'cd-module-development',
        stages: [
          {
            name: 'Create Module Repository',
            description:
              'Initialize the folder and basic structure for the module.',
            tasks: [
              {
                name: 'createRepository',
                type: 'cdRequest',
                executor: 'cd-cli',
                className: 'CdAutoGit',
                methodName: 'createGitHubRepo',
                status: 'pending',
                cdRequest: {
                  ctx: 'Sys',
                  m: 'CdAutoGit',
                  c: 'CdAutoGit',
                  a: 'createGitHubRepo',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    repoName: cdModule.name,
                    descript: cdModule.description,
                    isPrivate: false,
                    repoHost: 'corpdesk',
                  },
                },
              },
            ],
          },
          /**
           * This assumes we have a cd-cli command dedicated to
           * executing bash scripts.
           * There would be a controller CdExecController which would have methods
           * for executing scripts eg
           * - CdExec()
           * - CdExecSql()
           *
           */
          {
            name: 'Database Preparation',
            description: 'Initial sync of database schema or seed content.',
            tasks: [
              {
                name: 'databasePreparation',
                type: 'method',
                executor: 'runner',
                className: 'CICdRunnerService',
                methodName: 'runScriptFromFile',
                scriptFile: workshopConfig(cdModule.name, moduleType)
                  .moduleWorkflowPaths.createSql,
                status: 'pending',
              },
            ],
          },
          /**
           * This assumes we have ModCraft module
           * CdExecController with the method createFromSql
           * createFromSql() would be responsible for creating models from sql definitions
           * and module descriptor
           *
           */
          {
            name: 'Setup typeorm models',
            description:
              'create models for each controller based on sql script',
            tasks: [
              {
                name: 'modelsDevelopment',
                type: 'method',
                executor: 'cd-cli',
                className: 'CdModelController',
                methodName: 'createFromSql',
                status: 'pending',
                cdRequest: {
                  ctx: 'App',
                  m: 'ModCraft',
                  c: 'CdModelController',
                  a: 'createFromSql',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    cdModule: cdModule,
                    pathToSql: workshopConfig(cdModule.name, moduleType)
                      .moduleWorkflowPaths.createSql,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }
}
