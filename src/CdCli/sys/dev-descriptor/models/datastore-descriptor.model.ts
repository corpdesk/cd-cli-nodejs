/* eslint-disable style/indent */
import type { DevelopmentEnvironmentDescriptor } from './/development-environment.model';
import type { RuntimeEnvironmentDescriptor } from './/runtime-environment.model';
// import type { BaseDescriptor } from './app-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model';

// Main Descriptor Interface
export interface DataStoreDescriptor
  extends BaseDescriptor,
    DataStoreTypeDescriptor {
  developmentEnvironment?: DevelopmentEnvironmentDescriptor;
  runtimeEnvironment?: RuntimeEnvironmentDescriptor;

  dataStoreSchema?: DataStoreSchemaDescriptor;
  dataStoreReplicationConfig?: DataStoreReplicationConfig;
  dataStoreBackupConfig?: DataStoreBackupConfig;
  dataStoreFilesConfig?: DataStoreFilesConfig;
  dataStorePerformance?: DataStorePerformance;
  dataStoreMetadata?: DataStoreMetadata;
}

// Data Store Type Descriptor
export interface DataStoreTypeDescriptor {
  type:
    | 'relational'
    | 'nosql'
    | 'object-storage'
    | 'file-system'
    | 'in-memory'
    | 'distributed'; // Type of data store
  version?: string; // Version of the system
}

// Data Store Schema Descriptor
export interface DataStoreSchemaDescriptor {
  database?: string; // Name of the database/schema (for relational databases)
  tableMappings?: Record<string, string>; // Logical to physical table mappings
  collections?: string[]; // Collections (for NoSQL databases)
  buckets?: string[]; // Buckets (for object storage)
}

// Replication Configuration
export interface ReplicaDescriptor {
  host: string; // Host of the replica
  port?: number; // Port of the replica
}

export interface DataStoreReplicationConfig {
  enabled: boolean; // Whether replication is enabled
  type?: 'master-slave' | 'multi-master' | 'sharded' | 'custom'; // Replication type
  replicas?: ReplicaDescriptor[]; // Array of replicas
}

// Backup Configuration
export interface DataStoreBackupConfig {
  enabled: boolean; // Whether backups are enabled
  schedule?: string; // Cron-like backup schedule
  retention?: string; // Retention policy
  location?: string; // Backup storage location
}

// File Storage Configuration
export interface DataStoreFilesConfig {
  maxSize?: string; // Maximum storage size
  autoScaling?: boolean; // Whether storage auto-scales
  storageClass?: 'standard' | 'reduced-redundancy' | 'archive'; // Storage class
}

// Performance Configuration
export interface CacheConfig {
  enabled: boolean; // Whether caching is enabled
  type?: 'in-memory' | 'distributed'; // Cache type
  size?: string; // Cache size
}

export interface IndexingConfig {
  enabled: boolean; // Whether indexing is enabled
  fields?: string[]; // Indexed fields
}

export interface DataStorePerformance {
  maxConnections?: number; // Max connections allowed
  cache?: CacheConfig; // Caching configuration
  indexing?: IndexingConfig; // Indexing configuration
}

// Metadata Configuration
export interface DataStoreMetadata {
  description?: string; // Description of the data store
  owner?: string; // Owner or administrator
  tags?: string[]; // Tags for categorization
  createdAt?: string; // Creation timestamp
  lastModified?: string; // Last modification timestamp
}
