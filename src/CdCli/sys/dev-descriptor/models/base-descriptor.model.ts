// Base Descriptor for General Use
export interface BaseDescriptor {
  name?: string; // Unique identifier
  description?: string;
  context?: string[]; // array of context assigned to a descriptor to group set associated descriptors and properties.
  // Could be name of application or profile name
  version?: string;
}
