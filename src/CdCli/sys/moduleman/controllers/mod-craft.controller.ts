/* eslint-disable style/brace-style */
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
import Logger from '../../cd-comm/controllers/notifier.controller';

const execPromise = util.promisify(exec);
// Construct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ModCraftController {
  async initTemplate(templateType: string, gitRepo: string) {
    try {
      if (!templateType || !gitRepo) {
        throw new Error('Both --type and --url options are required.');
      }

      // Resolve the project root dynamically
      const __filename = fileURLToPath(import.meta.url);
      const projectRoot = path.resolve(path.dirname(__filename), './..'); // Adjusts based on current directory depth

      // Use configuration parameter for templates directory
      const templatesRelativePath = './src/templates';
      const templatesDir = path.resolve(
        projectRoot,
        templatesRelativePath,
        templateType,
      );

      const moduleName = path.basename(gitRepo, '.git');
      const targetDir = path.resolve(templatesDir, moduleName);

      // Ensure the template directory exists
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      // Check if the target directory already exists
      if (fs.existsSync(targetDir)) {
        throw new Error(`Module directory ${moduleName} already exists.`);
      }

      // Clone the repository
      Logger.info(`Cloning template from ${gitRepo}...`, {
        module: 'moduleman',
        controller: 'ModCraftController',
        action: 'initTemplate',
      });
      await execPromise(`git clone ${gitRepo} ${targetDir}`);
      Logger.info(`Template cloned to ${targetDir}.`);

      // Update configuration files if necessary
      console.log(`Configuring the module...`);
      this.updateConfigFiles(targetDir, moduleName);

      Logger.success(`✨ Module ${moduleName} initialized successfully.`);
    } catch (error) {
      Logger.error(`Error initializing module: ${(error as Error).message}`);
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
    // Placeholder for configuration file updates
    console.log(
      `Updating configuration files in ${targetDir} for module ${moduleName}.`,
    );
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
