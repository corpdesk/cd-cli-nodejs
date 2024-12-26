#!/usr/bin/env node
import { createCommand } from 'commander';
import nodeCleanup from 'node-cleanup';
import updateNotifier from 'update-notifier';
import { description, name, version } from '../package.json';
import { CdUser } from './commands/user';

import 'zx/globals';

const startAt = Date.now();

nodeCleanup((exitCode) =>
  console.log(
    exitCode
      ? `${chalk.red.bold('error')} Command failed with exit code ${exitCode}.`
      : `✨ Done in ${((Date.now() - startAt) / 1000).toFixed(2)}s.`,
  ),
);

// Command setup
const program = createCommand('cd-cli');

program
  .version(version)
  .description(description)
  .showHelpAfterError('(add --help for additional information)')
  .hook('preAction', () =>
    updateNotifier({ pkg: { name, version } }).notify({
      isGlobal: true,
    }),
  );

/**
 * Command register
 */
program
  .command('login')
  .description('Log in to the system.')
  .option('-u, --user <username>', 'Username')
  .option('-p, --password <password>', 'Password')
  .action(async (options) => {
    const user = new CdUser();
    await user.auth(options.user, options.password);
  });

program
  .command('logout')
  .description('Log out from the system.')
  .action(() => {
    const user = new CdUser();
    user.logout();
  });

program.parse();
