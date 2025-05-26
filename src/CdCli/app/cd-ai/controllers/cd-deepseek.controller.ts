// import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
// import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
// import { CdDeepSeekService } from '../services/cd-deepseek.service';
// import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
// import config from '@/config';
// import { DeepSeekChatMessage } from '../models/cd-deepseek.model';
// import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';

// export class CdDeepSeekController {
//   ctlSession = new SessonController();
//   svCdCliProfile = new CdCliProfileService();
//   svDeepSeek = new CdDeepSeekService();
//   cdToken = '';

//   constructor() {
//     this.init();
//   }

//   async init(): Promise<void> {
//     const ctlCdCliProfile = new CdCliProfileController();
//     const profileRet = await ctlCdCliProfile.loadProfiles();
//     if (!profileRet.state) {
//       CdLog.error(`Failed to load profiles: ${profileRet.message}`);
//       return;
//     }

//     const sess = await this.ctlSession.getSession(config.cdApiLocal);
//     if (sess && sess.cd_token) {
//       this.cdToken = sess.cd_token;
//       CdLog.info('cdToken has been set for DeepSeek controller');
//     } else {
//       CdLog.error('There is a problem setting cdToken');
//     }
//   }

//   async generateCode(prompt: string): Promise<string> {
//     const response = await this.svDeepSeek.generateCode(prompt);
//     CdLog.info(`Generated Code:\n${response}`);
//     return response;
//   }

//   async optimizeCode(code: string): Promise<string> {
//     const prompt = `Optimize this TypeScript code:\n\n${code}`;
//     const response = await this.svDeepSeek.generateFromPrompt(prompt);
//     CdLog.info(`Optimized Code:\n${response}`);
//     return response;
//   }

//   async generateFromPrompt(prompt: string): Promise<string> {
//     const response = await this.svDeepSeek.generateFromPrompt(prompt);
//     CdLog.info(`Generated Output:\n${response}`);
//     return response;
//   }

//   async explainCode(code: string): Promise<string> {
//     const prompt = `Explain this code:\n\n${code}`;
//     const response = await this.svDeepSeek.generateFromPrompt(prompt);
//     CdLog.info(`Code Explanation:\n${response}`);
//     return response;
//   }

//   async chatInteraction(): Promise<void> {
//     const messages: DeepSeekChatMessage[] = [
//       { role: 'user', content: 'How can I use DeepSeek for code generation?' },
//     ];

//     const response = await this.svDeepSeek.chat(messages);
//     CdLog.info(`Chat Response: ${JSON.stringify(response, null, 2)}`);
//   }
// }

import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
import { CdAiService } from '../services/cd-ai.service';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import config from '@/config';
import { CdAiPromptRequest } from '../models/cd-ai.model';
import { DeepSeekChatMessage } from '../models/cd-deepseek.model';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';

export class CdDeepSeekController {
  ctlSession = new SessonController();
  svCdCliProfile = new CdCliProfileService();
  cdToken = '';

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.loadProfiles();
    if (!profileRet.state) {
      CdLog.error(`Failed to load profiles: ${profileRet.message}`);
      return;
    }

    const sess = await this.ctlSession.getSession(config.cdApiLocal);
    if (sess && sess.cd_token) {
      this.cdToken = sess.cd_token;
      CdLog.info('cdToken has been set for DeepSeek controller');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  async generateCode(prompt: string): Promise<string> {
    const request: CdAiPromptRequest = {
      provider: 'deepseek',
      type: 'code',
      prompt,
      model: 'deepseek-coder',
    };
    return this.sendDeepSeekPrompt(request);
  }

  async optimizeCode(code: string): Promise<string> {
    const prompt = `Optimize this TypeScript code:\n\n${code}`;
    const request: CdAiPromptRequest = {
      provider: 'deepseek',
      type: 'code',
      prompt,
      model: 'deepseek-coder',
    };
    return this.sendDeepSeekPrompt(request);
  }

  async explainCode(code: string): Promise<string> {
    const prompt = `Explain this code:\n\n${code}`;
    const request: CdAiPromptRequest = {
      provider: 'deepseek',
      type: 'chat',
      prompt,
      model: 'deepseek-chat',
    };
    return this.sendDeepSeekPrompt(request);
  }

  async chatInteraction(): Promise<void> {
    const messages: DeepSeekChatMessage[] = [
      { role: 'user', content: 'How can I use DeepSeek for code generation?' },
    ];

    const response = await CdAiService.sendPrompt({
      provider: 'deepseek',
      type: 'chat',
      messages,
    });

    if (response.success) {
      CdLog.info(`Chat Response:\n${response.data}`);
    } else {
      CdLog.error(`Chat failed: ${response.message}`);
    }
  }

  private async sendDeepSeekPrompt(
    request: CdAiPromptRequest,
  ): Promise<string> {
    const result = await CdAiService.sendPrompt(request);

    if (!result.success) {
      CdLog.error(`Prompt failed: ${result.message}`);
      return '❌ Error processing prompt.';
    }

    return result.data ?? '⚠️ No response data.';
  }
}
