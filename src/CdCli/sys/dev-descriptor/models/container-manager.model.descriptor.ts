import type {
  CliControlsDescriptor,
  ScalingDescriptor,
  SecurityDescriptor,
} from './/service-descriptor.model';
import type { OperatingSystemDescriptor } from './/workstations.model';
import type { BaseDescriptor } from './base-descriptor.model';

export interface ContainerManagerDescriptor extends BaseDescriptor {
  typeInfo: ContainerManagerTypeDescriptor; // Type and deployment info of the container manager
  platformCompatibility: OperatingSystemDescriptor; // Platform compatibility details
  scalingConfig: ScalingDescriptor; // Scaling configurations
  cliControls: CliControlsDescriptor; // CLI control details
  security: SecurityDescriptor; // Security features and compliance
  containerDetails?: ContainerDescriptor[]; // Details of managed containers
  features: ContainerManagementFeaturesDescriptor; // Additional container management features
}

// // Base Descriptor
// export interface BaseDescriptor {
//   name: string; // Name of the container manager
//   description?: string; // Optional description of the container manager
//   version?: string; // Version of the container manager
// }

// Container Manager Type Descriptor
export interface ContainerManagerTypeDescriptor {
  managerType:
    | 'docker'
    | 'kubernetes'
    | 'podman'
    | 'lxc'
    | 'ecs'
    | 'nomad'
    | 'other'; // Type of container manager
  supportedContainerTypes: ('linux' | 'windows' | 'macOS' | 'multi-platform')[]; // Supported container OS types
  deploymentMode: 'local' | 'cloud' | 'hybrid'; // Deployment mode
}

// // Platform Compatibility Descriptor
// export interface PlatformCompatibilityDescriptor {
//   supportedOS: string[]; // Compatible operating systems (e.g., ["Linux", "Windows", "macOS"])
//   supportedArchitectures: string[]; // Supported architectures (e.g., ["x86_64", "arm64"])
//   cloudProviders?: string[]; // Supported cloud platforms (e.g., ["AWS", "Azure", "GCP"])
// }

// Container Descriptor
export interface ContainerDescriptor {
  containerId: string; // Unique identifier for the container
  image: string; // Docker image or equivalent
  status: 'running' | 'stopped' | 'paused'; // Current status of the container
  ports?: number[]; // Ports exposed by the container
  environmentVariables?: Record<string, string>; // Environment variables for the container
  resourceUsage?: {
    cpuUsage: string; // CPU usage (e.g., "50%")
    memoryUsage: string; // Memory usage (e.g., "512MB")
  };
}

// Container Management Features Descriptor
export interface ContainerManagementFeaturesDescriptor {
  supportsLogging: boolean; // Whether logging is supported
  supportsMonitoring: boolean; // Whether monitoring tools are integrated
  orchestrationSupport?: ('swarm' | 'helm' | 'operator-framework')[]; // Supported orchestration methods
  lifecycleHooks?: {
    preStart?: string; // Hook before starting a container
    postStop?: string; // Hook after stopping a container
  };
}
