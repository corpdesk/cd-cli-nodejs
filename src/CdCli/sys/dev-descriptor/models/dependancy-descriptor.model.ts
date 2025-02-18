/* eslint-disable style/indent */
// import type { DependencyDescriptor } from './app-descriptor.model';

import type { SecurityDescriptor } from './/service-descriptor.model';
import type {
  FileReference,
  WorkstationAccessDescriptor,
} from './/workstations.model';
import type { BaseDescriptor } from './base-descriptor.model';
import type { VersionControlDescriptor } from './version-control.model';

export interface DependencyDescriptor
  extends BaseDescriptor,
    DependencyCategoryDescriptor,
    DependencyTypeDescriptor,
    DependencySourceDescriptor,
    DependencyScopeDescriptor {
  resolution?: ResolutionDescriptor;
  usage?: UsageDescriptor;
  installCommand?: string;
  dependencyConfig?: DependencyConfigDescriptor[];
  platformCompatibility?: PlatformCompatibilityDescriptor;
  dependencyLifecycle?: DependencyLifecycleDescriptor;
  dependancyConflicts?: DependencyConflictDescriptor[];
  security?: SecurityDescriptor;
  dependencyMetadata?: DependencyMetadataDescriptor;
  dependencyFileReferences?: FileReference[]; // Associated file references
  dependancyRepository?: VersionControlDescriptor;
}

// Dependency Category Descriptor
export interface DependencyCategoryDescriptor {
  category: 'library' | 'tool' | 'framework' | 'header' | 'core' | 'custom'; // Categorization
}

// Dependency Type Descriptor
export interface DependencyTypeDescriptor {
  type: 'runtime' | 'development' | 'peer' | 'optional'; // Usage type
}

// Dependency Source Descriptor
export interface DependencySourceDescriptor {
  source:
    | 'npm'
    | 'cdn'
    | 'local'
    | 'custom'
    | 'external'
    | 'system'
    | 'repository'; // Origin or source of the dependency
}

// Dependency Scope Descriptor
export interface DependencyScopeDescriptor {
  scope: 'global' | 'module' | 'local'; // Scope of the dependency
}

// Resolution Descriptor
export interface ResolutionDescriptor {
  method:
    | 'import'
    | 'require'
    | 'include'
    | 'header'
    | 'new'
    | 'DI'
    | 'cli'
    | 'other'; // How the dependency is resolved
  path?: string; // Path to the dependency
  alias?: string; // Alias name for the dependency
}

// Usage Descriptor
export interface UsageDescriptor {
  context?:
    | 'service'
    | 'controller'
    | 'model'
    | 'utility'
    | 'api'
    | 'cli'
    | 'test'
    | 'editor'
    | 'core'
    | 'version-control'
    | 'other'; // Context where the dependency is used
  functionsUsed?: string[]; // Functions used from the dependency
  classesUsed?: string[]; // Classes instantiated
  modulesUsed?: string[]; // Modules used
}

// Dependency Configuration Descriptor
export interface DependencyConfigDescriptor {
  environmentVariables?: Record<string, string>; // Environment variables required
  customSettings?: Record<string, any>; // Custom configuration settings
}

// Platform Compatibility Descriptor
export interface PlatformCompatibilityDescriptor {
  languages?: string[]; // Supported programming languages
  os?: string[]; // Supported operating systems
  architectures?: string[]; // Supported architectures
}

// Lifecycle Descriptor
export interface DependencyLifecycleDescriptor {
  loadTime: 'startup' | 'lazy' | 'manual'; // When the dependency is loaded
  updates: 'manual' | 'automatic'; // Update management
}

// Conflict Descriptor
export interface DependencyConflictDescriptor {
  with: string; // Conflicting dependency
  resolutionStrategy?: 'override' | 'merge' | 'exclude'; // Conflict resolution strategy
}

// Metadata Descriptor
export interface DependencyMetadataDescriptor {
  description?: string; // Description of the dependency
  repository?: string; // URL to repository
  license?: string; // Licensing information
  documentationUrl?: string; // Documentation URL
}

