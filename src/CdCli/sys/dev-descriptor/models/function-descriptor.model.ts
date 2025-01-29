export interface FunctionDescriptor extends BaseFunctionDescriptor {
  scope: ScopeDescriptor; // Access and static information
  parameters?: ParameterDescriptor[]; // Function parameters
  output?: OutputDescriptor; // Return type and description
  typeInfo?: TypeInfoDescriptor; // Generic types information
  behavior?: BehaviorDescriptor; // Behavioral characteristics
  annotations?: AnnotationsDescriptor['annotations']; // Metadata or decorators
  apiInfo?: ApiInfoDescriptor; // API-related information
  documentation?: DocumentationDescriptor; // Documentation details
  miscellaneous?: MiscellaneousDescriptor; // Overloads and tags
}

// Base Descriptor
export interface BaseFunctionDescriptor {
  name: string; // Name of the function/method
  type: 'function' | 'method' | 'constructor' | 'getter' | 'setter'; // Type of the function
  description?: string; // Brief description of the function
}

// Scope Descriptor
export interface ScopeDescriptor {
  visibility: 'public' | 'private' | 'protected' | 'package-private'; // Access level
  static: boolean; // Indicates if the function is static
}

// Parameter Descriptor
export interface ParameterDescriptor {
  name: string; // Parameter name
  type: string; // Data type of the parameter
  optional?: boolean; // Indicates if the parameter is optional
  defaultValue?: any; // Default value of the parameter
}

// Output Descriptor
export interface OutputDescriptor {
  returnType: string; // Data type of the return value
  description?: string; // Explanation of the return value
}

// Type Information Descriptor
export interface TypeInfoDescriptor {
  genericTypes?: string[]; // List of generic types
}

// Behavior Descriptor
export interface BehaviorDescriptor {
  isPure: boolean; // If the function is pure
  isAsync: boolean; // If the function is asynchronous
  throws?: string[]; // List of exceptions or errors the function might throw
}

// Annotations Descriptor
export interface AnnotationsDescriptor {
  annotations?: string[]; // Metadata or decorators
}

// API Information Descriptor
export interface ApiInfoDescriptor {
  route?: string; // API route or URL path for this function
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // HTTP method
  callsService?: string; // Name of the service method this function calls
}

// Documentation Descriptor
export interface DocumentationDescriptor {
  examples?: string[]; // Usage examples
  notes?: string; // Additional notes or caveats
}

// Miscellaneous Descriptor
export interface MiscellaneousDescriptor {
  overload?: FunctionDescriptor[]; // List of alternative function signatures
  tags?: string[]; // Tags or categories
}
