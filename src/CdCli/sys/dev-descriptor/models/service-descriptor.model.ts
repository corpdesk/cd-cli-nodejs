// import type { DependencyDescriptor } from './app-descriptor.model';

import type { ContainerManagerDescriptor } from '../../dev-descriptor/models/container-manager.model.descriptor';
import type { DataStoreDescriptor } from '../../dev-descriptor/models/datastore-descriptor.model';
import type {
  AccountCredentials,
  ProviderInstruction,
  ServiceProviderDescriptor,
  UsageMetrics,
} from './service-provider.model';
import {
  type DNSRecord,
  type FileStorageAccess,
  type FileStorageCapacity,
  type FileStorageLocation,
  type FileStoreDescriptor,
  type FirewallRule,
  getWorkstationByName,
  type NetworkInterfaceDescriptor,
  type OperatingSystemDescriptor,
  type OperatingSystemPermissionDescriptor,
  type PortMapping,
  type VolumeMapping,
  type WorkstationAccessDescriptor,
} from './workstations.model';

export interface BaseServiceDescriptor {
  serviceName: string;
  serviceType:
    | 'storage'
    | 'compute'
    | 'push-services'
    | 'database'
    | 'networking'
    | 'repository'
    | 'api'
    | 'gui-web-app'
    | 'push-server'
    | 'static-site'
    | 'background-process'
    | 'daemon'
    | 'cron-job'
    | 'worker-thread'
    | 'other'; // Covers all service types

  command: string; // Execution command
  workstationAccess: WorkstationAccessDescriptor;

  credentials?: AccountCredentials; // Access credentials for the service
  usageMetrics?: UsageMetrics; // Service-related performance metrics
  configuration?: Record<string, any>; // Service-specific settings
  availabilityZones?: string[]; // Regions where the service operates
  serviceProvider?: ServiceProviderDescriptor; // Provider details

  metadata?: {
    description?: string;
    createdBy?: string;
    createdAt?: string;
  };
}

// export interface ServiceDescriptor {
//   serviceName: string; // Name of the service (e.g., S3, Compute Engine, Blob Storage)
//   serviceType:
//     | 'storage'
//     | 'compute'
//     | 'push-services'
//     | 'database'
//     | 'networking'
//     | 'repository'
//     | 'other'; // Type of service
//   credentials?: AccountCredentials; // Specific credentials to access this service
//   usageMetrics?: UsageMetrics; // Metrics like quota, consumption, or performance
//   configuration?: Record<string, any>; // Service-specific configuration details
//   availabilityZones?: string[]; // Regions or zones where the service is available
//   serviceProvider?: ServiceProviderDescriptor;
// }

export interface CloudServiceDescriptor extends BaseServiceDescriptor {
  provider: 'aws' | 'google-cloud' | 'azure' | 'digitalocean' | 'custom';

  webServerEnvironment: 'development' | 'staging' | 'production';
  webServer: WebServer;
  sslConfig: SslConfig;
  domainConfig: DomainConfig;
  osHost: OperatingSystemDescriptor;

  directories: {
    fileStorageCapacity: FileStorageCapacity;
    fileStorageLocation: FileStorageLocation;
    fileStorageAccess: FileStorageAccess;
  };

  network: NetworkInterfaceDescriptor;
  containerManager?: ContainerManagerDescriptor;
  webServerSecurity: WebserverSecurityConfig;
}

export interface SystemServiceDescriptor extends BaseServiceDescriptor {
  serviceType: 'background-process' | 'daemon' | 'cron-job' | 'worker-thread';
  osServiceManager: 'systemd' | 'initd' | 'supervisor' | 'custom';
  dependencies?: string[]; // Other required system services
  restartPolicy?: 'always' | 'on-failure' | 'manual';
}

export interface WebserverSecurityConfig {
  htaccess?: string; // Content of .htaccess or equivalent security file
  headers?: Record<string, string>; // HTTP security headers
  firewall?: FirewallRule[];
}

export interface DomainConfig {
  primaryDomain: string; // Primary domain for the web service
  subdomains?: string[]; // List of subdomains to create
  dnsSettings: DNSRecord[];
}

export interface WebServer {
  provider: 'nginx' | 'apache' | 'iis' | 'custom'; // Web server type
  config: string; // Path or raw content of server configuration (e.g., nginx.conf)
}

export interface SslConfig {
  enabled: boolean; // Whether SSL is enabled
  provider: 'letsencrypt' | 'custom'; // SSL provider
  certificatePath?: string; // Path to SSL certificate (if custom)
  privateKeyPath?: string; // Path to private key (if custom)
  autoRenew?: boolean; // Whether SSL should auto-renew
}

// Scaling Configuration Descriptor
export interface ScalingDescriptor {
  autoScaling: boolean; // Whether auto-scaling is supported
  scalingStrategies?: ('horizontal' | 'vertical' | 'cluster' | 'node-pool')[]; // Supported scaling strategies
  maxContainers?: number; // Maximum number of containers supported
  resourceLimits?: {
    cpu: string; // CPU limit per container (e.g., "4 cores")
    memory: string; // Memory limit per container (e.g., "8GB")
  };
}

