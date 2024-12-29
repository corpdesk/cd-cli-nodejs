/* eslint-disable unused-imports/no-unused-vars */
const data = {
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
    devServer: 'server.example.com',
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
          cdCliProfileData: data,
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
