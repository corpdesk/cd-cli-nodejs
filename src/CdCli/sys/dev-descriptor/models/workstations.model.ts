/* eslint-disable antfu/if-newline */
// import type { WorkstationDescriptor } from './dev-descriptor.model';
// import type { OperatingSystemDescriptor } from './app-descriptor.model';
import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import { defaultOs, getOsByName, operatingSystems } from './oses.model';
import {
  getPermissionsByName,
  getPermissionsByRoleNames,
  roles,
} from './permissions.model';
import {
  defaultSoftware,
  getSoftwareByName,
  softwareDataStore,
} from './software-store.model';

export interface WorkstationDescriptor {
  id: string; // Unique identifier for the workstation
  name: string; // Descriptive name of the workstation
  type: 'local' | 'remote'; // Indicates if the workstation is local or remote
  os: OperatingSystemDescriptor; // Details of the operating system
  path: string;
  timezone: string;
  enabled?: boolean;
  requiredSoftware: DependencyDescriptor[]; // List of installed software
  networkAddress: NetworkConfig;
  hardware: HardwareSpecs;
  sshCredentials?: SshCredentials;
  lastActive?: Date; // Optional: Timestamp of the last activity
  isOnline: boolean; // Indicates if the workstation is currently online
}

export interface OperatingSystemDescriptor {
  name: string; // Name of the operating system (e.g., Windows, Linux, macOS)
  version: string; // Version of the operating system (e.g., "10.0.19044", "Ubuntu 22.04")
  architecture: 'x86_64' | 'x86' | 'x64' | 'ARM' | 'ARM64'; // CPU architecture supported by the OS
  kernelVersion?: string; // Optional: Specific kernel version (e.g., "5.15.0-79-generic")
  distribution?: string; // Optional: For Linux distros (e.g., "Ubuntu", "Fedora")
  buildNumber?: string; // Optional: Build number for the OS (e.g., Windows-specific)
  environmentVariables?: { [key: string]: string }; // Optional: Key-value pairs of environment variables
  timezone: string; // Timezone of the environment (e.g., "UTC", "America/New_York")
  hostname: string; // Hostname of the system
  ipAddresses: string[]; // List of IP addresses associated with the environment
  uptime?: number; // Optional: System uptime in seconds
  isVirtualized: boolean; // Whether the environment is running on a virtual machine
  virtualMachineType?: string; // Optional: Type of virtualization (e.g., "VMware", "KVM")
}

export const osPermissions: OperatingSystemPermissionDescriptor = {
  basePermissions: getPermissionsByRoleNames([], roles),
  accessControls: [
    {
      subject: 'user:john',
      resource: '/home/john/docs',
      allowedActions: ['read', 'write'],
      conditions: [
        {
          type: 'time-based',
          details: { startTime: '09:00', endTime: '17:00' },
        },
      ],
    },
    {
      subject: 'group:developers',
      resource: '/var/app',
      allowedActions: ['read', 'write', 'execute'],
    },
  ],
  auditConfig: {
    logChanges: true,
    lastModifiedBy: 'admin',
    lastModifiedAt: new Date(),
    auditTrail: ['Initial setup', 'Added permissions for user:john'],
  },
  roles: [
    {
      roleName: 'admin',
      permissions: [
        {
          name: 'manage_system',
          description: 'Allows full control over the operating system',
          level: 'system',
          type: 'service',
        },
      ],
    },
  ],
};

// Condition Descriptor
export interface ConditionDescriptor {
  type: 'time-based' | 'location-based' | 'context-based' | 'other'; // Type of condition
  details: Record<string, any>; // Details of the condition (e.g., time range, IP address)
}

// Comprehensive OS Permissions Descriptor
export interface OperatingSystemPermissionDescriptor {
  basePermissions: PermissionDescriptor[]; // List of base permissions defined in the system
  accessControls: AccessControlDescriptor[]; // Access control rules
  auditConfig?: AuditDescriptor; // Audit configuration for permissions
  roles?: RoleDescriptor[]; // Optional roles for role-based access control
}

// Base Permission Descriptor
export interface PermissionDescriptor {
  name: string; // Name of the permission (e.g., "read", "write", "execute")
  description?: string; // Description of the permission
  level: 'user' | 'group' | 'system'; // Level of the permission (e.g., user, group, or system-wide)
  type: 'file' | 'directory' | 'process' | 'network' | 'service'; // Type of resource the permission applies to
}

