/* eslint-disable style/brace-style */
import { fileURLToPath } from 'node:url';
import { CdCliProfileController } from '../controllers/cd-cli-profile.cointroller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profilesFilePath = path.join(__dirname, 'profile.json');
export const PROFILE_FILE_STORE = profilesFilePath;

// The ProfileContainer represents the entire profile data structure
export interface ProfileContainer {
  items: ProfileModel[];
  count: number;
}

// ProfileModel contains metadata about each profile, including its ID, GUID, name, and profile data
export interface ProfileModel {
  cdCliProfileId?: number;
  cdCliProfileGuid?: string;
  cdCliProfileName: string;
  cdCliProfileData: ProfileData | null; // Nested data for the profile
  cdCliProfileEnabled?: number; // 1 means enabled, 0 means disabled
  cdCliProfileTypeId: number; // Type ID (2 is for SSH profiles)
  cdCliProfileTypeGuid?: string;
  userId: number;
}

// ProfileData holds the actual profile configuration, including user and permissions
export interface ProfileData {
  owner: ProfileOwner; // Profile owner details (userId, groupId)
  details: any; // Can be any. For example SSH connection details
  permissions: ProfilePermissions; // Permissions associated with this profile
}

// ProfileOwner defines the user and group associated with the profile
export interface ProfileOwner {
  userId: number;
  groupId: number;
}

// ProfileDetails contains the SSH connection details such as the server address, user, key path, etc.
export interface SshDetails {
  sshKey: string; // Path to SSH key
  cdApiDir: string; // Path to the API directory on the server
  devServer: string; // Development server address
  remoteUser: string; // SSH user
}

// ProfilePermissions defines the user and group permissions related to the profile
export interface ProfilePermissions {
  userPermissions: UserPermission[];
  groupPermissions: GroupPermission[];
}

// UserPermission defines permission settings for individual users
export interface UserPermission {
  read: boolean;
  write: boolean;
  hidden: boolean;
  execute: boolean;
  userId: number;
  field: string;
}

// GroupPermission defines permission settings for groups
export interface GroupPermission {
  read: boolean;
  write: boolean;
  hidden: boolean;
  execute: boolean;
  groupId: number;
  field: string;
}

