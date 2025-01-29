import type { FunctionDescriptor } from './/function-descriptor.model';
import type { DependencyDescriptor } from './dependancy-descriptor.model';

export interface CdControllerDescriptor {
  name: string; // The name of the controller
  module: string; // The module to which this controller belongs
  description?: string; // Brief explanation of the controller's purpose
  parent?: string; // Parent controller (if part of a hierarchical structure)
  dependencies?: DependencyDescriptor[]; // Other controllers or services this controller depends on
  actions: FunctionDescriptor[]; // Array of actions represented as FunctionDescriptors
}
