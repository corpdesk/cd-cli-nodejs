import { createCommand } from './subcommands/create.command';
import { exitCommand } from './subcommands/exit.command';
import { showCommand } from './subcommands/show.command';
import { syncCommand } from './subcommands/sync.command';
import { getSubcommand } from './utils/command-utils';

export const DEV_MODE_COMMANDS = {
  name: 'dev',
  description: 'Enter development mode to manage applications.',
  action: {
    execute: async () => {
      console.log('Entering development mode...');
      let currentMode: 'default' | 'py' | 'js' = 'default';

      const replServer = repl.start({
        prompt: Branding.getPrompt(currentMode),
        eval: async (input, context, filename, callback) => {
          try {
            CdLogg.debug(`DevModeModel::eval()/input:${input}`);
            input = input.trim();
            inputBuffer += input;

            const hasDelimiterAtEnd = inputBuffer.endsWith(';');
            const lastPart = inputBuffer.split(';').pop();
            const hasTextAfterLastDelimiter = lastPart
              ? lastPart.trim().length > 0
              : false;

            if (!hasDelimiterAtEnd || hasTextAfterLastDelimiter) {
              callback(null, '...'); // Show continuation prompt
              return;
            }

            const commands = inputBuffer.split(';').filter((cmd) => cmd.trim());
            inputBuffer = '';

            const executionPromises = commands.map(async (fullCommand) => {
              return handleInput(`${fullCommand.trim()};`);
            });

            await Promise.all(executionPromises);
            callback(
              null,
              `Executed ${commands.length} commands successfully.`,
            );
            replServer.displayPrompt();
          } catch (error) {
            callback(
              error instanceof Error ? error : new Error(String(error)),
              undefined,
            );
            replServer.displayPrompt();
          }
        },
      });

      // Handle REPL mode switching
      replServer.defineCommand('mode', {
        help: 'Switch between modes (default, py, js).',
        action(newMode: string) {
          if (['default', 'py', 'js'].includes(newMode)) {
            currentMode = newMode as 'default' | 'py' | 'js';
            replServer.setPrompt(Branding.getPrompt(currentMode));
            replServer.displayPrompt();
            this.write(`Switched to ${newMode} mode.\n`);
          } else {
            this.write(
              `Unknown mode: ${newMode}. Available modes: default, py, js.\n`,
            );
          }
        },
      });

      replServer.on('exit', () => {
        console.log(chalk.yellow('Exited development mode.'));
        process.exit(0);
      });
    },
  },
  subcommands: [
    getSubcommand('show'),
    getSubcommand('sync'),
    getSubcommand('exit'),
    getSubcommand('create'),
  ],
};
