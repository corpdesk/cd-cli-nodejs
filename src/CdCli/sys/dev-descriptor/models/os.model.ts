import type { OperatingSystemDescriptor } from './workstations.model';

export const operatingSystems: OperatingSystemDescriptor[] = [
  {
    name: 'Windows',
    version: '10',
    architecture: 'x64',
    kernelVersion: '10.0.19044',
    timezone: 'UTC',
    allocatedResources: {
      cpuCores: 4, // Number of CPU cores
      memory: { units: 'GB', value: 32 }, // e.g., "32GB"
      storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    },
    // hostname: 'dev-machine',
    // ipAddresses: ['192.168.0.2'],
    // isVirtualized: false,
  },
  {
    name: 'ubuntu.22.04',
    version: '22.04',
    architecture: 'x64',
    kernelVersion: '5.15.0-79-generic',
    distribution: 'Ubuntu',
    timezone: 'Africa/Nairobi',
    allocatedResources: {
      cpuCores: 4, // Number of CPU cores
      memory: { units: 'GB', value: 32 }, // e.g., "32GB"
      storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    },
    // hostname: 'prod-server',
    // ipAddresses: ['192.168.1.10'],
    // isVirtualized: true,
    // virtualMachineType: 'KVM',
  },
  {
    name: 'macOS',
    version: '13.2',
    architecture: 'ARM64',
    kernelVersion: 'Darwin 22.3.0',
    timezone: 'America/New_York',
    allocatedResources: {
      cpuCores: 4, // Number of CPU cores
      memory: { units: 'GB', value: 32 }, // e.g., "32GB"
      storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    },
    // hostname: 'mac-dev',
    // ipAddresses: ['10.0.0.5'],
    // isVirtualized: false,
  },
  {
    name: 'CentOS',
    version: '7',
    architecture: 'x64',
    kernelVersion: '3.10.0-1160.92.1.el7.x86_64',
    distribution: 'CentOS',
    timezone: 'Asia/Kolkata',
    allocatedResources: {
      cpuCores: 4, // Number of CPU cores
      memory: { units: 'GB', value: 32 }, // e.g., "32GB"
      storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    },
    // ipAddresses: ['10.1.1.15'],
    // isVirtualized: true,
    // virtualMachineType: 'VMware',
  },
];

export const defaultOs: OperatingSystemDescriptor = {
  name: 'Unknown',
  version: '0.0',
  architecture: 'x64',
  timezone: 'UTC',
  allocatedResources: {
    cpuCores: 4, // Number of CPU cores
    memory: { units: 'GB', value: 32 }, // e.g., "32GB"
    storage: { units: 'TB', value: 1 }, // e.g., "1TB"
  },
  // hostname: 'unknown',
  // ipAddresses: [],
  // isVirtualized: false,
};

export function getOsByName(
  name: string,
  osStore: OperatingSystemDescriptor[],
): OperatingSystemDescriptor {
  return osStore.find((os) => os.name === name) || defaultOs;
}