export interface WebserviceProvisionDescriptor extends CloudServiceDescriptor {
  accountAccess: {
    method: 'api-key' | 'oauth' | 'ssh-key' | 'username-password'; // Authentication method
    credentials: AccountCredentials; // Encapsulated account credentials
  };

  provisioningTools: {
    tool:
      | 'terraform'
      | 'ansible'
      | 'cloudformation'
      | 'pulumi'
      | 'custom-script'; // Tool for provisioning
    version?: string; // Version of the tool (optional)
    configuration: string; // Path or inline configuration for the tool
  }[];

  scriptingSupport?: {
    enabled: boolean; // Whether custom scripting is allowed
    language: 'bash' | 'python' | 'typescript' | 'other'; // Scripting language
    scripts: ScriptDescriptor[]; // List of available or custom scripts
  };

  migration: {
    enabled: boolean; // Whether migration is supported
    sourceProvider:
      | 'aws'
      | 'google-cloud'
      | 'azure'
      | 'digitalocean'
      | 'custom'; // Current provider
    targetProvider:
      | 'aws'
      | 'google-cloud'
      | 'azure'
      | 'digitalocean'
      | 'custom'; // Target provider
    steps: MigrationStep[]; // Steps to facilitate migration
    rollback?: boolean; // Whether rollback options are provided
  };

  providerSpecificInstructions?: Record<string, ProviderInstruction>; // Instructions for specific providers
}

export interface ScriptDescriptor {
  name: string; // Name of the script
  description: string; // Description of what the script does
  script: string; // Inline script content or path to the script file
}

export interface MigrationStep {
  description: string; // Description of the migration step
  command: string; // Command or action to perform during migration
  tools?: string[]; // Tools required to perform the step (optional)
}

export interface LicenseDescriptor {
  type: 'openSource' | 'commercial' | 'custom';
  licenseName?: string; // For standard licenses (e.g., 'MIT', 'GPL-3.0', 'Apache-2.0')
  licenseLink?: string; // URL to the license text (for commercial or open source)
  terms?: string; // For custom licenses or additional terms
  cost?: {
    type: 'free' | 'paid';
    amount?: number; // Specify cost if 'paid'
    currency?: string; // Currency type if 'paid'
  };
}

export interface VendorDescriptor {
  name: string; // Name of the vendor or organization
  contact?: string; // Email or contact link
  website?: string; // Website URL
}

// CLI Controls Descriptor
export interface CliControlsDescriptor {
  supportsCli: boolean; // Whether CLI controls are available
  cliCommands?: string[]; // List of supported CLI commands (e.g., ["docker run", "kubectl apply"])
  customScripting?: boolean; // Whether custom scripting is supported
}

// Security Descriptor
export interface SecurityDescriptor {
  isSecure: boolean; // Indicates if the manager has built-in security features
  features?: (
    | 'isolation'
    | 'encryption'
    | 'role-based-access-control'
    | 'audit-logs'
  )[]; // Supported security features
  vulnerabilities?: string[];
  complianceStandards?: string[]; // Supported compliance standards (e.g., ["CIS", "PCI DSS", "HIPAA"])
}

export interface UtilityConfig {
  loadBalancer?: {
    enabled: boolean; // Whether load balancer is enabled
    type?: string; // Load balancer type (e.g., nginx)
  };
  dataStore?: DataStoreDescriptor[];
  fileStore?: FileStoreDescriptor[];
  webService?: CloudServiceDescriptor;
  containerManager?: {
    type: string; // Container manager type (e.g., docker)
    composeFile?: string; // Path to the compose file
  };
  cloudVisualizer?: {
    enabled: boolean; // Whether cloud visualizer is enabled
    tool?: string; // Visualizer tool name (e.g., Cloud-Brix)
  };
  diagnosticTool?: {
    enabled: boolean; // Whether diagnostic tools are enabled
    commands?: string[]; // List of diagnostic commands
  };
}

export interface ServiceCost {
  type: 'free' | 'paid';
  amount?: number; // Specify cost if 'paid'
  currency?: string; // Currency type if 'paid'
  costRate?: 'once' | 'per-month' | 'per-quarter' | 'per-year' | 'per-user';
}

