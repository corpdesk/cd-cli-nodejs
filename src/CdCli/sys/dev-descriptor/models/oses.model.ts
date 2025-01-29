import type { OperatingSystemDescriptor } from './workstations.model';

export const operatingSystems: OperatingSystemDescriptor[] = [
  {
    name: 'Windows',
    version: '10',
    architecture: 'x64',
    kernelVersion: '10.0.19044',
    timezone: 'UTC',
    hostname: 'dev-machine',
    ipAddresses: ['192.168.0.2'],
    isVirtualized: false,
  },
  {
    name: 'ubuntu.22.04',
    version: '22.04',
    architecture: 'x64',
    kernelVersion: '5.15.0-79-generic',
    distribution: 'Ubuntu',
    timezone: 'Africa/Nairobi',
    hostname: 'prod-server',
    ipAddresses: ['192.168.1.10'],
    isVirtualized: true,
    virtualMachineType: 'KVM',
  },
  {
    name: 'macOS',
    version: '13.2',
    architecture: 'ARM64',
    kernelVersion: 'Darwin 22.3.0',
    timezone: 'America/New_York',
    hostname: 'mac-dev',
    ipAddresses: ['10.0.0.5'],
    isVirtualized: false,
  },
  {
    name: 'CentOS',
    version: '7',
    architecture: 'x64',
    kernelVersion: '3.10.0-1160.92.1.el7.x86_64',
    distribution: 'CentOS',
    timezone: 'Asia/Kolkata',
    hostname: 'staging-server',
    ipAddresses: ['10.1.1.15'],
    isVirtualized: true,
    virtualMachineType: 'VMware',
  },
];

export const defaultOs: OperatingSystemDescriptor = {
  name: 'Unknown',
  version: '0.0',
  architecture: 'x64',
  timezone: 'UTC',
  hostname: 'unknown',
  ipAddresses: [],
  isVirtualized: false,
};

export function getOsByName(
  name: string,
  osStore: OperatingSystemDescriptor[],
): OperatingSystemDescriptor {
  return osStore.find((os) => os.name === name) || defaultOs;
}
