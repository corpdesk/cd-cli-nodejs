import type { ICdRequest } from '../../base/IBase';
import type { CiCdDescriptor } from '../../dev-descriptor/models/cicd-descriptor.model';
import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import type { MigrationDescriptor } from './migration-descriptor.model';
import type { ServiceDescriptor } from './service-provider.model';
import type { VersionControlDescriptor } from './version-control';
import type { WorkstationDescriptor } from './workstations.model';

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
