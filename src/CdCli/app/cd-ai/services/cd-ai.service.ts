// src/CdCli/app/cd-ai/services/cd-ai.service.ts

import { CdAiPromptRequest, CdAiPromptResponse } from '../models/cd-ai.model';
import { CdOpenAiService } from './cd-open-ai.service';
import { CdGeminiService } from './cd-gemini.service';
import { CdDeepSeekService } from './cd-deepseek.service';

export class CdAiService {
  static async sendPrompt(
    request: CdAiPromptRequest,
  ): Promise<CdAiPromptResponse> {
    switch (request.provider) {
      case 'openai':
        return CdOpenAiService.sendPrompt(request);
      case 'gemini':
        return CdGeminiService.sendPrompt(request);
      case 'deepseek':
        return CdDeepSeekService.sendPrompt(request);
      default:
        return {
          success: false,
          message: `Unsupported provider: ${request.provider}`,
        };
    }
  }
}
