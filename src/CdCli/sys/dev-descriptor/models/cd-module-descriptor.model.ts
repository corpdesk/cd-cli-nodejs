import type { CdServiceDescriptor } from './/cd-service-descriptor.model';
import type { EnvironmentDescriptor } from './/environment.model';
import type { LanguageDescriptor } from './/language.model';
import type { CdModelDescriptor } from './cd-model-descriptor.model';
// import type {
//   // CdServiceDescriptor,
//   LicenseDescriptor,
// } from './/service-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model';
import type { CdControllerDescriptor } from './cd-controller-descriptor.model';
import type { CiCdDescriptor } from './cicd-descriptor.model';
import type {
  ContributorDescriptor,
  VersionControlDescriptor,
} from './version-control.model';
import { LicenseDescriptor } from './license.model';

export interface CdModuleDescriptor extends BaseDescriptor {
  name: string;
  cdModuleType: CdModuleTypeDescriptor | string; // Type of module, e.g., frontend, api, etc.
  description: string;
  ctx: CdCtx | string;
  projectGuid: string;
  parentProjectGuid?: string;
  language?: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  license?: LicenseDescriptor; // License details // getLicenseByName(name: string,licenses: LicenseDescriptor[],)
  contributors?: ContributorDescriptor; // Vendors, developers, and communities // getContributorsByNames(names: string[],contributors: ContributorDescriptor,)
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
    | 'cd-frontend'
    | 'cd-api'
    | 'cd-push-server'
    | 'cd-cli'
    | 'pwa'
    | 'mobile'
    | 'mechatronic'
    | 'desktop'
    | 'microservice'
    | 'vs-code-extension'
    | 'web-application'
    | 'web-component'
    | 'web-service'
    | 'web-component-library'
    | 'unknown';
}

export enum CdCtx {
  Sys = 'sys', // System module
  App = 'app', // Optional module
}
