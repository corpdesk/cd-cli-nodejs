import { getSubcommand } from './utils/command-utils';
import repl from 'node:repl';
import chalk from 'chalk';
import minimist from 'minimist';
import CdLog from '../../cd-comm/controllers/cd-logger.controller';

// Branding utility for reusable prompt designs
export const Branding = {
  getPrompt: (mode: 'default' | 'py' | 'js' = 'default') => {
    const branding = {
      cd: chalk.bgHex('#FF6A00').white.bold('cd'), // Orange background, white text
      separator: chalk.white(''), // White separator
    };

    const modes = {
      default: chalk.bgGray.black.bold(' dev '), // Gray background, black text
      py: chalk.bgBlue.white.bold(' py '), // Blue background, white text
      js: chalk.bgYellow.black.bold(' js '), // Yellow background, black text
    };

    const modeLabel = modes[mode] || modes.default;
    return `${branding.cd}${branding.separator}${modeLabel} ${chalk.greenBright('>')} `;
  },
};

// Main Development Mode Commands
let inputBuffer: string = '';
let isCommandIncomplete = false;

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
            CdLog.debug(`DevModeModel::eval()/input:${input}`);
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

export async function handleInput(input: string) {
  CdLog.debug(`DevModeModel::handleInput()/input:${input}`);

  if (input.endsWith(';')) {
    const commands = input.split(';').filter((cmd) => cmd.trim());
    for (const command of commands) {
      await executeCommand(command.trim()); // Ensure this is awaited
    }
    inputBuffer = ''; // Clear buffer after processing
  } else {
    inputBuffer += input; // Append incomplete command
    console.log('...');
    isCommandIncomplete = true;
  }
}

export async function executeCommand(command: string) {
  CdLog.debug(`DevModeModel::executeCommand()/command:${command}`);
  command = command.replace(/;$/, ''); // Remove trailing semicolon
  const [cmdName, ...args] = command.split(/\s+/);

  const subcommand = DEV_MODE_COMMANDS.subcommands.find(
    (sub) => sub.name === cmdName,
  );

  CdLog.debug(`DevModeModel::executeCommand()/subcommand:${subcommand}`);
  if (!subcommand) {
    console.log(`Unknown command: ${cmdName}`);
    return;
  }

  // Handle options differently based on subcommand
  const options = minimist(args);
  CdLog.debug(
    `DevModeModel::executeCommand()/options:${JSON.stringify(options)}`,
  );

  try {
    // Call action.execute with proper options
    if (subcommand.action?.execute) {
      await subcommand.action.execute({
        // Ensure this is awaited
        ...options,
        _: args, // Ensure positional arguments are passed
      });
    } else {
      console.log(`No action defined for command: ${cmdName}`);
    }
  } catch (error) {
    console.error(`Error executing command "${cmdName}":`, error);
    throw error; // Propagate the error to the eval function
  }
}