export const dependencies: DependencyDescriptor[] = [
  {
    name: 'express',
    version: '^4.18.1',
    category: 'library',
    type: 'runtime',
    source: 'npm',
    scope: 'module',
    resolution: {
      method: 'require',
      path: 'node_modules/express',
      alias: 'express',
    },
    usage: {
      context: 'api',
      functionsUsed: ['Router', 'json', 'urlencoded'],
    },
    // workstationAccess: {
    //   accessScope: 'local',
    //   physicalAccess: 'direct',
    //   // transport: { protocol: 'ssh', credentials: {} }, // transport is not necessary, accessing machine directly
    //   interactionType: 'cli',
    // },
    platformCompatibility: {
      languages: ['Node.js'],
      os: ['Linux', 'Windows', 'macOS'],
      architectures: ['x86_64', 'arm64'],
    },
    dependencyLifecycle: {
      loadTime: 'startup',
      updates: 'manual',
    },
    security: {
      isSecure: true,
      vulnerabilities: [],
    },
    dependencyMetadata: {
      description: 'Fast, unopinionated, minimalist web framework for Node.js',
      repository: 'https://github.com/expressjs/express',
      license: 'MIT',
      documentationUrl: 'https://expressjs.com/',
    },
  },
  {
    name: 'webpack',
    version: '5.75.0',
    category: 'tool',
    type: 'development',
    source: 'npm',
    scope: 'global',
    resolution: {
      method: 'cli',
    },
    usage: {
      context: 'utility',
      functionsUsed: ['bundle', 'watch'],
    },
    platformCompatibility: {
      languages: ['Node.js', 'JavaScript'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    dependencyLifecycle: {
      loadTime: 'manual',
      updates: 'automatic',
    },
    security: {
      isSecure: true,
      vulnerabilities: [],
    },
    dependencyMetadata: {
      description:
        'A static module bundler for modern JavaScript applications.',
      repository: 'https://github.com/webpack/webpack',
      license: 'MIT',
      documentationUrl: 'https://webpack.js.org/',
    },
  },
  {
    name: 'stdio.h',
    version: 'default for headers',
    category: 'header',
    type: 'runtime',
    source: 'system',
    scope: 'local',
    resolution: {
      method: 'header',
      path: '/usr/include/stdio.h',
    },
    usage: {
      context: 'utility',
      functionsUsed: ['printf', 'scanf'],
    },
    platformCompatibility: {
      languages: ['C'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    dependencyLifecycle: {
      loadTime: 'startup',
      updates: 'manual',
    },
    security: {
      isSecure: true,
    },
    dependencyMetadata: {
      description: 'Standard Input/Output library for C programming.',
      license: 'Standard C Library',
    },
  },
  {
    name: 'React',
    version: '^18.2.0',
    category: 'framework',
    type: 'runtime',
    source: 'cdn',
    scope: 'module',
    resolution: {
      method: 'import',
      alias: 'React',
    },
    usage: {
      context: 'controller',
      functionsUsed: ['useState', 'useEffect'],
      modulesUsed: ['ReactDOM', 'React'],
    },
    platformCompatibility: {
      languages: ['JavaScript', 'TypeScript'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    dependencyLifecycle: {
      loadTime: 'lazy',
      updates: 'automatic',
    },
    security: {
      isSecure: true,
    },
    dependencyMetadata: {
      description: 'A JavaScript library for building user interfaces.',
      repository: 'https://github.com/facebook/react',
      license: 'MIT',
      documentationUrl: 'https://reactjs.org/',
    },
  },
  {
    name: 'pytest',
    version: '^7.2.0',
    category: 'tool',
    type: 'development',
    source: 'external',
    scope: 'module',
    resolution: {
      method: 'cli',
    },
    usage: {
      context: 'test',
    },
    platformCompatibility: {
      languages: ['Python'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    dependencyLifecycle: {
      loadTime: 'manual',
      updates: 'manual',
    },
    security: {
      isSecure: true,
    },
    dependencyMetadata: {
      description: 'A framework for writing and running Python tests.',
      repository: 'https://github.com/pytest-dev/pytest',
      license: 'MIT',
      documentationUrl: 'https://docs.pytest.org/',
    },
  },
  {
    name: 'NVIDIA CUDA Toolkit',
    version: '12.1',
    category: 'core',
    type: 'runtime',
    source: 'system',
    scope: 'global',
    resolution: {
      method: 'cli',
    },
    usage: {
      context: 'core',
    },
    platformCompatibility: {
      languages: ['C++', 'Python'],
      os: ['Linux', 'Windows'],
      architectures: ['x86_64'],
    },
    dependencyLifecycle: {
      loadTime: 'startup',
      updates: 'manual',
    },
    security: {
      isSecure: true,
    },
    dependencyMetadata: {
      description: 'Development toolkit for GPU-accelerated applications.',
      repository: 'https://developer.nvidia.com/cuda-toolkit',
      license: 'Proprietary',
      documentationUrl: 'https://docs.nvidia.com/cuda/',
    },
  },
];

export const defaultDependency: DependencyDescriptor = {
  name: 'Unknown',
  version: 'N/A',
  category: 'custom',
  type: 'runtime',
  source: 'custom',
  scope: 'local',
  resolution: {
    method: 'other',
  },
  usage: {
    context: 'other',
  },
  platformCompatibility: {
    languages: [],
    os: [],
    architectures: [],
  },
  dependencyLifecycle: {
    loadTime: 'manual',
    updates: 'manual',
  },
  security: {
    isSecure: false,
  },
  dependencyMetadata: {
    description: 'No metadata available.',
  },
};

export function getDependencyByName(
  names: string[],
  resources: DependencyDescriptor[],
): DependencyDescriptor[] {
  const foundDependencies = names
    .map((name) => resources.find((dependency) => dependency.name === name))
    .filter((dependency): dependency is DependencyDescriptor => !!dependency); // Filter out undefined

  const missingCount = names.length - foundDependencies.length;

  // Include defaultDependency only once if there are missing items
  if (missingCount > 0) {
    return [...foundDependencies, defaultDependency];
  }

  return foundDependencies;
}
