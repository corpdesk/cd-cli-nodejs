import type { ICdRequest } from '../../base/IBase';
import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model';
import type { MigrationDescriptor } from './migration-descriptor.model';
import type { BaseServiceDescriptor } from './service-descriptor.model';
import {
  type CiCdDescriptor,
  getCiCdByName,
  knownCiCds,
} from '../../dev-descriptor/models/cicd-descriptor.model';
import {
  defaultService,
  getServiceByName,
  services,
} from './service-descriptor.model';
import {
  getTestingFramework,
  type TestingFrameworkDescriptor,
  testingFrameworks,
} from './testing-framework.model';
import {
  getVersionControlByContext,
  type VersionControlDescriptor,
  versionControlRepositories,
} from './version-control.model';
import {
  defaultWorkstation,
  getWorkstationByName,
  type WorkstationDescriptor,
  workstations,
} from './workstations.model';

export interface DevelopmentEnvironmentDescriptor extends BaseDescriptor {
  workstation: WorkstationDescriptor;
  services?: BaseServiceDescriptor[];
  environmentVariables?: EnvironmentVariablesDescriptor; // Separate descriptor
  ciCd?: CiCdDescriptor[];
  testingFrameworks?: TestingFrameworkDescriptor[];
  versionControl?: VersionControlDescriptor[];
}

export interface EnvironmentVariablesDescriptor extends BaseDescriptor {
  global?: Record<string, string>; // Variables common across all environments
  perEnvironment?: Record<string, Record<string, string>>; // Variables per environment (e.g., local, staging, production)
}

export const developmentEnvironments: DevelopmentEnvironmentDescriptor[] = [
  {
    /**
     * create an incus container for development
     */
    workstation:
      getWorkstationByName('emp-12', workstations) || defaultWorkstation,
    services: getServiceByName(['AuthService', 'DatabaseService'], services),
    environmentVariables: {
      global: { NODE_ENV: 'development', DEBUG: 'true' },
      perEnvironment: {
        local: { API_URL: 'http://localhost:3000' },
        staging: { API_URL: 'https://staging.api.com' },
        production: { API_URL: 'https://api.com' },
      },
    },
    ciCd: [getCiCdByName(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: getTestingFramework(['Jest'], testingFrameworks),
    versionControl: getVersionControlByContext(
      'cd-api',
      versionControlRepositories,
    ),
  },
  {
    workstation:
      getWorkstationByName('DevMachine-1', workstations) || defaultWorkstation,
    services: getServiceByName(['AuthService', 'DatabaseService'], services),
    environmentVariables: {
      global: { NODE_ENV: 'development', DEBUG: 'true' },
      perEnvironment: {
        local: { API_URL: 'http://localhost:3000' },
        staging: { API_URL: 'https://staging.api.com' },
        production: { API_URL: 'https://api.com' },
      },
    },
    ciCd: [getCiCdByName(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: getTestingFramework(
      ['Jest', 'Mocha'],
      testingFrameworks,
    ),
    versionControl: getVersionControlByContext(
      'cd-api',
      versionControlRepositories,
    ),
  },
  {
    workstation:
      getWorkstationByName('DevMachine-2', workstations) || defaultWorkstation,
    services: getServiceByName(
      ['PaymentService', 'NotificationService'],
      services,
    ),
    environmentVariables: {
      global: { LOG_LEVEL: 'verbose' },
      perEnvironment: {
        local: { PAYMENT_GATEWAY: 'sandbox' },
        production: { PAYMENT_GATEWAY: 'live' },
      },
    },
    ciCd: [getCiCdByName(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: getTestingFramework(
      ['Cypress', 'Jasmine'],
      testingFrameworks,
    ),
    versionControl: getVersionControlByContext(
      'cd-api',
      versionControlRepositories,
    ),
  },
  {
    workstation:
      getWorkstationByName('DevMachine-3', workstations) || defaultWorkstation,
    services: getServiceByName(['CacheService', 'AnalyticsService'], services),
    environmentVariables: {
      global: { CACHE_ENABLED: 'true' },
      perEnvironment: {
        local: { CACHE_PROVIDER: 'redis' },
        staging: { CACHE_PROVIDER: 'memcached' },
      },
    },
    ciCd: [getCiCdByName(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: getTestingFramework(['Karma', 'AVA'], testingFrameworks),
    versionControl: getVersionControlByContext(
      'cd-api',
      versionControlRepositories,
    ),
  },
  {
    workstation:
      getWorkstationByName('DevMachine-4', workstations) || defaultWorkstation,
    services: getServiceByName(['UserService', 'LoggingService'], services),
    environmentVariables: {
      global: { ENABLE_LOGGING: 'true' },
      perEnvironment: {
        local: { LOG_FORMAT: 'pretty' },
        production: { LOG_FORMAT: 'json' },
      },
    },
    ciCd: [getCiCdByName(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: getTestingFramework(
      ['Playwright', 'TestCafe'],
      testingFrameworks,
    ),
    versionControl: getVersionControlByContext(
      'cd-api',
      versionControlRepositories,
    ),
  },
];

export const defaultDevelopmentEnvironment: DevelopmentEnvironmentDescriptor = {
  workstation: defaultWorkstation,
};

export function getDevEnvironmentByName(
  name: string,
  developmentEnvironments: DevelopmentEnvironmentDescriptor[],
): DevelopmentEnvironmentDescriptor {
  return (
    developmentEnvironments.find(
      (env) => env.workstation.name?.toLowerCase() === name.toLowerCase(),
    ) || defaultDevelopmentEnvironment
  );
}