// Access Control Descriptor
export interface AccessControlDescriptor {
  subject: string; // Subject (user, group, or process) the permission applies to
  resource: string; // Resource (e.g., file path, directory, process ID, service name)
  allowedActions: (
    | 'read'
    | 'write'
    | 'execute'
    | 'delete'
    | 'modify'
    | 'create'
  )[]; // Allowed actions on the resource
  conditions?: ConditionDescriptor[]; // Optional conditions or constraints
}

// Audit Descriptor
export interface AuditDescriptor {
  logChanges: boolean; // Whether changes to the permissions should be logged
  lastModifiedBy?: string; // User or process that last modified the permission
  lastModifiedAt?: Date; // Timestamp of the last modification
  auditTrail?: string[]; // Log of previous changes
}

// Role-Based Access Control Descriptor (Optional)
export interface RoleDescriptor {
  roleName: string; // Name of the role (e.g., "admin", "user", "guest")
  permissions: PermissionDescriptor[]; // List of permissions assigned to this role
}

export interface FileStoreDescriptor {
  name: string; // Unique identifier for the file store
  type:
    | 'local'
    | 'network'
    | 'object-storage'
    | 'distributed'
    | 'container-managed'; // Type of file storage

  fileStorageCapacity: FileStorageCapacity; // Storage capacity details
  fileStorageLocation: FileStorageLocation; // Storage location details
  fileStorageAccess: FileStorageAccess; // Access control details
  fileStorageRedundancy?: FileStorageRedundancy; // Redundancy details
  fileStorageEncryption?: FileStorageEncryption; // Encryption details
  fileStoragePerformance?: FileStoragePerformance; // Performance details
  fileStorageIntegration?: FileStorageIntegration; // Integration details
  fileStorageBackup?: FileStorageBackup; // Backup details
  fileStorageMetadata?: FileStorageMetadata; // Metadata details
}

// Root Interface
export interface NetworkConfig {
  hostname: string; // Hostname of the workstation
  ip4Addresses?: string[]; // List of IPv4 addresses
  ip6Addresses?: string[]; // List of IPv6 addresses
  servicePorts?: ServicePortConfig; // Port configurations
  publicUrl?: string; // Public URL of the service
  firewallRules?: FirewallRule[]; // Firewall rules for allowed IPs and protocols
  dnsConfig?: DNSConfig; // DNS configuration
  routingConfig?: RoutingConfig; // Routing-related configurations
  proxySettings?: ProxySettings; // Proxy server settings
  networkPolicies?: NetworkPolicy[]; // Policies governing network behavior
}

// Service Port Configurations
export interface ServicePortConfig {
  http?: number; // HTTP port
  https?: number; // HTTPS port
  portMapping?: PortMapping[]; // Port mapping details, including forwarding, ingress, and egress
}

// Port Mapping Details
export interface PortMapping {
  containerPort: number; // Port inside the container/application
  hostPort?: number; // Port exposed on the host
  protocol: 'TCP' | 'UDP'; // Protocol type
  ingress?: IngressConfig; // Ingress rules for this port
  egress?: EgressConfig; // Egress rules for this port
}

// Ingress Configuration
export interface IngressConfig {
  allowedSources?: string[]; // Allowed source IPs or CIDR blocks
  rateLimit?: number; // Maximum number of requests per second
  tlsEnabled?: boolean; // Whether TLS is enabled for this port
}

// Egress Configuration
export interface EgressConfig {
  allowedDestinations?: string[]; // Allowed destination IPs or CIDR blocks
  bandwidthLimit?: string; // Bandwidth limit for egress traffic (e.g., "100Mbps")
}

// Firewall Rules
export interface FirewallRule {
  id?: string; // Unique identifier for the rule
  action: 'allow' | 'deny'; // Action to take (allow or deny)
  protocol: 'TCP' | 'UDP' | 'ICMP'; // Protocol for the rule
  portRange?: { from: number; to: number }; // Port range (optional)
  source?: string; // Source IP or CIDR (optional)
  destination?: string; // Destination IP or CIDR (optional)
  description?: string; // Description of the rule
}

