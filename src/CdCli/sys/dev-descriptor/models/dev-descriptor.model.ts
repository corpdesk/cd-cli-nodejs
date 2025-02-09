export interface TypeDescriptor {
  field: string;
  optional: boolean;
  typeDetails: TypeDetails;
  description: string;
}

export interface TypeDetails {
  cdObjId?: number; // reference to the type id in the cd_obj table
  isEnum?: boolean;
  isInterface?: boolean;
  isDescriptor?: boolean;
  isArray?: boolean;
  isPrimitive?: boolean;
}

export interface CdDescriptor {
  cdObjId: number;
  cdObjName: string;
  cdObjGuid?: string;
  jDetails?: TypeDescriptor[];
}
