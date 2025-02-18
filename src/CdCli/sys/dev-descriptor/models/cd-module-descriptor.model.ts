import type { CdServiceDescriptor } from './/cd-service-descriptor.model';
import type { DevelopmentEnvironmentDescriptor } from './/development-environment.model';
import type { LanguageDescriptor } from './/language.model';
import type { CdModelDescriptor } from './/model-descriptor.model';
import type { RuntimeEnvironmentDescriptor } from './/runtime-environment.model';
import type {
  // CdServiceDescriptor,
  LicenseDescriptor,
} from './/service-descriptor.model';
import type { CdControllerDescriptor } from './cd-controller-descriptor.model';
import type { CiCdDescriptor } from './cicd-descriptor.model';
import type {
  ContributorDescriptor,
  VersionControlDescriptor,
} from './version-control.model';

export interface CdModuleDescriptor {
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
  developmentEnvironment?: DevelopmentEnvironmentDescriptor; // Development environment settings
  runtimeEnvironment?: RuntimeEnvironmentDescriptor; // Runtime environment settings
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
    | 'mechatronic';
}

export enum CdCtx {
  Sys = 'system-module', // System module
  App = 'app-module', // Optional module
}