// DNS Configuration
export interface DNSConfig {
  primary: string; // Primary DNS server
  secondary?: string; // Secondary DNS server
  searchDomains?: string[]; // List of search domains
  records?: DNSRecord[]; // DNS records
}

// DNS Record
export interface DNSRecord {
  provider: 'route53' | 'google-dns' | 'cloudflare' | 'custom'; // DNS provider
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX'; // DNS record type
  name: string; // Name of the record
  value: string; // Value of the record
  ttl?: number; // Time-to-live (TTL) in seconds
}

// Routing Configuration
export interface RoutingConfig {
  staticRoutes?: StaticRoute[]; // Static routes
  loadBalancing?: LoadBalancingConfig; // Load balancing settings
}

// Static Route
export interface StaticRoute {
  destination: string; // Destination CIDR block
  gateway: string; // Gateway for the route
  metric?: number; // Priority metric for the route
}

// Load Balancing Configuration
export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'least-connections' | 'ip-hash'; // Load balancing strategy
  healthCheck?: {
    interval: number; // Health check interval in seconds
    timeout: number; // Timeout in seconds
    retries: number; // Number of retries before marking unhealthy
  };
}

// Proxy Settings
export interface ProxySettings {
  httpProxy?: string; // HTTP proxy URL
  httpsProxy?: string; // HTTPS proxy URL
  noProxy?: string[]; // List of domains or IPs to bypass the proxy
}

// Network Policy
export interface NetworkPolicy {
  name: string; // Policy name
  description?: string; // Description of the policy
  allowedIngress?: IngressConfig[]; // Allowed ingress configurations
  allowedEgress?: EgressConfig[]; // Allowed egress configurations
}

// Supporting Interfaces
// export interface DNSRecord {
//   type: 'A' | 'CNAME' | 'MX' | 'TXT' | 'SRV'; // DNS record type
//   name: string; // Record name (e.g., "www" or "@")
//   value: string; // Record value (e.g., IP address or domain name)
//   ttl: number; // Time-to-live in seconds
// }

// export interface FirewallRule {
//   protocol: 'tcp' | 'udp' | 'icmp'; // Protocol type
//   portRange: string; // Port range (e.g., "80" or "3000-4000")
//   source: string; // Allowed source IP or CIDR block
// }

export interface VolumeMapping {
  hostPath: string; // Host machine path
  containerPath: string; // Container path
}

// export interface PortMapping {
//   hostPort: number; // Host machine port
//   containerPort: number; // Container port
// }

export interface HardwareSpecs {
  cpu: CpuSpecs;
  memory: MemorySpecs;
  fileStorage: FileStoreDescriptor[];
  gpu?: GpuSpecs;
}

export interface FileReference {
  name: string; // Logical name of the file reference (e.g., "packageJson", "dockerCompose")
  filePath: string; // Path to the file (relative or absolute)
  format: 'json' | 'yaml' | 'xml' | 'text'; // Format of the file
  section?: string | string[]; // Optional: Section(s) of the file to extract (e.g., "dependencies" for package.json)
  description?: string; // Description of the purpose of this file reference
}

// Interface for File Storage Capacity
export interface FileStorageCapacity {
  size: string; // Total storage size (e.g., "500GB", "2TB")
  autoScaling?: boolean; // Whether storage can auto-scale
  quota?: {
    userLimit?: string; // Per-user storage limit (e.g., "10GB")
    groupLimit?: string; // Per-group storage limit
  };
}

// Interface for File Storage Location
export interface FileStorageLocation {
  path?: string; // Path for local or network file storage
  bucketName?: string; // Bucket name for object storage
  region?: string; // Region for cloud-based storage (e.g., "us-east-1")
  endpoints?: string[]; // Custom endpoints for distributed or object storage
}

// Interface for File Storage Access
export interface FileStorageAccess {
  fileStorageAccessType: 'public' | 'private' | 'restricted'; // Access control type
  osPermissions?: PermissionDescriptor[];
  authentication?: AuthenticationConfig;
}

export interface AuthenticationConfig {
  type: 'key-based' | 'token-based' | 'role-based' | 'none'; // Authentication mechanism
  credentials?: {
    apiKey?: string; // API key for access
    token?: string; // Authentication token
    user?: string; // Username
    password?: string; // Password
    roles?: string[]; // Role-based access roles
  };
}

