import { CdCliProfileService } from '@/CdCli/sys/cd-cli/services/cd-cli-profile.service';
import { SessonController } from '@/CdCli/sys/user/controllers/session.controller';
import { CdCliProfileController } from '@/CdCli/sys/cd-cli/controllers/cd-cli-profile.cointroller';
import { CdAiService } from '../services/cd-ai.service';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import config from '@/config';
import { CdAiPromptRequest } from '../models/cd-ai.model';
import { GeminiChatMessage } from '../models/cd-gemini.model';

export class CdGeminiController {
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
      CdLog.info('cdToken has been set for Gemini controller');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  async createModuleDescriptor(): Promise<void> {
    const prompt =
      'Create a module descriptor for a warehouse management system';
    const response = await this.sendGeminiPrompt(prompt);
    CdLog.info(`Module Descriptor:\n${response}`);
  }

  async generateCodeFromDescriptor(): Promise<void> {
    const prompt = 'Given the descriptor, generate a service in Python';
    const response = await this.sendGeminiPrompt(prompt);
    CdLog.info(`Generated Code:\n${response}`);
  }

  async generateFromPrompt(prompt: string): Promise<string> {
    const response = await this.sendGeminiPrompt(prompt);
    CdLog.info(`Generated Output:\n${response}`);
    return response;
  }

  async debugCodeBlock(): Promise<void> {
    const prompt = `This JavaScript code has a bug. Help debug:\n\nconst arr = [1, 2, 3]; for (var i = 0; i <= arr.length; i++) { console.log(arr[i]); }`;
    const response = await this.sendGeminiPrompt(prompt);
    CdLog.info(`Debug Result:\n${response}`);
  }

  async chatInteraction(): Promise<void> {
    const messages: GeminiChatMessage[] = [
      {
        role: 'user',
        parts: [
          { text: 'What are the key differences between NodeJS and Deno?' },
        ],
      },
    ];

    const cdAiMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        msg.parts && msg.parts.length > 0 && msg.parts[0].text
          ? msg.parts[0].text
          : '',
    }));

    const response = await CdAiService.sendPrompt({
      provider: 'gemini',
      type: 'chat',
      messages: cdAiMessages,
    });

    if (response.success) {
      CdLog.info(`Chat Response:\n${response.data}`);
    } else {
      CdLog.error(`Chat failed: ${response.message}`);
    }
  }

  private async sendGeminiPrompt(prompt: string): Promise<string> {
    const request: CdAiPromptRequest = {
      provider: 'gemini',
      type: 'chat', // Assuming 'chat' is the primary interaction type for Gemini's text generation
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
