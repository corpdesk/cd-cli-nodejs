// src/CdCli/app/cd-ai/controllers/cd-budget-guard.controller.ts

import { BudgetGuardService } from '../services/budget-guard.service';

export class CdBudgetGuardController {
  start(): void {
    BudgetGuardService.start();
  }
}
