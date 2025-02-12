import { createCommand } from '../subcommands/create.command';
import { exitCommand } from '../subcommands/exit.command';
import { showCommand } from '../subcommands/show.command';
import { syncCommand } from '../subcommands/sync.command';

const SUBCOMMANDS = {
  show: showCommand,
  sync: syncCommand,
  exit: exitCommand,
  create: createCommand,
};

export function getSubcommand(name: string) {
  return SUBCOMMANDS[name] || null;
}
