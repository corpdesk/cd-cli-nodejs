/* eslint-disable style/brace-style */
import { CD_FX_FAIL, type ICdResponse, type ISessResp } from '../../base/IBase';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG_FILE_PATH } from '../../../../config';
import CdCliVaultController from '../../cd-cli/controllers/cd-cli-vault.controller';
import CdLog from '../../cd-comm/controllers/cd-logger.controller';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';

export class SessonController {
  init(debugLevel: number): void {
    CdLog.setDebugLevel(debugLevel);
  }

  /**
   * Save session details to the configuration file.
   * Updates the session data in the `cd-cli.profiles.json` file under the appropriate profile.
   */
  async saveSession(session: ISessResp, profileName: string): Promise<boolean> {
    try {
      // Load existing configuration
      const ctlCdCliProfile = new CdCliProfileController();
      const resultCliConfig = await ctlCdCliProfile.loadProfiles();

      if (!resultCliConfig.state || !resultCliConfig.data) {
        return false;
      }

      const cdCliConfig = resultCliConfig.data;
      const profile = cdCliConfig.items.find(
        (item) => item.cdCliProfileName === profileName,
      );

      if (!profile || !profile.cdCliProfileData) {
        throw new Error(`Profile "${profileName}" not found.`);
      }

      // Save session to profile details
      profile.cdCliProfileData.details.session = session;

      // Write updated configuration back to the file
      writeFileSync(CONFIG_FILE_PATH, JSON.stringify(cdCliConfig, null, 2));
      CdLog.success(`Session saved successfully to profile "${profileName}".`);
      return true;
    } catch (error) {
      CdLog.error(`Error saving session: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Retrieve the current session.
   */
  async getSession(profileName: string): Promise<ISessResp | null> {
    try {
      CdLog.debug('SessionController::getSession()/profileName:', {
        name: profileName,
      });
      // Load configuration
      const ctlCdCliProfile = new CdCliProfileController();
      const resultCliConfig = await ctlCdCliProfile.loadProfiles();
      CdLog.debug(
        'SessionController::getSession()/resultCliConfig:',
        resultCliConfig,
      );

      if (!resultCliConfig.state || !resultCliConfig.data) {
        return null;
      }

      const cdCliConfig = resultCliConfig.data;
      const profile = cdCliConfig.items.find(
        (item) => item.cdCliProfileName === profileName,
      );

      CdLog.debug('SessionController::getSession()/profile:', profile);

      if (!profile || !profile.cdCliProfileData) {
        throw new Error(`Session not found for profile "${profileName}".`);
      }

      CdLog.debug('SessionController::getSession()/profile:', profile);

      const session: ISessResp = profile.cdCliProfileData.details.session;
      CdLog.debug('SessionController::getSession()/session1:', session);

      // Resolve session token from `cdVault` if referenced
      if (session.cd_token?.startsWith('#cdVault[')) {
        const tokenKey = session.cd_token.match(/#cdVault\['(.+?)'\]/)?.[1];
        if (tokenKey) {
          const tokenVault = profile.cdCliProfileData.cdVault.find(
            (vault) => vault.name === tokenKey,
          );
          if (tokenVault && tokenVault.encryptedValue) {
            session.cd_token = tokenVault.value || tokenVault.encryptedValue;
          }
        }
      }

      CdLog.debug('SessionController::getSession()/session2:', session);
      return session;
    } catch (error) {
      CdLog.error(`Error retrieving session: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Check if the session is valid.
   */
  async isSessionValid(profileName: string): Promise<boolean | number> {
    try {
      // Retrieve the session
      const session: ISessResp | null = await this.getSession(profileName);

      if (!session) {
        CdLog.warning(`No session found for profile "${profileName}".`);
        return false;
      }

      if (!session.initTime || !session.ttl) {
        CdLog.warning(
          `Session for profile "${profileName}" is missing required fields.`,
        );
        return false;
      }

      // Calculate expiry time based on initTime and ttl
      const initTimeInSeconds = Math.floor(
        new Date(session.initTime).getTime() / 1000,
      );
      const expiry = initTimeInSeconds + session.ttl;

      // Get the current time in seconds
      const now = Math.floor(Date.now() / 1000);

      // Return true if the session is valid; false otherwise
      const isValid = now < expiry;

      if (isValid) {
        CdLog.info(`Session for profile "${profileName}" is valid.`);
        return expiry - now; // Return time remaining in seconds
      } else {
        CdLog.warning(`Session for profile "${profileName}" has expired.`);
        return false;
      }
    } catch (error) {
      CdLog.error(
        `Error checking session validity: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
