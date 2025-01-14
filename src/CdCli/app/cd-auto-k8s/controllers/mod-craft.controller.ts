/* eslint-disable style/operator-linebreak */
import type { ProfileModel } from '../../cd-cli/models/cd-cli-profile.model';

/* eslint-disable style/brace-style */
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
import inquirer from 'inquirer';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import { PROFILE_FILE_STORE } from '../../cd-cli/models/cd-cli-profile.model';
import {
  DEFAULT_PROMPT_DATA,
  InitModuleFromRepoPromptData,
} from '../models/mod-craft.model';

const execPromise = promisify(exec);
// Construct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ModCraftController {
  /**
   * Method to clone repository of module template to cd-cli for referencw when developing given module at development server
   * Usage:
   * cd-cli template init --type=module-api --url=https://github.com/corpdesk/abcd.git
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
      const templatesRelativePath = './src/templates';
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
      CdLogg.info(`Cloning template from ${gitRepo}...`, {
        module: 'moduleman',
        controller: 'ModCraftController',
        action: 'initTemplate',
      });
      await execPromise(`git clone ${gitRepo} ${targetDir}`);
      CdLogg.info(`Template cloned to ${targetDir}.`);

      // Update configuration files if necessary
      console.log(`Configuring the module...`);
      this.updateConfigFiles(targetDir, moduleName);

      CdLogg.success(`✨ Module ${moduleName} initialized successfully.`);
    } catch (error) {
      CdLogg.error(`Error initializing module: ${(error as Error).message}`);
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
   * Method to connect to a development server via SSH and clone a module repository.
   *
   * Profile Selection: The user can pass the --profile flag (e.g., --profile=devServer-ssh-profile) in the command to use the specified profile. If the profile exists, the details are extracted and used for the SSH connection. If no profile is provided, the user is prompted to enter the SSH details manually.
   * Profile Data Extraction: If a profile is provided, the method will read the profiles.json file, extract the profile data (e.g., sshKey, remoteUser, devServer, cdApiDir), and use it to connect to the development server.
   * Command Construction: The command is constructed dynamically based on the provided or selected profile data. The ssh -i flag is used if an SSH key is provided; otherwise, it defaults to using ssh without a key.
   *
   * Usaging Profile:
   * cd-cli module init --type=module-api --repo=https://github.com/corpdesk/cd-geo --profile=devServer-ssh-profile
   * This command will use the SSH settings from the devServer-ssh-profile profile to connect to the development server and clone the repository.
   *
   * Without profile:
   * cd-cli module init --type=module-api --repo=https://github.com/corpdesk/cd-geo --dev-srv=192.168.1.70
   * If no profile is specified, the user will be prompted to enter the SSH connection details (server, user, key, etc.).
   *
   */
  // import { checkProfileAndLogin } from '../../utils/profileHelper'; // Assuming the helper is in utils

  async initModuleFromRepo(gitRepo: string, profileName?: string) {
    try {
      // Ensure profile.json exists or trigger login process
      const svCdCliProfile = new CdCliProfileController();
      await svCdCliProfile.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

      // If a profile name is provided, fetch the profile details
      let profileData: ProfileModel = DEFAULT_PROMPT_DATA;
      let profileDetails: any = null;

      if (profileName) {
        const profiles = JSON.parse(
          fs.readFileSync(PROFILE_FILE_STORE, 'utf-8'),
        ).items;
        profileData = profiles.find(
          (profile: any) => profile.cdCliProfileName === profileName,
        );
        profileDetails = profileData.cdCliProfileData?.details;

        if (!profileDetails) {
          throw new Error(`Profile '${profileName}' not found.`);
        }
        CdLogg.info(`Using profile name: ${profileName}`);
      }

      // If no profile data found, prompt for connection details
      if (!profileDetails) {
        const answers = await inquirer.prompt(InitModuleFromRepoPromptData);

        profileDetails = {
          details: {
            sshKey: answers.sshKey,
            remoteUser: answers.remoteUser,
            devServer: answers.remoteServer,
            cdApiDir: answers.cdApiDir,
          },
        };
      }

      const { remoteUser, sshKey, devServer, cdApiDir } =
        profileData.cdCliProfileData?.details || {};

      // Construct the SSH command to clone the repository
      let command: string;

      if (sshKey) {
        command = `ssh -i "${sshKey}" "${remoteUser}@${devServer}" "sudo -H -u ${remoteUser} bash -c 'git clone ${gitRepo} ${cdApiDir}/src/CdApi/app/cd-geo'"`;
      } else {
        command = `ssh "${remoteUser}@${devServer}" "sudo -H -u ${remoteUser} bash -c 'git clone ${gitRepo} ${cdApiDir}/src/CdApi/app/cd-geo'"`;
      }

      // Execute the SSH command and display real-time output
      CdLogg.info(
        `Executing SSH command to clone repository from ${gitRepo} on server ${devServer}...`,
      );

      const process = exec(command);

      // Pipe stdout and stderr to the console to display real-time output
      process.stdout?.on('data', (data) => {
        // Check if data is from git's normal output or error output
        if (
          data.includes('Cloning into') ||
          data.includes('Receiving objects')
        ) {
          // Consider this as regular output
          console.log(`stdout: ${data}`);
        } else {
          // Otherwise, log it as stderr
          console.error(`stderr: ${data}`);
        }
      });

      process.stderr?.on('data', (data) => {
        // This could also be considered normal output, but if it's a known Git message, treat it as stdout
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
          CdLogg.success(
            `Module successfully cloned into ${cdApiDir}/src/CdApi/app.`,
          );
        } else {
          CdLogg.error(`Git clone process exited with code ${code}.`);
        }
      });
    } catch (error) {
      CdLogg.error(
        `Error initializing module from repository: ${(error as Error).message}`,
      );
    }
  }
}
