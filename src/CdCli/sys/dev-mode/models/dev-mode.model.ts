/* eslint-disable style/brace-style */
/* eslint-disable node/prefer-global/process */
/* eslint-disable unused-imports/no-unused-vars */

import repl from 'node:repl';
import chalk from 'chalk';
import minimist from 'minimist';
import { CdCli } from '../../cd-cli/models/cd-cli.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
import { DevModeController } from '../controllers/dev-mode.controller';

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
            CdLogg.debug(`DevModeModel::eval()/input:${input}`);
            input = input.trim();
            inputBuffer += input;
            CdLogg.debug(`DevModeModel::eval()/inputBuffer:${inputBuffer}`);

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
            CdLogg.debug(`DevModeModel::eval()/commands:${commands}`);
            inputBuffer = '';

            for (const fullCommand of commands) {
              CdLogg.debug(`DevModeModel::eval()/fullCommand:${fullCommand}`);
              handleInput(`${fullCommand.trim()};`);
              callback(null, `Executed ${fullCommand} successfully.`);
            }
          } catch (error) {
            callback(
              error instanceof Error ? error : new Error(String(error)),
              undefined,
            );
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
    {
      name: 'show',
      description: 'List items within the current context.',
      options: [
        { flags: '--apps', description: 'List all registered applications.' },
        {
          flags: '--modules',
          description: 'List all modules within the current app.',
        },
        {
          flags: '--controllers',
          description: 'List all controllers within the current module.',
        },
      ],
      action: {
        execute: async (options) => {
          const devController = new DevModeController();
          CdLogg.debug(
            `DevModeModel::eval()/subcommands/options:${JSON.stringify(options)}`,
          );
          if (options.apps || options._[0] === 'apps') {
            console.log('Showing registered apps...');
            await devController.showApps();
          } else if (options.modules) {
            console.log('Showing modules...');
            await devController.showModules();
          } else if (options.controllers) {
            console.log('Showing controllers...');
            await devController.showControllers();
          } else {
            throw new Error(
              'Specify a valid option: apps, modules, or controllers.',
            );
          }
        },
      },
    },
    {
      name: 'exit',
      description: 'Exit development mode.',
      action: {
        execute: () => {
          console.log(chalk.yellow('Exiting development mode...'));
          process.exit(0);
        },
      },
    },
  ],
};

// Function to handle input
export function handleInput(input: string) {
  CdLogg.debug(`DevModeModel::handleInput()/input:${input}`);

  if (input.endsWith(';')) {
    const commands = input.split(';').filter((cmd) => cmd.trim());
    for (const command of commands) {
      executeCommand(command.trim());
    }
    inputBuffer = ''; // Clear buffer after processing
  } else {
    inputBuffer += input; // Append incomplete command
    console.log('...');
    isCommandIncomplete = true;
  }
}

// Function to execute commands
export function executeCommand(command: string) {
  CdLogg.debug(`DevModeModel::executeCommand()/command:${command}`);
  command = command.replace(/;$/, ''); // Remove trailing semicolon
  const [cmdName, ...args] = command.split(/\s+/);

  const subcommand = DEV_MODE_COMMANDS.subcommands.find(
    (sub) => sub.name === cmdName,
  );

  CdLogg.debug(`DevModeModel::executeCommand()/subcommand:${subcommand}`);
  if (!subcommand) {
    console.log(`Unknown command: ${cmdName}`);
    return;
  }

  const options = minimist(args);
  CdLogg.debug(
    `DevModeModel::executeCommand()/options:${JSON.stringify(options)}`,
  );

  try {
    if (subcommand.action?.execute) {
      subcommand.action.execute(options);
    } else {
      console.log(`No action defined for command: ${cmdName}`);
    }
  } catch (error) {
    console.error(`Error executing command "${cmdName}":`, error);
  }
}
