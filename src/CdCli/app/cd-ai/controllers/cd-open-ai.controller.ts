// import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
// import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
// import { CdOpenAiService } from '../services/cd-open-ai.service';
// import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
// import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
// import config from '@/config';
// import { ChatMessage } from '../models/cd-open-ai.model';

// export class CdOpenAiController {
//   ctlSession = new SessonController();
//   svCdCliProfile = new CdCliProfileService();
//   svOpenAi = new CdOpenAiService();
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
//       CdLog.info('cdToken has been set for OpenAI controller');
//     } else {
//       CdLog.error('There is a problem setting cdToken');
//     }
//   }

//   async createModuleDescriptor(): Promise<void> {
//     const prompt = 'Create a module descriptor for an inventory system';
//     const response = await this.svOpenAi.generateFromPrompt(prompt);
//     CdLog.info(`Module Descriptor:\n${response}`);
//   }

//   async generateCodeFromDescriptor(): Promise<void> {
//     const prompt = 'Given the descriptor, generate a controller in TypeScript';
//     const response = await this.svOpenAi.generateFromPrompt(prompt);
//     CdLog.info(`Generated Code:\n${response}`);
//   }

//   async generateFromPrompt(prompt: string): Promise<string> {
//     const response = await this.svOpenAi.generateFromPrompt(prompt);
//     CdLog.info(`Generated Output:\n${response}`);
//     return response;
//   }

//   async debugCodeBlock(): Promise<void> {
//     const prompt = `This TypeScript code throws an error. Help debug:\n\nfunction foo() { const x: string = 42; }`;
//     const response = await this.svOpenAi.generateFromPrompt(prompt);
//     CdLog.info(`Debug Result:\n${response}`);
//   }

//   async chatInteraction(): Promise<void> {
//     const messages: ChatMessage[] = [
//       { role: 'user', content: 'How can I use OpenAI to generate code?' },
//     ];

//     const response = await this.svOpenAi.chat(messages);
//     CdLog.info(`Chat Response: ${JSON.stringify(response, null, 2)}`);
//   }
// }

import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import { CdAiService } from '../services/cd-ai.service';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import config from '@/config';
import { CdAiPromptRequest } from '../models/cd-ai.model';
import { ChatMessage } from '../models/cd-open-ai.model';

export class CdOpenAiController {
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
      CdLog.info('cdToken has been set for OpenAI controller');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  async createModuleDescriptor(): Promise<void> {
    const prompt = 'Create a module descriptor for an inventory system';
    const response = await this.sendOpenAiPrompt(prompt);
    CdLog.info(`Module Descriptor:\n${response}`);
  }

  async generateCodeFromDescriptor(): Promise<void> {
    const prompt = 'Given the descriptor, generate a controller in TypeScript';
    const response = await this.sendOpenAiPrompt(prompt);
    CdLog.info(`Generated Code:\n${response}`);
  }

  async generateFromPrompt(prompt: string): Promise<string> {
    const response = await this.sendOpenAiPrompt(prompt);
    CdLog.info(`Generated Output:\n${response}`);
    return response;
  }

  async debugCodeBlock(): Promise<void> {
    const prompt = `This TypeScript code throws an error. Help debug:\n\nfunction foo() { const x: string = 42; }`;
    const response = await this.sendOpenAiPrompt(prompt);
    CdLog.info(`Debug Result:\n${response}`);
  }

  async chatInteraction(): Promise<void> {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'How can I use OpenAI to generate code?' },
    ];

    const filteredMessages = messages
      .filter((msg) => msg.role !== 'model')
      .map((msg) => ({
        ...msg,
        role: msg.role === 'model' ? 'assistant' : msg.role,
      }));

    const response = await CdAiService.sendPrompt({
      provider: 'openai',
      type: 'chat',
      messages: filteredMessages,
    });

    if (response.success) {
      CdLog.info(`Chat Response:\n${response.data}`);
    } else {
      CdLog.error(`Chat failed: ${response.message}`);
    }
  }

  private async sendOpenAiPrompt(prompt: string): Promise<string> {
    const request: CdAiPromptRequest = {
      provider: 'openai',
      type: 'chat',
      prompt,
    };

    const result = await CdAiService.sendPrompt(request);

    if (!result.success) {
      CdLog.error(`Prompt failed: ${result.message}`);
      return '❌ Error processing prompt.';
    }

    return result.data ?? '⚠️ No response data.';
  }
}
