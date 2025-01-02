/* eslint-disable style/brace-style */
import type { ISessResp } from '../../base/IBase';
/* eslint-disable unused-imports/no-unused-vars */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import inquirer from 'inquirer';
import config from '../../../../config';
import Logger from '../../cd-comm/controllers/notifier.controller'; // Assume a logger utility is available
import { UserController } from '../../user/controllers/user.controller';
import { CdCliProfileService } from '../services/cd-cli-profile.service';

const execPromise = promisify(exec);

export class CdCliProfileController {
  svUser = new UserController();
  sess: ISessResp = config.cdSession;
  constructor() {}

  // Method to prompt user and create SSH profile
  // Usage: cd-cli profile create-ssh
  async createSshProfile() {
    try {
      if (!this.svUser.getSession()) {
        Logger.warning('config.cdSession:', config.cdSession);
        Logger.error(`You have to login to create a profile`);
        return;
      }
      // Step 1: Prompt user for profile details
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'profileName',
          message: 'Enter profile name (e.g., devServer-ssh-profile):',
          default: 'devServer-ssh-profile',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Enter profile description:',
          default: 'SSH profile for development server connection',
        },
        {
          type: 'input',
          name: 'remoteServer',
          message:
            'Enter development server address (e.g., server.example.com):',
          default: '192.168.1.70',
        },
        {
          type: 'input',
          name: 'remoteUser',
          message: 'Enter remote SSH user (default: devops):',
          default: 'devops',
        },
        {
          type: 'input',
          name: 'sshKey',
          message: 'Enter path to your SSH key:',
          default: '~/path/to/sshKey',
        },
        {
          type: 'input',
          name: 'cdApiDir',
          message: 'Enter directory on the server (e.g., ~/cd-api):',
          default: '~/cd-api',
        },
      ]);

      // Step 2: Prepare the profile data
      const profileData = {
        owner: {
          userId: 1010, // Example user ID, this could be dynamic based on the logged-in user
          groupId: 0, // Group ID, like "_public"
        },
        permissions: {
          userPermissions: [
            {
              userId: 1000, // Permissions for a user
              field: 'sshKey',
              hidden: false,
              read: true,
              write: true,
              execute: false,
            },
          ],
          groupPermissions: [
            {
              groupId: 0, // Public group
              field: 'sshKey',
              hidden: false,
              read: true,
              write: false,
              execute: false,
            },
          ],
        },
        details: {
          sshKey: answers.sshKey,
          remoteUser: answers.remoteUser,
          devServer: answers.remoteServer,
          cdApiDir: answers.cdApiDir,
        },
      };

      // Step 3: Prepare the payload to send to cd-api
      const cdEnvelope = {
        ctx: 'Sys',
        m: 'Moduleman',
        c: 'CdCliProfile',
        a: 'Create',
        dat: {
          f_vals: [
            {
              data: {
                cdCliProfileName: answers.profileName,
                cdCliProfileDescription: answers.description,
                cdCliProfileData: profileData,
                cdCliProfileEnabled: true,
                cdCliProfileTypeId: 2, // Represent SSH profile type
                userId: 1010,
              },
            },
          ],
          //   token: '6E831EAF-244D-2E5A-0A9E-27C1FDF7821D',
          token: config.cdSession.cd_token,
        },
        args: null,
      };

      // Step 4: Send the profile data to cd-api
      const profileService = new CdCliProfileService();
      if (this.sess.cd_token) {
        await profileService.createCdCliProfile(cdEnvelope, this.sess.cd_token);
        Logger.success(
          `Profile '${answers.profileName}' created successfully.`,
        );
      } else {
        Logger.error(
          `Invalid Session. Profile '${answers.profileName}' could not be created.`,
        );
      }
    } catch (error) {
      Logger.error(`Error creating SSH profile: ${(error as Error).message}`);
    }
  }
}
