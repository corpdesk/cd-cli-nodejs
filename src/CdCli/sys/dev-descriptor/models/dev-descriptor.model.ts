import { CdObjModel } from '../../moduleman/models/cd-obj.model';
import type { BaseDescriptor } from './base-descriptor.model';

export interface CdDescriptor extends CdObjModel {
  jDetails?: TypeDescriptor[];
}

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

/**
 * Utility function to convert CdDescriptor into CdObjModel
 */
export function mapDescriptorToCdObj(descriptor: CdDescriptor): CdObjModel {
  console.log('DevDescriptorModel::mapDescriptorToCdObj()/starting...');
  const cdObj = new CdObjModel();
  cdObj.cdObjId = descriptor.cdObjId;
  cdObj.cdObjName = descriptor.cdObjName;
  cdObj.cdObjGuid = descriptor.cdObjGuid;
  cdObj.jDetails = descriptor.jDetails
    ? JSON.stringify(descriptor.jDetails)
    : null;
  return cdObj;
}
