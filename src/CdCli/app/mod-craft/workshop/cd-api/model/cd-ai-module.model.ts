import { BaseService } from '@/CdCli/sys/base/base.service';
import { CdModuleDescriptor } from '@/CdCli/sys/dev-descriptor/models/cd-module-descriptor.model';
import { DevModeModel } from '@/CdCli/sys/dev-mode/models/dev-mode.model';

export class CdAiModel {
  getModuleModel(): CdModuleDescriptor {
    const b = new BaseService();
    return {
      ctx: 'app', // Provide appropriate context if needed
      name: 'cd-ai',
      cdModuleType: 'cd-api',
      description:
        'module for processing ai auto development of corpdesk module at the backend',
      controllers: [
        { name: 'cd-ai', actions: [] },
        { name: 'cd-ai-usage-logs', actions: [] },
      ],
      services: [
        { name: 'cd-ai', methods: [] },
        { name: 'cd-ai-usage-logs', methods: [] },
      ],
      models: [
        { name: 'cd-ai', fields: [] },
        { name: 'cd-ai-usage-logs', fields: [] },
      ],
      projectGuid: b.getGuid(), // Generate or assign a GUID if required
      contributors: {
        vendor: {
          name: 'emp services ltd',
        },
        developers: [{ name: 'g.oremo', contact: 'george.oremo@gmail.com' }],
      },
    };
  }

  getDefaultModuleModel(): DevModeModel {
    return {
      method: 'json',
      process: 'create',
      workflow: this.getModuleModel(),
    };
  }
}
