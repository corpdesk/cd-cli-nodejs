// src/CdCli/app/cd-ai/services/cd-ai-log-router.service.ts
const LOG_BUFFER_LIMIT = 1000;

export class CdAiLogRouterService {
  private static logs: string[] = [];
  private static writeToConsole = false; // Always route by default

  /**
   * If dev mode is enabled, disable console output and enable routing.
   * @param enabled Whether dev mode is on.
   */
  static setDevMode(enabled: boolean) {
    this.writeToConsole = !enabled;
  }

  /**
   * Push an AI log message into memory buffer.
   * @param message The log message
   */
  static push(message: string) {
    if (this.writeToConsole) return; // prevent console leaks

    this.logs.push(message);
    if (this.logs.length > LOG_BUFFER_LIMIT) {
      this.logs.shift();
    }

    // Optional: write to file
    // fs.appendFileSync('/tmp/cd-ai.log', message + '\n');
  }

  static getLogs(): string[] {
    return [...this.logs];
  }

  static clear() {
    this.logs = [];
  }
}
