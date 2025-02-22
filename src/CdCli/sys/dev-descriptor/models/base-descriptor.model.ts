// Base Descriptor for General Use
export interface BaseDescriptor {
  name?: string; // Unique identifier
  description?: string;
  context?: string[]; // array of context assigned to a descriptor.
  version?: string;
}
