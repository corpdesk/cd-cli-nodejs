import type { ICdRequest } from '../../base/IBase';
import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import type { MigrationDescriptor } from './migration-descriptor.model';
import type { ServiceDescriptor } from './service-provider.model';
import {
  type CiCdDescriptor,
  getCiCd,
  knownCiCds,
} from '../../dev-descriptor/models/cicd-descriptor.model';
import {
  defaultService,
  getServiceByName,
  services,
} from './service-descriptor.model';
import {
  getVersionControlDescriptor,
  type VersionControlDescriptor,
} from './version-control';
import {
  defaultWorkstation,
  getWorkstationByName,
  type WorkstationDescriptor,
  workstations,
} from './workstations.model';

export interface DevelopmentEnvironmentDescriptor {
  workstation: WorkstationDescriptor;
  services?: ServiceDescriptor[];
  environmentVariables?: EnvironmentVariablesDescriptor; // Separate descriptor
  ciCd: CiCdDescriptor[];
  testingFrameworks?: string[];
  versionControl?: VersionControlDescriptor;
}

export interface EnvironmentVariablesDescriptor {
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
    ciCd: [getCiCd(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: ['Jest', 'Mocha'],
    versionControl: getVersionControlDescriptor('/repos/dev-project'),
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
    ciCd: [getCiCd(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: ['Jest', 'Mocha'],
    versionControl: getVersionControlDescriptor('/repos/dev-project'),
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
    ciCd: [getCiCd(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: ['Cypress', 'Jasmine'],
    versionControl: getVersionControlDescriptor('/repos/payment-system'),
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
    ciCd: [getCiCd(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: ['Karma', 'AVA'],
    versionControl: getVersionControlDescriptor('/repos/cache-analytics'),
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
    ciCd: [getCiCd(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
    testingFrameworks: ['Playwright', 'TestCafe'],
    versionControl: getVersionControlDescriptor('/repos/user-logging'),
  },
];

export const defaultDevelopmentEnvironment: DevelopmentEnvironmentDescriptor = {
  workstation: defaultWorkstation,
  services: [defaultService],
  environmentVariables: {
    global: { NODE_ENV: 'development' },
    perEnvironment: {
      local: { API_URL: 'http://localhost:3000' },
      staging: { API_URL: 'https://staging.api.com' },
      production: { API_URL: 'https://api.com' },
    },
  },
  ciCd: [getCiCd(['Corpdesk CI/CD - Bash Deployment'], knownCiCds)],
  testingFrameworks: ['Jest'],
  versionControl: getVersionControlDescriptor('/repos/default-project'),
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
