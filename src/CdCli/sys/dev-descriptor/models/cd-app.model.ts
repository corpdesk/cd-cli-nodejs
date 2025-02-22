import type { CdRequest, ICdRequest } from '../../base/IBase';
import type { BaseDescriptor } from './base-descriptor.model';
import type { CdModuleDescriptor } from './cd-module-descriptor.model';
import type { CiCdDescriptor } from './cicd-descriptor.model';
import type { EnvironmentDescriptor } from './environment.model';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';
// import type { CdModuleDescriptor } from './cd-module-descriptor.model';
// import type { EnvironmentDescriptor } from './environment.model';

// export interface CdAppDescriptor {
//   $schema?: string; // Optional schema URL for future use. For now versioning will be managed by the host package.json of cd-cli
//   name: string; // Name of the application
//   typeName: AppType | AppType[];
//   projectGuid?: string;
//   parentProjectGuid: string;
//   modules: CdModuleDescriptor[]; // Array of module descriptors
//   environment?: EnvironmentDescriptor; // Development environment settings
//   productionEnvironment?: EnvironmentDescriptor; // Production environment settings
//   cdCi?: CiCdDescriptor; // Coninous Integration / Continous Delivery // getCiCd(names: string[],cIcDs: CiCdDescriptor[],)
// }

// CdAppDescriptor<T = BaseDescriptor> extends CdDescriptor
export interface CdAppDescriptor<T extends BaseDescriptor = BaseDescriptor> {
  $schema?: string;
  name: string;
  projectGuid?: string;
  parentProjectGuid: string;
  modules: CdModuleDescriptor[];
  environment?: EnvironmentDescriptor;
  productionEnvironment?: EnvironmentDescriptor;
  cdCi?: CiCdDescriptor;
  appDetails: T; // Dynamic linking to app type descriptor
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

export interface AppFrontendDescriptor extends BaseDescriptor {
  backendApp: { name: string; networkAddress: string }; // Defines the backend it connects to
  authenticationMethod?: string; // OAuth, JWT, SSO, etc.
  userInterface?: { framework: string; designSystem?: string }; // UI-related settings
}

export interface AppApiDescriptor extends BaseDescriptor {
  requestProcessing: { protocol: string; rateLimit?: number }; // REST, GraphQL, gRPC, etc.
  security?: { authentication: string; authorization?: string }; // e.g., JWT, OAuth
  dataSources: { database?: string; cache?: string; messageQueue?: string[] }; // Dependencies
  externalServices?: string[]; // APIs the backend depends on
}

export interface AppPushServerDescriptor extends CdAppDescriptor {
  pushProvider: string; // Firebase, OneSignal, etc.
  supportedPlatforms: string[]; // iOS, Android, Web
  messageFormat?: string; // FCM, APNs, MQTT
  retryMechanism?: boolean; // Whether it retries on failure
}

export interface AppCliDescriptor extends CdAppDescriptor {
  commands: string[]; // List of CLI commands
  inputHandling?: 'interactive' | 'scripted'; // Mode of operation
  outputFormat?: 'json' | 'yaml' | 'text'; // Output format support
}

export interface AppPwaDescriptor extends CdAppDescriptor {
  offlineSupport?: boolean; // Service worker usage
  storageMechanism?: string; // IndexedDB, LocalStorage
  installability?: boolean; // Whether it supports installation
}

export interface AppDesktopPwaDescriptor extends AppPwaDescriptor {
  systemIntegration?: string[]; // File system, Notifications, etc.
  autoUpdateSupport?: boolean; // Whether it can update automatically
}

export interface AppMobileDescriptor extends CdAppDescriptor {
  appStore: { platform: string; storeName?: string }; // Google Play, App Store
  notificationService?: string; // FCM, APNs, OneSignal
}

export interface AppMobileHybridDescriptor extends AppMobileDescriptor {
  hybridFramework?: string; // Ionic, Flutter, React Native
  webViewSupport?: boolean; // Whether it uses WebView for rendering
}

export interface AppMobileNativeDescriptor extends AppMobileDescriptor {
  nativeSdk?: string; // Swift, Kotlin, Objective-C
  deviceCapabilities?: string[]; // GPS, Camera, NFC, etc.
}

export interface AppDesktopDescriptor extends CdAppDescriptor {
  osSupport: string[]; // Windows, macOS, Linux
  nativeFeatures?: string[]; // File system, Bluetooth, USB, etc.
  distributionMethod?: string; // App Store, Standalone Installer
}

export interface AppIotDescriptor extends CdAppDescriptor {
  connectivity: string[]; // MQTT, LoRa, Bluetooth, etc.
  hardwareSupport: { board: string; chip: string }; // e.g., Raspberry Pi, ESP32
  powerSource?: 'battery' | 'mains' | 'solar'; // Power constraints
}

export interface AppGameDescriptor extends CdAppDescriptor {
  gameEngine: string; // Unity, Unreal, Godot
  multiplayerSupport?: boolean; // Whether it supports online play
  physicsEngine?: string; // Havok, PhysX, Bullet
  targetPlatform: string[]; // PC, Console, Mobile
}

export interface AppEmbeddedDescriptor extends CdAppDescriptor {
  realTimeOs?: string; // FreeRTOS, Zephyr
  hardwareConstraints?: { ram: string; storage: string }; // Memory and storage limitations
  connectivity?: string[]; // UART, I2C, SPI
}

export interface AppRoboticsDescriptor extends CdAppDescriptor {
  roboticsFramework: string; // ROS, OpenCV
  controlMethod?: 'autonomous' | 'remote-controlled'; // Mode of operation
  supportedHardware: string[]; // Arduino, Jetson Nano, etc.
}

export interface AppPluginDescriptor extends CdAppDescriptor {
  compatibleSoftware: string[]; // VSCode, Photoshop, Figma
  integrationType?: 'UI' | 'Middleware' | 'API Hook' | 'unknown'; // How it integrates
}

export interface AppMicroserviceDescriptor extends CdAppDescriptor {
  interServiceCommunication?: 'REST' | 'gRPC' | 'Message Queue' | 'unknown'; // How it talks to other services
  scalingMethod?: 'Kubernetes' | 'Serverless'; // How it scales
  dependencies?: { databases?: string[]; messageQueues?: string[] }; // Services it relies on
}
