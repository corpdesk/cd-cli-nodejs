/* eslint-disable style/brace-style */
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class ModCraftController {
  async initTemplate(moduleName: string, gitRepo: string) {
    try {
      if (!moduleName || !gitRepo) {
        throw new Error('Both --name and --url options are required.');
      }

      const templatesDir = path.resolve(
        __dirname,
        '../../../templates/api-module',
      );
      const targetDir = path.resolve(templatesDir, moduleName);

      // Check if the target directory already exists
      if (fs.existsSync(targetDir)) {
        throw new Error(`Module directory ${moduleName} already exists.`);
      }

      // Clone the repository
      console.log(`Cloning template from ${gitRepo}...`);
      await this.runCommand(`git clone ${gitRepo} ${targetDir}`);
      console.log(`Template cloned to ${targetDir}.`);

      // Update configuration files if necessary
      console.log(`Configuring the module...`);
      this.updateConfigFiles(targetDir, moduleName);

      console.log(`✨ Module ${moduleName} initialized successfully.`);
    } catch (error) {
      console.error(`Error initializing module: ${(error as Error).message}`);
    }
  }

  private async runCommand(command: string) {
    return new Promise<void>((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private updateConfigFiles(targetDir: string, moduleName: string) {
    // Example: Replace placeholders in the template with the module name
    const filesToUpdate = ['README.md', 'package.json'];
    for (const fileName of filesToUpdate) {
      const filePath = path.join(targetDir, fileName);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/\{\{moduleName\}\}/g, moduleName);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}
