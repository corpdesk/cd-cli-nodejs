// src/CdCli/app/cd-ai/models/budget-guard.model.ts

export interface BudgetStatus {
  used: number; // How many tokens/dollars used
  limit: number; // Set budget cap
  remaining: number; // limit - used
  costPerToken?: number; // Optional cost per token if applicable
  timestamp?: number; // Optional timestamp for historical logs
  notes?: string; // Optional note for the log
}

export interface BudgetGuardProfile {
  cdCliProfileName: string; // Custom name like "openai-main", "gemini-tenant-2"
  provider: 'openai' | 'gemini' | 'deepseek'; // Add extensibility
  budget: BudgetStatus;
  BudgetLogs?: BudgetStatus[]; // Logs of all past statuses
  lastCheckedAt?: number; // Optional timestamp of last evaluation
}
