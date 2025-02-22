import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model';
import type { BaseServiceDescriptor } from './service-descriptor.model';
import type {
  OperatingSystemDescriptor,
  WorkstationDescriptor,
} from './workstations.model';

export interface RuntimeEnvironmentDescriptor extends BaseDescriptor {
  os: OperatingSystemDescriptor; // getOsByName(name: string,osStore: OperatingSystemDescriptor[],)
  dependencies?: DependencyDescriptor[]; // getDependencyByName(names: string[],resources: DependencyDescriptor[],)
  services: BaseServiceDescriptor[]; // getServiceByName(names: string[],resources: ServiceDescriptor[],)
  sites: WorkstationDescriptor[]; // getWorkstationByName(name: string,ws: WorkstationDescriptor[],)
}