// export const services: BaseServiceDescriptor[] = [
//   {
//     serviceName: 'S3',
//     serviceType: 'storage',
//     credentials: {
//       type: 'apiKey',
//       apiKey: 'AKIA123456789EXAMPLE',
//     },
//     usageMetrics: {
//       quota: { units: 'TB', value: 1 },
//       currentUsage: { units: 'GB', value: 200 },
//     },
//     configuration: {
//       bucketName: 'my-app-bucket',
//       encryption: 'AES256',
//     },
//     availabilityZones: ['us-east-1', 'us-west-2'],
//     serviceProvider: getServiceProviderByName('AWS', serviceProviders),
//   },
//   {
//     serviceName: 'Compute Engine',
//     serviceType: 'compute',
//     credentials: {
//       type: 'oauth',
//       token: 'ya29.A0AfH6SMD2j-example',
//     },
//     usageMetrics: {
//       quota: { units: 'vCPUs', value: 100 },
//       currentUsage: { units: 'vCPUs', value: 25 },
//     },
//     configuration: {
//       machineType: 'e2-standard-4',
//       autoScaling: true,
//     },
//     availabilityZones: ['us-central1', 'europe-west1'],
//     serviceProvider: getServiceProviderByName('GCP', serviceProviders),
//   },
//   {
//     serviceName: 'Blob Storage',
//     serviceType: 'storage',
//     credentials: {
//       type: 'custom',
//       customAuthConfig: {
//         accountName: 'myblobaccount',
//         accountKey: 'abc123exampleKey',
//       },
//     },
//     usageMetrics: {
//       quota: { units: 'GB', value: 500 },
//       currentUsage: { units: 'GB', value: 150 },
//     },
//     configuration: {
//       containerName: 'static-content',
//       accessTier: 'Hot',
//     },
//     availabilityZones: ['eastus', 'westus2'],
//     serviceProvider: getServiceProviderByName('Azure', serviceProviders),
//   },
//   {
//     serviceName: 'Push Notification Service',
//     serviceType: 'other',
//     credentials: {
//       type: 'apiKey',
//       apiKey: 'PUSH123456789EXAMPLE',
//     },
//     usageMetrics: {
//       quota: { units: 'notifications/month', value: 1_000_000 },
//       currentUsage: { units: 'notifications', value: 200_000 },
//     },
//     configuration: {
//       platform: 'iOS/Android',
//       retries: 3,
//     },
//     availabilityZones: ['global'],
//     serviceProvider: getServiceProviderByName('Firebase', serviceProviders),
//   },
//   {
//     serviceName: 'MySQL Database',
//     serviceType: 'database',
//     credentials: {
//       type: 'usernamePassword',
//       username: 'admin',
//       password: 'securePass123',
//     },
//     usageMetrics: {
//       quota: { units: 'GB', value: 100 },
//       currentUsage: { units: 'GB', value: 45 },
//     },
//     configuration: {
//       replication: true,
//       backupEnabled: true,
//     },
//     availabilityZones: ['ap-southeast-1', 'us-east-1'],
//     serviceProvider: getServiceProviderByName('Digitalocean', serviceProviders),
//   },
//   {
//     serviceName: 'Container Registry',
//     serviceType: 'storage',
//     credentials: {
//       type: 'oauth',
//       token: 'ya29.ContainerRegistryExampleToken',
//     },
//     usageMetrics: {
//       quota: { units: 'TB', value: 10 },
//       currentUsage: { units: 'TB', value: 2 },
//     },
//     configuration: {
//       retentionPolicy: '30 days',
//       scanningEnabled: true,
//     },
//     availabilityZones: ['europe-north1', 'us-central1'],
//     serviceProvider: getServiceProviderByName('GCP', serviceProviders),
//   },
//   {
//     serviceName: 'Default Repository',
//     serviceType: 'repository',
//     configuration: {
//       url: 'https://github.com/example/default-repo',
//       defaultBranch: 'main',
//       enabled: true,
//       isPrivate: true,
//     },
//     serviceProvider: getServiceProviderByName('GitHub', serviceProviders),
//   },
//   {
//     serviceName: 'GitLab Repository',
//     serviceType: 'repository',
//     configuration: {
//       url: 'https://gitlab.com/example/project-repo',
//       defaultBranch: 'main',
//       enabled: true,
//       isPrivate: false,
//     },
//     serviceProvider: getServiceProviderByName('GitLab', serviceProviders),
//   },
//   {
//     serviceName: 'AWS CodeCommit Repository',
//     serviceType: 'repository',
//     configuration: {
//       url: 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/my-repo',
//       defaultBranch: 'main',
//       enabled: true,
//       isPrivate: true,
//     },
//     serviceProvider: getServiceProviderByName('AWS', serviceProviders),
//   },
// ];

// export const defaultService: BaseServiceDescriptor = {
//   serviceName: 'Unknown Service',
//   serviceType: 'other',
//   workstationAccess: getWorkstationAccessByName(''),
//   usageMetrics: {},
//   configuration: {},
//   availabilityZones: ['global'],
//   serviceProvider: {
//     providerName: 'Unknown Provider',
//     credentials: {
//       type: 'custom',
//       customAuthConfig: {},
//     },
//     servicesInUse: [],
//     dataCenterLocation: {
//       region: 'unknown',
//       country: 'unknown',
//     },
//   },
// };

// export function getServiceByName(
//   names: string[],
//   resources: ServiceDescriptor[],
// ): BaseServiceDescriptor[] {
//   const foundServices = resources.filter((service) =>
//     names.some(
//       (name) => service.serviceName.toLowerCase() === name.toLowerCase(),
//     ),
//   );

//   return foundServices.length > 0 ? foundServices : [defaultService];
// }
