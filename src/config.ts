/* eslint-disable style/brace-style */

/* eslint-disable node/prefer-global/process */
// /* eslint-disable ts/consistent-type-imports */
import type { ISessResp } from './CdCli/sys/base/IBase';
import { PROFILE_CMD } from './CdCli/sys/cd-cli/models/cd-cli-profile.model';
import {
  MODULE_CMD,
  TEMPLATE_CMD,
} from './CdCli/sys/moduleman/models/mod-craft.model';
import { LOGIN_CMD, LOGOUT_CMD } from './CdCli/sys/user/models/user.model';

// export const VAULT_DIRECTORY = path.join(process.env.HOME || '~/', '.cd-cli');
export const CONFIG_FILE_PATH = path.join(
  process.env.HOME || '~/',
  '.cd-cli/cd-cli.config.json',
);

export const DEFAULT_SESS: ISessResp = {
  jwt: null,
  ttl: 300,
};

export default {
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
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      throw new Error(`Configuration file not found at ${CONFIG_FILE_PATH}.`);
    }

    const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Error loading configuration: ${(error as Error).message}`);
  }
}
