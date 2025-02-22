import type { BaseDescriptor } from './base-descriptor.model';

export interface TypeDescriptor extends BaseDescriptor {
  field: string;
  optional: boolean;
  typeDetails: TypeDetails;
  description: string;
}

export interface TypeDetails extends BaseDescriptor {
  cdObjId?: number; // reference to the type id in the cd_obj table
  isEnum?: boolean;
  isInterface?: boolean;
  isDescriptor?: boolean;
  isArray?: boolean;
  isPrimitive?: boolean;
  extend?: number;
}

export interface CdDescriptor extends BaseDescriptor {
  cdObjId: number;
  cdObjName: string;
  cdObjGuid?: string;
  jDetails?: TypeDescriptor[];
}
