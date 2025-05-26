// src/CdCli/app/cd-ai/models/queue-watcher.model.ts

// export interface QueueWatcherConfig {
//   intervalMs: number;
// }

// export interface QueuedTask {
//   id: string;
//   type: string;
//   payload: any;
//   status: 'pending' | 'running' | 'completed' | 'failed';
// }

export interface QueueWatcherConfig {
  intervalMs: number;
  cdCliProfileName?: string; // Track which profile manages the queue if needed
  maxRetries?: number; // Optional retry limit for failed tasks
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface QueuedTask {
  id: string;
  type: string; // e.g., 'chat', 'code-completion', 'image-gen'
  payload: any; // Actual request or parameters
  status: TaskStatus;
  createdAt?: number;
  updatedAt?: number;
  attempts?: number;
  cdCliProfileName?: string; // Whose budget/profile it's associated with
  errorDetails?: string; // In case of failure
}
