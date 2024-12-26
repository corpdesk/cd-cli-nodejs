/* eslint-disable perfectionist/sort-imports */
/* eslint-disable style/brace-style */
import { createCommand } from 'commander';
import nodeCleanup from 'node-cleanup';
import updateNotifier from 'update-notifier';
import config from './config';
import { description, name, version } from '../package.json';
import 'zx/globals';

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

    program.hook('preAction', () =>
      updateNotifier({ pkg: { name, version } }).notify({
        isGlobal: true,
      }),
    );

    // Command registration
    for (const command of config.commands) {
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

    program.parse();
  }
}
