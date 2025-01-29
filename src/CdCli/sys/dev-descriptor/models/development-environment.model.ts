import type { CiCdDescriptor } from '../../dev-descriptor/models/cicd-descriptor.model';
import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import type { ServiceDescriptor } from './service-provider.model';
import type { VersionControlDescriptor } from './version-control';
import type { WorkstationDescriptor } from './workstations.model';

export interface DevelopmentEnvironmentDescriptor {
  workstation: WorkstationDescriptor; // getWorkstationByName('emp-12', workstations)
  dependencies?: DependencyDescriptor[]; // Harmonized type for dependencies // getDependencyByName(['angular', 'npm',],resources: dependencies)
  services?: ServiceDescriptor[]; // , // getServiceByName(['repo', 'mysql', 'push-service'], services)
  environmentVariables?: Record<string, string>; // Key-value pairs of environment variables
  ciCd: CiCdDescriptor[]; // Coninous Integration / Continous Delivery // getCiCd(["CircleCI - Test and Deploy", "Nonexistent Pipeline"], knownCiCds)
  testingFrameworks?: string[]; // Testing frameworks used (e.g., "Jest", "Mocha") // getTestingFramework(["Mocha", "Nonexistent Framework"], knownTestingFrameworks)
  versionControl?: VersionControlDescriptor;
}
