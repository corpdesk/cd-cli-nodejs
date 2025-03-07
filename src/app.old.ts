/* eslint-disable perfectionist/sort-imports */
/* eslint-disable style/brace-style */
import { createCommand } from 'commander';
import nodeCleanup from 'node-cleanup';
import updateNotifier from 'update-notifier';
import config from './config';
// import { CdCli } from './CdCli/sys/cd-cli/models/cd-cli-profile.model';
import { name, version } from '../package.json';
import 'zx/globals';
import { setLogLevel } from './CdCli/sys/cd-comm/controllers/cd-winston';
import CdLog from './CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { CdCli } from './CdCli/sys/cd-cli/models/cd-cli.model';
// import { logger } from './CdCli/sys/cd-comm/controllers/cd-winston';

export class App {
  constructor() {}

  async run() {
    const startAt = Date.now();

    // Cleanup handler
    nodeCleanup((exitCode) =>
      console.log(
        exitCode
          ? `${chalk.red.bold('error')} Command failed with exit code ${exitCode}.`
          : `✨ Done in ${((Date.now() - startAt) / 1000).toFixed(2)}s.`,
      ),
    );

    // Command setup
    const program = createCommand(config.meta.name);
    program.version(config.meta.version).description(config.meta.description);

    if (config.meta.showHelpAfterError) {
      program.showHelpAfterError('(add --help for additional information)');
    }

    // ---------------------------------------------------------
    // const program = new Command();

    // Add the --debug flag globally
    program.option(
      '--debug <level>',
      'Set the debug level dynamically during production',
      (level: any) => {
        // Parse the level and set it
        setLogLevel(level);
        CdLog.setDebugLevel(level);
        return level; // Return the level to be used internally
      },
      'info', // Default level
    );

    // Parse the arguments
    // program.parse(process.argv);

    // ---------------------------------------------------------

    program.hook('preAction', () =>
      updateNotifier({ pkg: { name, version } }).notify({
        isGlobal: true,
      }),
    );

    // CdLog.info('config:', config);
    // Command registration: Ensuring that we register commands properly
    // console.log('CdCli.commands:', CdCli.commands);
    for (const command of CdCli.commands) {
      const cmd = program
        .command(command.name)
        .description(command.description);

      if (command.options) {
        for (const option of command.options) {
          cmd.option(option.flags, option.description);
        }
      }

      // Check for subcommands
      if (command.subcommands) {
        for (const subcommand of command.subcommands) {
          // CdLog.debug('subcommand.name:', subcommand.name);
          const subCmd = cmd
            .command(subcommand.name)
            .description(subcommand.description);

          if (subcommand.options) {
            for (const option of subcommand.options) {
              subCmd.option(option.flags, option.description);
            }
          }

          subCmd.action(async (options) => {
            try {
              await subcommand.action.execute(options);
            } catch (error) {
              console.error(
                `${chalk.red.bold('error')} ${(error as Error).message}`,
              );
            }
          });
        }
      } else {
        // Register action for top-level commands
        cmd.action(async (options) => {
          try {
            await command.action.execute(options);
          } catch (error) {
            console.error(
              `${chalk.red.bold('error')} ${(error as Error).message}`,
            );
          }
        });
      }
    }

    // console.log('Registered commands:', CdCli.commands);
    program.parse();
  }
}
