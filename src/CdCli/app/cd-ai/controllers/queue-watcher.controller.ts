// src/CdCli/app/cd-ai/controllers/cd-queue-watcher.controller.ts

import { QueueWatcherService } from '../services/queue-watcher.service';

export class CdQueueWatcherController {
  start(): void {
    QueueWatcherService.start();
  }

  stop(): void {
    QueueWatcherService.stop();
  }
}
