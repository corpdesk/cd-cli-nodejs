// src/CdCli/app/cd-ai/services/budget-guard.service.ts

import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import { BudgetStatus } from '../models/budget-guard.model';
import { CdAiLogRouterService } from './cd-ai-log-router.service';

export class BudgetGuardService {
  static start(): void {
    // CdLog.aiInfo('[BudgetGuard] Monitoring AI budget usage...');
    CdAiLogRouterService.push('[BudgetGuard] Monitoring AI budget usage...');
    // Real implementation would check persistent usage data
    const budget: BudgetStatus = {
      used: 20,
      limit: 100,
      remaining: 80,
    };

    if (budget.remaining < 10) {
      CdAiLogRouterService.push('[BudgetGuard] Budget running low!');
    } else {
      CdAiLogRouterService.push(
        `[BudgetGuard] Budget OK. Remaining: ${budget.remaining}`,
      );
    }
  }
}
