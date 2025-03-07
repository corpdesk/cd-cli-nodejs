/* eslint-disable antfu/if-newline */
/* eslint-disable style/brace-style */
import chalk from 'chalk';
import dayjs from 'dayjs';

class CdLog {
  // Default debug level (0 means no logs, 4 means all logs will be displayed)
  static debugLevel: number = 0;

  constructor() {
    this.init();
  }

  init() {}

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
    if (CdLog.debugLevel >= CdLog.LOG_LEVELS.INFO) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.blue('ℹ️'), formattedMessage));
    }
  }

  // Success level
  static success(message: string, context?: object) {
    if (CdLog.debugLevel >= CdLog.LOG_LEVELS.INFO) {
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
    if (CdLog.debugLevel >= CdLog.LOG_LEVELS.WARNING) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.yellow('ℹ⚠️'), formattedMessage));
    }
  }

  // Error level
  static error(message: string, context?: object) {
    if (CdLog.debugLevel >= CdLog.LOG_LEVELS.ERROR) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.red('❌'), formattedMessage));
    }
  }

  // Debug level
  // static debug(message: string, context?: object) {
  //   if (CdLog.debugLevel >= CdLog.LOG_LEVELS.DEBUG) {
  //     const formattedMessage = context
  //       ? `${message} | Context: ${JSON.stringify(context)}`
  //       : message;
  //     console.log(this.formatMessage(chalk.cyan('🛠️'), formattedMessage));
  //   }
  // }
  static debug(message: string, context?: object) {
    if (CdLog.debugLevel >= CdLog.LOG_LEVELS.DEBUG) {
      const formattedMessage = context
        ? `${message} | Context: ${JSON.stringify(context)}`
        : message;
      console.log(this.formatMessage(chalk.cyan('🛠️'), formattedMessage));
    }
  }

  // Method to set the global debug level
  static setDebugLevel(level: number): void {
    try {
      level = Number(level);
      console.log('CdLog::setDebugLevel()/log level:', level);
      CdLog.info(`starting NotifierController:setDebugLevel()/${level}`);
      if (typeof level !== 'number' || level > 4 || level < 0) {
        console.log('CdLog::setDebugLevel()/02:');
        CdLog.error('Invalid debug level. Using default level (0).');
        CdLog.debugLevel = 0; // Default to NONE if invalid level is provided
      } else {
        console.log('CdLog::setDebugLevel()/03:');
        CdLog.info(`debug level set to ${level}`);
        CdLog.debugLevel = level;
      }
    } catch (e) {
      console.error(
        `could not set the Debug level. Error: ${(e as Error).message}`,
      );
    }
  }

  static getDebugLevel(): number {
    return CdLog.debugLevel;
  }

  static safeStringify(obj: any, space = 2) {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      },
      space,
    );
  }
}

export default CdLog;
