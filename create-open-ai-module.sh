#!/bin/bash

# Set base directory
BASE_DIR="src/CdCli/app/cd-ai"

# Create directory structure
mkdir -p $BASE_DIR/{controllers,services,models,helpers}

# Create index.ts
cat <<EOF > $BASE_DIR/index.ts
export * from './controllers/open-ai.controller';
export * from './services/open-ai.service';
export * from './models/open-ai.model';
export * from './helpers/open-ai.helper';
EOF

# Create controllers/open-ai.controller.ts
cat <<EOF > $BASE_DIR/controllers/open-ai.controller.ts
export class OpenAiController {
  async createModuleDescriptor(): Promise<void> {
    // Placeholder: Use OpenAI to generate a module descriptor
  }

  async generateCodeFromDescriptor(): Promise<void> {
    // Placeholder: Use descriptor to generate code
  }

  async debugCodeBlock(): Promise<void> {
    // Placeholder: Debug a given block of code
  }

  async chatInteraction(): Promise<void> {
    // Placeholder: Perform a generic OpenAI chat interaction
  }
}
EOF

# Create services/open-ai.service.ts
cat <<EOF > $BASE_DIR/services/open-ai.service.ts
export class OpenAiService {
  async generateFromPrompt(prompt: string): Promise<string> {
    // Placeholder: Send prompt to OpenAI and return response
    return '';
  }

  async chat(messages: any[]): Promise<any> {
    // Placeholder: Simulate chat with OpenAI
    return {};
  }

  async getModelList(): Promise<string[]> {
    // Placeholder: List supported OpenAI models
    return [];
  }
}
EOF

# Create models/open-ai.model.ts
cat <<EOF > $BASE_DIR/models/open-ai.model.ts
export interface ProfileDetails {
  apiKey: string;
  orgId?: string;
  baseUrl?: string;
}
EOF

# Create models/open-ai-request.model.ts
cat <<EOF > $BASE_DIR/models/open-ai-request.model.ts
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
}
EOF

# Create helpers/open-ai.helper.ts
cat <<EOF > $BASE_DIR/helpers/open-ai.helper.ts
export function buildSystemPromptContext(moduleName: string, purpose: string): string {
  return \`You're an AI developer. Generate a descriptor for the module "\${moduleName}" with purpose: "\${purpose}"\`;
}
EOF

echo "✅ cd-ai module structure created in $BASE_DIR"