// Interface for File Storage Redundancy
export interface FileStorageRedundancy {
  enabled: boolean; // Whether redundancy is enabled
  strategy?: 'mirroring' | 'striping' | 'parity'; // Redundancy strategy
  replicas?: number; // Number of replicas for redundancy
}

// Interface for File Storage Encryption
export interface FileStorageEncryption {
  enabled: boolean; // Whether encryption is enabled
  atRest?: boolean; // Encrypt files at rest
  inTransit?: boolean; // Encrypt files during transit
  algorithm?: string; // Encryption algorithm (e.g., "AES-256")
}

// Interface for File Storage Performance
export interface FileStoragePerformance {
  maxThroughput?: string; // Maximum throughput (e.g., "1Gbps")
  latency?: string; // Expected latency (e.g., "10ms")
  caching?: {
    enabled: boolean; // Whether caching is enabled
    type?: 'local' | 'distributed'; // Type of caching
    size?: string; // Cache size (e.g., "10GB")
  };
}

// Interface for File Storage Integration
export interface FileStorageIntegration {
  containerManager?: {
    manager: 'kubernetes' | 'docker'; // Container manager type
    volumeType: 'persistentVolume' | 'configMap' | 'emptyDir'; // Volume type
    mountPath: string; // Mount path inside the container
    accessModes: string[]; // Kubernetes access modes (e.g., "ReadWriteOnce", "ReadOnlyMany")
  };
  cloudProvider?: {
    provider: 'aws-s3' | 'gcp-storage' | 'azure-blob'; // Cloud provider
    sdkVersion?: string; // SDK version for interaction
    customEndpoints?: string[]; // Custom endpoints for interaction
  };
}

// Interface for File Storage Backup
export interface FileStorageBackup {
  enabled: boolean; // Whether backups are enabled
  schedule?: string; // Cron-like schedule for backups (e.g., "0 3 * * *")
  retentionPolicy?: string; // Retention policy (e.g., "30d" for 30 days)
  destination?: string; // Destination for backups (e.g., S3 bucket, NFS path)
}

// Interface for File Storage Metadata
export interface FileStorageMetadata {
  description?: string; // Description of the file store
  createdBy?: string; // Creator of the file store
  tags?: string[]; // Tags for categorization
  createdAt?: string; // Creation timestamp
  lastModified?: string; // Last modification timestamp
}

export interface CpuSpecs {
  model: string; // CPU model (e.g., "Intel Core i7-12700K")
  cores: number; // Number of CPU cores
  threads: number; // Number of CPU threads
}

export interface GpuSpecs {
  model: string; // Optional: GPU model (e.g., "NVIDIA RTX 3080")
  memory: number; // GPU memory in MB
}

export interface MemorySpecs {
  total: number; // Total memory in MB
  used?: number; // Optional: Memory currently in use in MB
}

export interface SshCredentials {
  username: string; // SSH username (for remote workstations)
  host: string; // SSH host address (e.g., "192.168.1.100")
  port: number; // SSH port (default: 22)
  privateKey?: string; // Optional: Path or content of the SSH private key
  password?: string; // Optional: Password for SSH authentication
}

const fileStorages: FileStoreDescriptor[] = [
  {
    name: 'Basic Storage',
    type: 'local',
    fileStorageCapacity: {
      size: '500GB',
      autoScaling: false,
    },
    fileStorageLocation: {
      path: '/local/storage',
    },
    fileStorageAccess: {
      fileStorageAccessType: 'private',
      osPermissions: getPermissionsByRoleNames(['admin', 'user'], roles),
    },
  },
  {
    name: 'Advanced Storage',
    type: 'network',
    fileStorageCapacity: {
      size: '2TB',
      autoScaling: true,
      quota: {
        userLimit: '100GB',
      },
    },
    fileStorageLocation: {
      path: '\\\\network\\storage',
    },
    fileStorageAccess: {
      fileStorageAccessType: 'restricted',
      authentication: {
        type: 'role-based',
        credentials: {
          roles: ['admin', 'user'],
        },
      },
    },
  },
  {
    name: 'Premium Storage',
    type: 'object-storage',
    fileStorageCapacity: {
      size: '5TB',
      autoScaling: true,
    },
    fileStorageLocation: {
      bucketName: 'premium-storage-bucket',
      region: 'us-east-1',
    },
    fileStorageAccess: {
      fileStorageAccessType: 'public',
    },
  },
  {
    name: 'Default Storage',
    type: 'distributed',
    fileStorageCapacity: {
      size: '1TB',
      autoScaling: true,
    },
    fileStorageLocation: {
      endpoints: ['endpoint1.example.com', 'endpoint2.example.com'],
    },
    fileStorageAccess: {
      fileStorageAccessType: 'restricted',
      authentication: {
        type: 'token-based',
        credentials: {
          token: 'default-storage-token',
        },
      },
    },
  },
];

