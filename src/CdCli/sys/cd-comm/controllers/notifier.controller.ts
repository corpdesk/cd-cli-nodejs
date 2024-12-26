import chalk from 'chalk';
import dayjs from 'dayjs';

class Logger {
  static formatMessage(level: string, message: string): string {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return `[${timestamp}] ${level} ${message}`;
  }

  static info(message: string, context?: object) {
    const formattedMessage = context
      ? `${message} | Context: ${JSON.stringify(context)}`
      : message;
    console.log(this.formatMessage(chalk.blue('ℹ️'), formattedMessage));
  }

  static success(message: string, context?: object) {
    const formattedMessage = context
      ? `${message} | Context: ${JSON.stringify(context)}`
      : message;
    console.log(
      this.formatMessage(chalk.green('ℹ✨'), chalk.green(formattedMessage)),
    );
  }

  static warning(message: string, context?: object) {
    const formattedMessage = context
      ? `${message} | Context: ${JSON.stringify(context)}`
      : message;
    console.log(this.formatMessage(chalk.yellow('ℹ⚠️'), formattedMessage));
  }

  static error(message: string, context?: object) {
    const formattedMessage = context
      ? `${message} | Context: ${JSON.stringify(context)}`
      : message;
    console.log(this.formatMessage(chalk.red('❌'), formattedMessage));
  }

  static debug(message: string, context?: object) {
    const formattedMessage = context
      ? `${message} | Context: ${JSON.stringify(context)}`
      : message;
    console.log(this.formatMessage(chalk.cyan('🛠️'), formattedMessage));
  }
}

export default Logger;
