import type { CdServiceDescriptor } from './/cd-service-descriptor.model';
import type { EnvironmentDescriptor } from './/environment.model';
import type { LanguageDescriptor } from './/language.model';
import type { CdModelDescriptor } from './/model-descriptor.model';
import type {
  // CdServiceDescriptor,
  LicenseDescriptor,
} from './/service-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model';
import type { CdControllerDescriptor } from './cd-controller-descriptor.model';
import type { CiCdDescriptor } from './cicd-descriptor.model';
import type {
  ContributorDescriptor,
  VersionControlDescriptor,
} from './version-control.model';

export interface CdModuleDescriptor extends BaseDescriptor {
  name: string;
  description: string;
  ctx: CdCtx;
  projectGuid: string;
  parentProjectGuid?: string;
  language: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  license: LicenseDescriptor; // License details // getLicenseByName(name: string,licenses: LicenseDescriptor[],)
  contributors: ContributorDescriptor; // Vendors, developers, and communities // getContributorsByNames(names: string[],contributors: ContributorDescriptor,)
  controllers: CdControllerDescriptor[]; // List of controllers
  models: CdModelDescriptor[]; // List of models
  services: CdServiceDescriptor[]; // List of services
  environment?: EnvironmentDescriptor; // Development environment settings
  productionEnvironment?: EnvironmentDescriptor; // Production environment settings
  cdCi?: CiCdDescriptor; // Continuous Integration/Continuous Delivery
  versionControl?: VersionControlDescriptor; // Version control details
}

export interface CdModuleTypeDescriptor {
  typeName:
    | 'frontend'
    | 'api'
    | 'push-server'
    | 'cli'
    | 'pwa'
    | 'mobile'
    | 'mechatronic'
    | 'unknown';
}

export enum CdCtx {
  Sys = 'system-module', // System module
  App = 'app-module', // Optional module
}