export enum FileStorageOption {
  Basic = 'Basic Storage',
  Advanced = 'Advanced Storage',
  Premium = 'Premium Storage',
  Default = 'Default Storage',
}

export const workstations: WorkstationDescriptor[] = [
  {
    id: 'ws-001',
    name: 'Local Development Machine',
    type: 'local',
    os: getOsByName('ubuntu.22.04', operatingSystems)[0],
    path: '/local/dev',
    enabled: true,
    timezone: 'UTC',
    networkAddress: {
      hostname: 'dev-machine',
      ip4Addresses: ['192.168.0.2'],
    },
    hardware: {
      cpu: {
        model: 'Intel Core i7-12700K',
        cores: 12,
        threads: 24,
      },
      memory: {
        total: 32768,
      },
      fileStorage: getFileStoregeByName(
        [FileStorageOption.Premium],
        fileStorages,
      ),
      gpu: {
        model: 'NVIDIA RTX 3080',
        memory: 10000,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['npm.9.8.1', 'vscode.1.82.0'],
      softwareDataStore,
    ),
    sshCredentials: undefined,
    lastActive: new Date('2025-01-20T10:45:00Z'),
    isOnline: true,
  },
  {
    id: 'ws-002',
    name: 'Windows Build Server',
    type: 'remote',
    os: getOsByName('Windows', operatingSystems)[0],
    path: '\\\\build-server\\shared',
    enabled: true,
    timezone: 'EST',
    networkAddress: {
      hostname: 'build-server',
      ip4Addresses: ['10.0.0.10'],
    },
    hardware: {
      cpu: {
        model: 'AMD Ryzen 9 5950X',
        cores: 16,
        threads: 32,
      },
      memory: {
        total: 65536,
      },
      fileStorage: getFileStoregeByName(
        [FileStorageOption.Premium],
        fileStorages,
      ),
      gpu: {
        model: 'NVIDIA RTX A6000',
        memory: 48000,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['pnpm.7.16.0', 'apache.2.4.57', 'mysql-server.8.0.34'],
      softwareDataStore,
    ),
    sshCredentials: {
      username: 'admin',
      privateKey: '/keys/build-server-key',
      host: '123.456.890',
      port: 22,
    },
    lastActive: new Date('2025-01-19T23:00:00Z'),
    isOnline: false,
  },
  {
    id: 'ws-003',
    name: 'macOS Developer Laptop',
    type: 'local',
    os: getOsByName('macOS', operatingSystems)[0],
    path: '/Users/dev/code',
    enabled: true,
    timezone: 'PST',
    networkAddress: {
      hostname: 'dev-macbook',
      ip4Addresses: ['192.168.1.20'],
    },
    hardware: {
      cpu: {
        model: 'Apple M1 Max',
        cores: 10,
        threads: 20,
      },
      memory: {
        total: 65536,
      },
      fileStorage: getFileStoregeByName(
        [FileStorageOption.Premium],
        fileStorages,
      ),
      gpu: {
        model: 'Integrated',
        memory: 32000,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['vscode.1.82.0', 'npm.9.8.1', 'lxd.5.0'],
      softwareDataStore,
    ),
    sshCredentials: undefined,
    lastActive: new Date('2025-01-18T15:30:00Z'),
    isOnline: true,
  },
  {
    id: 'ws-004',
    name: 'CentOS Database Server',
    type: 'remote',
    os: getOsByName('CentOS', operatingSystems)[0],
    path: '/var/lib/mysql',
    enabled: true,
    timezone: 'UTC',
    networkAddress: {
      hostname: 'db-server',
      ip4Addresses: ['10.0.1.15'],
    },
    hardware: {
      cpu: {
        model: 'Intel Xeon Gold 6258R',
        cores: 28,
        threads: 56,
      },
      memory: {
        total: 128000,
      },
      fileStorage: getFileStoregeByName(
        [FileStorageOption.Premium],
        fileStorages,
      ),
      gpu: {
        model: 'None',
        memory: 0,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['mysql-server.8.0.34', 'apache.2.4.57', 'incus.1.2.3'],
      softwareDataStore,
    ),
    sshCredentials: {
      username: 'dbadmin',
      privateKey: '/keys/db-server-key',
      host: '123.238.101',
      port: 22,
    },
    lastActive: new Date('2025-01-20T09:00:00Z'),
    isOnline: true,
  },
  {
    id: 'ws-005',
    name: 'Test Virtual Machine',
    type: 'remote',
    os: getOsByName('ubuntu.22.04', operatingSystems)[0],
    path: '/vm/test',
    enabled: true,
    timezone: 'UTC',
    networkAddress: {
      hostname: 'test-vm',
      ip4Addresses: ['172.16.0.5'],
    },
    hardware: {
      cpu: {
        model: 'Virtual CPU',
        cores: 4,
        threads: 8,
      },
      memory: {
        total: 8192,
      },
      fileStorage: getFileStoregeByName(
        [FileStorageOption.Premium],
        fileStorages,
      ),
      gpu: {
        model: 'Virtual GPU',
        memory: 2048,
      },
    },
    requiredSoftware: getSoftwareByName(
      ['npm.9.8.1', 'pnpm.7.16.0', 'vscode.1.82.0'],
      softwareDataStore,
    ),
    sshCredentials: {
      username: 'vmuser',
      privateKey: '/keys/test-vm-key',
      host: '123.122.7',
      port: 22,
    },
    lastActive: new Date('2025-01-15T20:00:00Z'),
    isOnline: false,
  },
];

export const defaultWorkstation: WorkstationDescriptor = {
  id: 'unknown',
  name: 'Local Development Machine',
  type: 'local',
  os: getOsByName('ubuntu.22.04', operatingSystems)[0],
  path: '/local/dev',
  enabled: true,
  timezone: 'UTC',
  networkAddress: {
    hostname: 'dev-machine',
    ip4Addresses: ['192.168.0.2'],
  },
  hardware: {
    cpu: {
      model: 'Intel Core i7-12700K',
      cores: 12,
      threads: 24,
    },
    memory: {
      total: 32768,
    },
    fileStorage: getFileStoregeByName(
      [FileStorageOption.Premium],
      fileStorages,
    ),
    gpu: {
      model: 'NVIDIA RTX 3080',
      memory: 10000,
    },
  },
  requiredSoftware: getSoftwareByName(
    ['npm.9.8.1', 'vscode.1.82.0'],
    softwareDataStore,
  ),
  sshCredentials: undefined,
  lastActive: new Date('2025-01-20T10:45:00Z'),
  isOnline: true,
};

export const fileStorageOptions = [
  'Basic Storage',
  'Advanced Storage',
  'Premium Storage',
  'Default Storage',
];

export function getFileStoregeByName(
  names: string[],
  fileStorages: FileStoreDescriptor[],
): FileStoreDescriptor[] {
  const storageMap = new Map(
    fileStorages.map((storage) => [storage.name, storage]),
  );
  const defaultStorage = storageMap.get('Default Storage');
  const invalidRequests: string[] = [];

  const result: FileStoreDescriptor[] = names
    .map((name) => {
      const storage = storageMap.get(name);
      if (!storage) invalidRequests.push(name);
      return storage;
    })
    .filter((storage): storage is FileStoreDescriptor => !!storage);

  if (invalidRequests.length > 0) {
    console.warn('Invalid storage requests:', invalidRequests);
  }

  return result.length > 0 ? result : [defaultStorage!];
}

export function getWorkstationByName(
  name: string,
  ws: WorkstationDescriptor[],
): WorkstationDescriptor | undefined {
  return ws.find((workstation) => workstation.name === name);
}
