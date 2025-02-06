/* eslint-disable style/brace-style */

import type { ISessResp } from './CdCli/sys/base/IBase';
import { existsSync } from 'node:fs';
/* eslint-disable node/prefer-global/process */
import path, { join } from 'node:path';
import CdLogg from './CdCli/sys/cd-comm/controllers/cd-logger.controller';

export const CONFIG_FILE_PATH = join(
  process.env.HOME || '~/',
  '.cd-cli/cd-cli.config.json',
);

export const DEFAULT_SESS: ISessResp = {
  jwt: null,
  ttl: 300,
};

export default {
  cdApiLocal: 'cd-api-local',
  cdSession: DEFAULT_SESS,
  meta: {
    name: 'cd-cli',
    version: '1.0.0',
    description: 'Your description here',
    showHelpAfterError: true,
  },
  preferences: {
    encryption: {
      encryptionKey: process.env.CD_CLI_ENCRYPT_KEY,
    },
    backUp: [
      {
        profileName: 'cd-git-config',
        field: 'details.gitAccess.gitHubToken',
        useLocal: { state: false, storePath: '~/.cd-cli/' },
        useWeb3: { state: false }, // yet to be defined
        useCloud: { state: false }, // yet to be defined
      },
    ],
  },
};

/**
 * Load the configuration file from the VAULT_DIRECTORY.
 */
export function loadCdCliConfig(): any {
  CdLogg.debug('starting loadCdCliConfig()');
  try {
    if (!existsSync(CONFIG_FILE_PATH)) {
      throw new Error(`Configuration file not found at ${CONFIG_FILE_PATH}.`);
    }

    const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Error loading configuration: ${(error as Error).message}`);
  }
}
