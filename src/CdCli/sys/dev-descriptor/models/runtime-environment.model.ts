import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import type { ServiceDescriptor } from './service-provider.model';
import type {
  OperatingSystemDescriptor,
  WorkstationDescriptor,
} from './workstations.model';

export interface RuntimeEnvironmentDescriptor {
  os: OperatingSystemDescriptor; // getOsByName(name: string,osStore: OperatingSystemDescriptor[],)
  dependencies?: DependencyDescriptor[]; // getDependencyByName(names: string[],resources: DependencyDescriptor[],)
  services: ServiceDescriptor[]; // getServiceByName(names: string[],resources: ServiceDescriptor[],)
  sites: WorkstationDescriptor[]; // getWorkstationByName(name: string,ws: WorkstationDescriptor[],)
}
