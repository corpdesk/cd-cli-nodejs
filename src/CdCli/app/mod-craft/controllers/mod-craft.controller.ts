/* eslint-disable style/operator-linebreak */

/* eslint-disable style/brace-style */
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import { existsSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import util, { promisify } from 'node:util';
import { CONFIG_FILE_PATH } from '@/config';
import inquirer from 'inquirer';
import {
  SSH_TO_DEV_PROMPT_DATA,
  workshopConfig,
} from '../models/mod-craft.model';
import CdLog from '@/CdCli/sys/cd-comm/controllers/cd-logger.controller';
import {
  ProfileContainer,
  ProfileModel,
} from '@/CdCli/sys/cd-cli/models/cd-cli-profile.model';
import CdCliVaultController from '@/CdCli/sys/cd-cli/controllers/cd-cli-vault.controller';

const execPromise = promisify(exec);
// Construct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ModCraftController {
  /**
   * Method to clone repository of module template to cd-cli for referencw when developing given module at development server
   * Usage:
   * cd-cli template init --type=cd-api --url=https://github.com/corpdesk/abcd.git
   * @param templateType
   * @param gitRepo
   */
  async initTemplate(templateType: string, gitRepo: string) {
    try {
      if (!templateType || !gitRepo) {
        throw new Error('Both --type and --url options are required.');
      }

      // Resolve the project root dynamically
      const __filename = fileURLToPath(import.meta.url);
      const projectRoot = path.resolve(path.dirname(__filename), './..'); // Adjusts based on current directory depth

      // Use configuration parameter for templates directory
      // const templatesRelativePath = './src/templates';
      const templatesRelativePath = workshopConfig(
        null,
        null,
      ).moduleTemplatePath;
      const templatesDir = path.resolve(
        projectRoot,
        templatesRelativePath,
        templateType,
      );

      const moduleName = path.basename(gitRepo, '.git');
      const targetDir = path.resolve(templatesDir, moduleName);

      // Ensure the template directory exists
      if (!existsSync(templatesDir)) {
        mkdirSync(templatesDir, { recursive: true });
      }

      // Check if the target directory already exists
      if (existsSync(targetDir)) {
        throw new Error(`Module directory ${moduleName} already exists.`);
      }

      // Clone the repository
      CdLog.info(`Cloning template from ${gitRepo}...`, {
        module: 'moduleman',
        controller: 'ModCraftController',
        action: 'initTemplate',
      });
      await execPromise(`git clone ${gitRepo} ${targetDir}`);
      CdLog.info(`Template cloned to ${targetDir}.`);

      // Update configuration files if necessary
      console.log(`Configuring the module...`);
      this.updateConfigFiles(targetDir, moduleName);

      CdLog.success(`✨ Module ${moduleName} initialized successfully.`);
    } catch (error) {
      CdLog.error(`Error initializing module: ${(error as Error).message}`);
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
      const filePath = join(targetDir, fileName);
      if (existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/\{\{moduleName\}\}/g, moduleName);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }

  /**
   * Method to connect to a development server via SSH and clone a module repository into a cd-api project.
   * This would be a module that was developed by a 3rd party or by the user.
   * After cloning, it will set up the module structure and configure it for further development or use in the CorpDesk environment.
   *
   * Profile Selection: The user can pass the --profile flag (e.g., --profile=devServer-ssh-profile) in the command to use the specified profile. If the profile exists, the details are extracted and used for the SSH connection. If no profile is provided, the user is prompted to enter the SSH details manually.
   * Profile Data Extraction: If a profile is provided, the method will read the profiles.json file, extract the profile data (e.g., sshKey, remoteUser, devServer, cdApiDir), and use it to connect to the development server.
   * Command Construction: The command is constructed dynamically based on the provided or selected profile data. The ssh -i flag is used if an SSH key is provided; otherwise, it defaults to using ssh without a key.
   *
   * Usaging Profile:
   * cd-cli module init --type=cd-api --repo=https://github.com/corpdesk/cd-geo --profile=devServer-ssh-profile
   * This command will use the SSH settings from the devServer-ssh-profile profile to connect to the development server and clone the repository.
   *
   * Without profile:
   * cd-cli module init --type=cd-api --repo=https://github.com/corpdesk/cd-geo --dev-srv=192.168.1.70
   * If no profile is specified, the user will be prompted to enter the SSH connection details (server, user, key, etc.).
   *
   */
  // import { checkProfileAndLogin } from '../../utils/profileHelper'; // Assuming the helper is in utils

  async initModuleFromRepo(gitRepo: string, profileName?: string) {
    CdLog.debug(`initModuleFromRepo()/gitRepo:${gitRepo}`);
    CdLog.debug(`initModuleFromRepo()/profileName:${profileName}`);
    CdLog.debug(`initModuleFromRepo()/CONFIG_FILE_PATH:${CONFIG_FILE_PATH}`);

    try {
      // Step 1: Load configurations from ~/.cd-cli.profiles.json
      if (!existsSync(CONFIG_FILE_PATH)) {
        throw new Error(
          'Configuration file not found. Please set up your CLI.',
        );
      }

      const config: ProfileContainer = JSON.parse(
        fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'),
      );
      const profiles: ProfileModel[] = config.items;

      if (!profiles || config.count === 0) {
        throw new Error('No profiles found. Please create a profile first.');
      }

      // Step 2: Locate the specified profile or use prompts
      let profileDetails: any = null;

      if (profileName) {
        const profile = config.items.find(
          (p: any) => p.cdCliProfileName === profileName,
        );
        if (!profile) {
          throw new Error(`Profile '${profileName}' not found.`);
        }
        profileDetails = profile.cdCliProfileData?.details;
        CdLog.debug('profileDetails:', profileDetails);

        // Decrypt sensitive data using CdCliVaultController
        if (profileDetails?.['cd-vault']) {
          profileDetails.sshKey = CdCliVaultController.getSensitiveData(
            profileDetails['cd-vault'],
          );
        }
        CdLog.info(`Using profile: ${profileName}`);
      }

      CdLog.debug(`profileDetails: ${JSON.stringify(profileDetails)}`);
      // If no profile or details found, prompt the user
      if (!profileDetails) {
        const answers = await inquirer.prompt(SSH_TO_DEV_PROMPT_DATA);

        profileDetails = {
          devServer: answers.devServer,
          remoteUser: answers.remoteUser,
          sshKey: answers.sshKey,
          cdApiDir: answers.cdApiDir,
        };
      }

      // Step 3: Construct SSH command
      const { remoteUser, sshKey, devServer, cdApiDir } = profileDetails;
      CdLog.debug(`remoteUser: ${remoteUser}, devServer: ${devServer}`);

      const command = sshKey
        ? `ssh -i "${sshKey}" "${remoteUser}@${devServer}" "sudo -H -u ${remoteUser} bash -c 'git clone ${gitRepo} ${cdApiDir}/src/CdApi/app/cd-geo'"`
        : `ssh "${remoteUser}@${devServer}" "sudo -H -u ${remoteUser} bash -c 'git clone ${gitRepo} ${cdApiDir}/src/CdApi/app/cd-geo'"`;

      // Step 4: Execute SSH command and log output
      CdLog.info(
        `Executing SSH command to clone repository from ${gitRepo} on server ${devServer}...`,
      );

      const process = exec(command);

      process.stdout?.on('data', (data) => {
        if (
          data.includes('Cloning into') ||
          data.includes('Receiving objects')
        ) {
          console.log(`stdout: ${data}`);
        } else {
          console.error(`stderr: ${data}`);
        }
      });

      process.stderr?.on('data', (data) => {
        if (
          data.includes('Cloning into') ||
          data.includes('Receiving objects')
        ) {
          console.log(`stdout: ${data}`);
        } else {
          console.error(`stderr: ${data}`);
        }
      });

      process.on('close', (code) => {
        if (code === 0) {
          CdLog.success(
            `Module successfully cloned into ${cdApiDir}/src/CdApi/app.`,
          );
        } else {
          CdLog.error(`Git clone process exited with code ${code}.`);
        }
      });
    } catch (error) {
      CdLog.error(
        `Error initializing module from repository: ${(error as Error).message}`,
      );
    }
  }
}