/* eslint-disable unused-imports/no-unused-vars */
export const sshProfileTemplate = {
  owner: {
    userId: 1010, // The user who owns the profile
    groupId: 0, // Group that owns the profile (e.g., "_public")
  },
  permissions: {
    userPermissions: [
      {
        userId: 1000,
        field: 'sshKey',
        hidden: false,
        read: true,
        write: true,
        execute: false,
      },
    ],
    groupPermissions: [
      {
        groupId: 0,
        field: 'sshKey',
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
  },
  details: {
    sshKey: 'path/to/sshKey',
    remoteUser: 'devops',
    remoteServer: 'server.example.com',
    cdApiDir: '~/cd-api',
  },
};

// const sshProfileTemplate = {
//   owner: {
//     userId: 1010, // Example user ID, could be dynamic based on the logged-in user
//     groupId: 0, // Group ID, like "_public"
//   },
//   permissions: {
//     userPermissions: [
//       {
//         userId: 1000, // Permissions for a user
//         field: 'sshKey',
//         hidden: false,
//         read: true,
//         write: true,
//         execute: false,
//       },
//     ],
//     groupPermissions: [
//       {
//         groupId: 0, // Public group
//         field: 'sshKey',
//         hidden: false,
//         read: true,
//         write: false,
//         execute: false,
//       },
//     ],
//   },
//   details: {
//     sshKey: answers.sshKey,
//     remoteUser: answers.remoteUser,
//     devServer: answers.remoteServer,
//     cdApiDir: answers.cdApiDir,
//   },
// };

// Default profile prompt data template
export function createProfilePromptData(profileType: string): any {
  const basePromptData = [
    {
      type: 'input',
      name: 'profileName',
      message: 'Enter profile name:',
      default: 'default-profile',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Enter profile description:',
      default: 'Profile for the development server',
    },
  ];

  if (profileType === 'ssh') {
    return [
      ...basePromptData,
      {
        type: 'input',
        name: 'remoteServer',
        message: 'Enter development server address:',
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
    ];
  } else if (profileType === 'api') {
    return [
      ...basePromptData,
      {
        type: 'input',
        name: 'apiEndpoint',
        message: 'Enter API endpoint:',
        default: 'https://api.example.com',
      },
    ];
  }

  // Return base prompts if profile type is unknown
  return basePromptData;
}

// Example of a profile template (could be in a separate file)
export const profileTemplate = {
  type: 'ssh', // Could be 'api', 'database', etc.
  typeId: 2, // For SSH profile type
  owner: {
    userId: 1010,
    groupId: 0,
  },
  permissions: {
    userPermissions: [
      {
        userId: 1000,
        field: 'sshKey',
        hidden: false,
        read: true,
        write: true,
        execute: false,
      },
    ],
    groupPermissions: [
      {
        groupId: 0,
        field: 'sshKey',
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
  },
  details: {
    sshKey: 'path/to/sshKey',
    remoteUser: 'devops',
    remoteServer: 'server.example.com',
    cdApiDir: '~/cd-api',
  },
};

const cdEnvelope = {
  ctx: 'Sys',
  m: 'Moduleman',
  c: 'CdCliProfile',
  a: 'Create',
  dat: {
    f_vals: [
      {
        data: {
          cdCliProfileName: 'devServer-ssh-profile',
          cdCliProfileDescription:
            'SSH profile for development server connection',
          cdCliProfileData: sshProfileTemplate,
          cdCliProfileEnabled: true,
          cdCliProfileTypeId: 2,
          userId: 1010,
        },
      },
    ],
    token: '6E831EAF-244D-2E5A-0A9E-27C1FDF7821D',
  },
  args: null,
};

// export const CreateSshProfilePromptData: any = [
//   {
//     type: 'input',
//     name: 'profileName',
//     message: 'Enter profile name (e.g., devServer-ssh-profile):',
//     default: 'devServer-ssh-profile',
//   },
//   {
//     type: 'input',
//     name: 'description',
//     message: 'Enter profile description:',
//     default: 'SSH profile for development server connection',
//   },
//   {
//     type: 'input',
//     name: 'remoteServer',
//     message: 'Enter development server address (e.g., server.example.com):',
//     default: '192.168.1.70',
//   },
//   {
//     type: 'input',
//     name: 'remoteUser',
//     message: 'Enter remote SSH user (default: devops):',
//     default: 'devops',
//   },
//   {
//     type: 'input',
//     name: 'sshKey',
//     message: 'Enter path to your SSH key:',
//     default: '~/path/to/sshKey',
//   },
//   {
//     type: 'input',
//     name: 'cdApiDir',
//     message: 'Enter directory on the server (e.g., ~/cd-api):',
//     default: '~/cd-api',
//   },
// ];

export const PROFILE_CMD = {
  name: 'profile',
  description: 'Manage profiles.',
  subcommands: [
    {
      name: 'create',
      description: 'Create a new profile (ssh, api, etc.)',
      options: [
        {
          flags: '--file <profileFile>',
          description: 'Path to the profile template file',
          defaultValue: 'profileTemp.json', // Default template file
        },
      ],
      action: {
        execute: async (options) => {
          const cdCliProfileController = new CdCliProfileController();
          await cdCliProfileController.createProfile(options.file);
        },
      },
    },
    {
      name: 'list',
      description: 'List all available profiles.',
      action: {
        execute: async () => {
          const cdCliProfileController = new CdCliProfileController();
          await cdCliProfileController.listProfiles();
        },
      },
    },
    {
      name: 'remove',
      description: 'Remove a profile by name.',
      options: [
        {
          flags: '<profile_name>',
          description: 'Name of the profile to remove',
        },
      ],
      action: {
        execute: async (options: { profile_name: string }) => {
          const cdCliProfileController = new CdCliProfileController();
          await cdCliProfileController.removeProfile(options.profile_name);
        },
      },
    },
    {
      name: 'show',
      description: 'Show details of a profile by name.',
      options: [
        {
          flags: '<profile_name>',
          description: 'Name of the profile to show',
        },
      ],
      action: {
        execute: async (options: { profile_name: string }) => {
          const cdCliProfileController = new CdCliProfileController();
          await cdCliProfileController.showProfile(options.profile_name);
        },
      },
    },
  ],
};
