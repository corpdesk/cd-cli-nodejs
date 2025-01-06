/* eslint-disable style/brace-style */
import chalk from 'chalk';
import dayjs from 'dayjs';

class Logger {
  // Default debug level (0 means no logs, 4 means all logs will be displayed)
  static debugLevel: number = 0;

  // Define log levels
  static LOG_LEVELS = {
    NONE: 0,
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 4,
  };

  // Method to format the log message with timestamp
  static formatMessage(level: string, message: string): string {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return `[${timestamp}] ${level} ${message}`;
  }

  // Info level
  static info(message: string, context?: object | string | null) {
    if (Logger.debugLevel >= Logger.LOG_LEVELS.INFO) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.blue('ℹ️'), formattedMessage));
    }
  }

  // Success level
  static success(message: string, context?: object) {
    if (Logger.debugLevel >= Logger.LOG_LEVELS.INFO) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(
        this.formatMessage(chalk.green('ℹ✨'), chalk.green(formattedMessage)),
      );
    }
  }

  // Warning level
  static warning(message: string, context?: object) {
    if (Logger.debugLevel >= Logger.LOG_LEVELS.WARNING) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.yellow('ℹ⚠️'), formattedMessage));
    }
  }

  // Error level
  static error(message: string, context?: object) {
    if (Logger.debugLevel >= Logger.LOG_LEVELS.ERROR) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.red('❌'), formattedMessage));
    }
  }

  // Debug level
  static debug(message: string, context?: object) {
    if (Logger.debugLevel >= Logger.LOG_LEVELS.DEBUG) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.cyan('🛠️'), formattedMessage));
    }
  }

  // Method to set the global debug level
  static setDebugLevel(level: number): void {
    if (Object.values(Logger.LOG_LEVELS).includes(level)) {
      Logger.debugLevel = level;
    } else {
      Logger.error('Invalid debug level. Using default level (0).');
      Logger.debugLevel = 0; // Default to NONE if invalid level is provided
    }
  }
}

export default Logger;
