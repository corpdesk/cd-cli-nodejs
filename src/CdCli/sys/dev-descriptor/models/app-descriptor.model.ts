import type { CiCdDescriptor } from './/cicd-descriptor.model';
import type { DevelopmentEnvironmentDescriptor } from './/development-environment.model';
import type { CdModuleDescriptor } from './cd-module-descriptor.model';
// import type { CdModuleDescriptor } from './cd-module-descriptor.model';
import type { RuntimeEnvironmentDescriptor } from './/runtime-environment.model';

export interface CdAppDescriptor {
  $schema?: string; // Optional schema URL for future use. For now versioning will be managed by the host package.json of cd-cli
  name: string; // Name of the application
  typeName: AppType | AppType[];
  projectGuid?: string;
  parentProjectGuid: string;
  modules: CdModuleDescriptor[]; // Array of module descriptors
  developmentEnvironment?: DevelopmentEnvironmentDescriptor; // Development environment settings
  runtimeEnvironment?: RuntimeEnvironmentDescriptor; // Runtime environment settings
  cdCi?: CiCdDescriptor; // Coninous Integration / Continous Delivery // getCiCd(names: string[],cIcDs: CiCdDescriptor[],)
}

export enum AppType {
  Frontend = 'frontend', // User-facing web or app interfaces
  Api = 'api', // Backend APIs
  PushServer = 'push-server', // Services for push notifications
  Cli = 'cli', // Command-line interfaces
  Pwa = 'pwa', // Progressive Web Apps
  DesktopPwa = 'desktop-pwa', // PWAs optimized for desktop
  Mobile = 'mobile', // General mobile apps
  MobileHybrid = 'mobile-hybrid', // Hybrid apps using shared codebases
  MobileNative = 'mobile-native', // Fully native mobile apps
  Desktop = 'desktop', // Desktop applications
  Iot = 'iot', // Internet of Things services/devices
  Game = 'game', // Game applications
  Embedded = 'embedded', // Embedded systems or firmware
  Robotics = 'robotics', // Robotics and mechatronics
  Plugin = 'plugin', // Plugins or extensions
  Microservice = 'microservice', // Small, modular backend services
}
