/* eslint-disable node/prefer-global/process */
export const exitCommand = {
  name: 'exit',
  description: 'Exit development mode.',
  action: {
    execute: () => {
      console.log(chalk.yellow('Exiting development mode...'));
      process.exit(0);
    },
  },
};
