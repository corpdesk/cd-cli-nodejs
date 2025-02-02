/* eslint-disable brace-style */
/* eslint-disable node/prefer-global/process */
import type { ICdResponse, ISessResp } from '../../base/IBase';
import type {
  CdDescriptors,
  TypeDescriptor,
  TypeDetails,
} from '../models/dev-descriptor.model';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
import config, { loadCdCliConfig } from '@/config';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import ts from 'typescript';
import { HttpService } from '../../base/http.service';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '../../cd-cli/controllers/cd-cli-vault.controller';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';

import { SessonController } from '../../user/controllers/session.controller';
import { DEFAULT_ENVELOPE_LOGIN } from '../../user/models/user.model';
import { DevDescriptorService } from '../services/dev-descriptor.service';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DevDescriptorController {
  svServer = new HttpService();
  svDevDescriptor = new DevDescriptorService();
  ctlSession = new SessonController();
  isDev = false;
  modelsDir = '';
  savedDescriptors: CdDescriptors[] = [];
  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.modelsDir = join(__dirname, '../src/CdCli/sys/dev-descriptor/models');
  }

  async getSrcDescriptors(): Promise<CdDescriptors[]> {
    // new descriptors will need id reference so we pull existing ones from database:
    this.savedDescriptors = await this.fetchSavedDescriptors();
    const srcDescriptors: CdDescriptors[] = [];
    const files = fs
      .readdirSync(this.modelsDir)
      .filter((file) => file.endsWith('.ts'));

    for (const file of files) {
      const filePath = join(this.modelsDir, file);
      const sourceFile = ts.createSourceFile(
        file,
        fs.readFileSync(filePath, 'utf8'),
        ts.ScriptTarget.ESNext,
        true,
      );

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
          const cdObjName = node.name.text;
          const cdObjId = this.getCdObjIdByName(
            cdObjName,
            this.savedDescriptors,
          );

          const jDetails: TypeDescriptor[] = this.extractTypeDetails(
            node,
            // descriptors,
          );
          srcDescriptors.push({ cdObjId, cdObjName, jDetails });
        }
      });
    }
    return srcDescriptors;
  }

  private extractTypeDetails(
    node: ts.InterfaceDeclaration | ts.EnumDeclaration,
    // descriptors: CdDescriptors[],
  ): TypeDescriptor[] {
    const typeDescriptors: TypeDescriptor[] = [];

    if (ts.isInterfaceDeclaration(node)) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.type) {
          const field = member.name.getText();
          const optional = !!member.questionToken;
          const typeDetails = this.mapTypeToDetails(member.type);
          const description = ''; // Placeholder, could be extracted from JSDoc comments

          typeDescriptors.push({ field, optional, typeDetails, description });
        }
      }
    }
    return typeDescriptors;
  }

  private mapTypeToDetails(
    typeNode: ts.TypeNode,
    // descriptors: CdDescriptors[],
  ): TypeDetails {
    const typeDetails: TypeDetails = { cdObjId: -1 }; // Default value

    if (!typeNode) {
      return typeDetails; // Return default if typeNode is undefined
    }

    // Handle array types
    if (ts.isArrayTypeNode(typeNode)) {
      const elementType = typeNode.elementType;
      typeDetails.isArray = true;
      typeDetails.cdObjId = this.getCdObjId(elementType);
    }
    // Handle union types (e.g., AppType | AppType[])
    else if (ts.isUnionTypeNode(typeNode)) {
      for (const subtype of typeNode.types) {
        if (ts.isArrayTypeNode(subtype)) {
          typeDetails.isArray = true;
          typeDetails.cdObjId = this.getCdObjId(subtype.elementType);
        } else {
          typeDetails.cdObjId = this.getCdObjId(subtype);
        }
      }
    }
    // Handle primitive types (number, string, boolean, etc.)
    else if (
      typeNode.kind >= ts.SyntaxKind.FirstKeyword &&
      typeNode.kind <= ts.SyntaxKind.LastKeyword
    ) {
      typeDetails.isPrimitive = true;
      typeDetails.cdObjId = this.getCdObjId(typeNode);
    }

    // Handle interface or descriptor types
    else if (ts.isTypeReferenceNode(typeNode)) {
      const typeName = typeNode.typeName.getText();
      const referencedDescriptor = this.savedDescriptors.find(
        (d) => d.cdObjName === typeName,
      );

      if (referencedDescriptor) {
        typeDetails.cdObjId = referencedDescriptor.cdObjId;
        typeDetails.isInterface = true;
        typeDetails.isDescriptor = true; // If it’s a descriptor type
      }
    }

    return typeDetails;
  }

  private getCdObjId(typeNode: ts.TypeNode): number {
    const typeName = typeNode.getText();
    const descriptor = this.savedDescriptors.find(
      (d) => d.cdObjName === typeName,
    );
    return descriptor ? descriptor.cdObjId : -1;
  }

  // generateObjectId
  getCdObjIdByName(name: string, descriptors: CdDescriptors[]): number {
    const found = descriptors.find((desc) => desc.cdObjName === name);
    return found ? found.cdObjId : -1;
  }

  async showSrcDescriptors(options?: { json?: boolean; pretty?: boolean }) {
    const srcDescriptors = await this.getSrcDescriptors();

    if (options?.json) {
      // Handle JSON output
      if (options.pretty) {
        console.log(JSON.stringify(srcDescriptors, null, 2)); // Pretty-print JSON
      } else {
        console.log(JSON.stringify(srcDescriptors)); // Compact JSON
      }
      return;
    }

    // Default: Tabular output
    const table = new Table({
      head: [chalk.blue('ID'), chalk.blue('Name'), chalk.blue('GUID')],
      colWidths: [10, 30, 40],
    });

    srcDescriptors.forEach((desc) => {
      table.push([desc.cdObjId, desc.cdObjName, desc.cdObjGuid || 'N/A']);
    });

    console.log(table.toString());
  }

  async fetchSavedDescriptors(): Promise<CdDescriptors[]> {
    // try {
    //   // Load the configuration file
    //   const cdCliConfig = loadCdCliConfig();

    //   // Find the profile named config.cdApiLocal
    //   const profile = cdCliConfig.items.find(
    //     (item: any) => item.cdCliProfileName === config.cdApiLocal,
    //   );

    //   CdLogg.debug('UserController::auth()/profile:', profile);

    //   if (!profile || !profile.cdCliProfileData?.details?.consumerToken) {
    //     throw new Error(
    //       `Profile config.cdApiLocal with 'consumerToken' not found in configuration.`,
    //     );
    //   }

    //   // Handle deferred value in consumerToken
    //   let consumerGuid = profile.cdCliProfileData.details.consumerToken;
    //   CdLogg.debug('UserController::auth()/consumerGuid:', {
    //     ct: consumerGuid,
    //   });

    //   if (
    //     typeof consumerGuid === 'string' &&
    //     consumerGuid.startsWith('#cdVault[')
    //   ) {
    //     const vaultName = consumerGuid.match(/#cdVault\['(.+?)'\]/)?.[1];
    //     if (!vaultName) {
    //       throw new Error(
    //         `Invalid cdVault reference in consumerToken: ${consumerGuid}`,
    //       );
    //     }

    //     // Find the matching cdVault item
    //     const cdVaultItem = profile.cdCliProfileData.cdVault?.find(
    //       (vault: any) => vault.name === vaultName,
    //     );

    //     CdLogg.debug('UserController::auth()/cdVaultItem:', cdVaultItem);

    //     if (!cdVaultItem) {
    //       throw new Error(`cdVault item '${vaultName}' not found.`);
    //     }

    //     // Extract value or decrypt if encrypted
    //     if (cdVaultItem.isEncrypted && cdVaultItem.encryptedValue) {
    //       consumerGuid = CdCliVaultController.getSensitiveData(cdVaultItem);
    //     } else {
    //       consumerGuid = cdVaultItem.value;
    //     }

    //     if (!consumerGuid) {
    //       throw new Error(
    //         `ConsumerToken could not be resolved for '${vaultName}'.`,
    //       );
    //     }
    //   }

    //   // Prompt for password if not provided
    //   if (!password) {
    //     const answers = await inquirer.prompt([
    //       {
    //         type: 'password',
    //         name: 'password',
    //         message: 'Please enter your password:',
    //         mask: '*',
    //       },
    //     ]);
    //     password = answers.password;
    //   }

    //   // Prepare payload using DEFAULT_ENVELOPE_LOGIN
    //   const payload = { ...DEFAULT_ENVELOPE_LOGIN };
    //   payload.dat.f_vals[0].data.userName = userName;
    //   payload.dat.f_vals[0].data.password = password;
    //   payload.dat.f_vals[0].data.consumerGuid = consumerGuid;

    //   CdLogg.info('Authenticating...');
    //   CdLogg.info('Payload:', payload);

    //   // Initialize HttpService
    //   const httpService = new HttpService(true); // Enable debug mode
    //   const baseUrl = await httpService.getCdApiUrl(config.cdApiLocal);

    //   if (baseUrl) {
    //     await httpService.init(baseUrl);
    //     const response: ICdResponse = await httpService.proc2({
    //       method: 'POST',
    //       url: '/',
    //       data: payload,
    //     });

    //     CdLogg.info('Response:', response);

    //     if (response.app_state?.success) {
    //       if (response.app_state?.sess) {
    //         this.ctlSession.saveSession(
    //           response.app_state.sess,
    //           config.cdApiLocal,
    //         );

    //         const cdToken = response.app_state.sess.cd_token;
    //         const profileController = new CdCliProfileController();

    //         if (cdToken) {
    //           await profileController.fetchAndSaveProfiles(cdToken);
    //         } else {
    //           CdLogg.error(
    //             'Could not save profiles due to an invalid session.',
    //           );
    //         }
    //       }
    //     } else {
    //       CdLogg.error(
    //         'Login failed:',
    //         response.app_state?.info || { error: 'Unknown error' },
    //       );
    //       throw new Error(
    //         'Login failed. Please check your credentials and try again.',
    //       );
    //     }
    //   } else {
    //     CdLogg.error('Could not get base url for HTTP connection.');
    //   }
    // } catch (error: any) {
    //   CdLogg.error('Error during login:', error.message);
    // }
    return [
      {
        cdObjId: 92768,
        cdObjName: 'string',
      },
      {
        cdObjId: 92769,
        cdObjName: 'number',
      },
      {
        cdObjId: 92770,
        cdObjName: 'boolean',
      },
      {
        cdObjId: 92771,
        cdObjName: 'undefined',
      },
      {
        cdObjId: 92772,
        cdObjName: 'null',
      },
      {
        cdObjId: 92773,
        cdObjName: 'object',
      },
      {
        cdObjId: 92774,
        cdObjName: 'date',
      },
      {
        cdObjId: 92775,
        cdObjName: 'CdAppDescriptor',
      },
      {
        cdObjId: 92776,
        cdObjName: 'DevelopmentEnvironmentDescriptor',
      },
      {
        cdObjId: 92777,
        cdObjName: 'RuntimeEnvironmentDescriptor',
      },
      {
        cdObjId: 92778,
        cdObjName: 'CiCdDescriptor',
      },
      {
        cdObjId: 92780,
        cdObjName: 'CdModuleDescriptor',
      },
      {
        cdObjId: 92782,
        cdObjName: 'AppType',
      },
      {
        cdObjId: 92786,
        cdObjName: 'LanguageDescriptor',
      },
      {
        cdObjId: 92787,
        cdObjName: 'LicenseDescriptor',
      },
      {
        cdObjId: 92788,
        cdObjName: 'ContributorDescriptor',
      },
      {
        cdObjId: 92789,
        cdObjName: 'CdControllerDescriptor',
      },
      {
        cdObjId: 92790,
        cdObjName: 'CdModelDescriptor',
      },
      {
        cdObjId: 92791,
        cdObjName: 'CdServiceDescriptor',
      },
      {
        cdObjId: 92792,
        cdObjName: 'VersionControlDescriptor',
      },
      {
        cdObjId: 92793,
        cdObjName: 'RepoDescriptor',
      },
      {
        cdObjId: 92794,
        cdObjName: 'WorkstationDescriptor',
      },
      {
        cdObjId: 92795,
        cdObjName: 'CdModuleTypeDescriptor',
      },
      {
        cdObjId: 92796,
        cdObjName: 'FunctionDescriptor',
      },
      {
        cdObjId: 92798,
        cdObjName: 'DependencyDescriptor',
      },
      {
        cdObjId: 92799,
        cdObjName: 'UtilityConfig',
      },
      {
        cdObjId: 92805,
        cdObjName: 'FileReference',
      },
      {
        cdObjId: 92806,
        cdObjName: 'FileStoreDescriptor',
      },
      {
        cdObjId: 92807,
        cdObjName: 'DNSRecord',
      },
      {
        cdObjId: 92808,
        cdObjName: 'FirewallRule',
      },
      {
        cdObjId: 92809,
        cdObjName: 'VolumeMapping',
      },
      {
        cdObjId: 92810,
        cdObjName: 'PortMapping',
      },
      {
        cdObjId: 92811,
        cdObjName: 'CloudConfig',
      },
      {
        cdObjId: 92812,
        cdObjName: 'WebserviceProvisionDescriptor',
      },
      {
        cdObjId: 92813,
        cdObjName: 'AccountCredentials',
      },
      {
        cdObjId: 92814,
        cdObjName: 'ScriptDescriptor',
      },
      {
        cdObjId: 92815,
        cdObjName: 'MigrationStep',
      },
      {
        cdObjId: 92816,
        cdObjName: 'ProviderInstruction',
      },
      {
        cdObjId: 92817,
        cdObjName: 'OperatingSystemDescriptor',
      },
      {
        cdObjId: 92818,
        cdObjName: 'DataStoreDescriptor',
      },
      {
        cdObjId: 92819,
        cdObjName: 'WebServiceDescriptor',
      },
      {
        cdObjId: 92820,
        cdObjName: 'Record',
      },
      {
        cdObjId: 92821,
        cdObjName: 'BaseDescriptor',
      },
      {
        cdObjId: 92822,
        cdObjName: 'CICdPipeline',
      },
      {
        cdObjId: 92823,
        cdObjName: 'CICdTrigger',
      },
      {
        cdObjId: 92824,
        cdObjName: 'CICdEnvironment',
      },
      {
        cdObjId: 92825,
        cdObjName: 'CICdNotification',
      },
      {
        cdObjId: 92826,
        cdObjName: 'CICdNotificationChannel',
      },
      {
        cdObjId: 92827,
        cdObjName: 'CICdMetadata',
      },
      {
        cdObjId: 92828,
        cdObjName: 'CICdTask',
      },
      {
        cdObjId: 92829,
        cdObjName: 'CICdStage',
      },
      {
        cdObjId: 92830,
        cdObjName: 'CICdTriggerConditions',
      },
      {
        cdObjId: 92831,
        cdObjName: 'ContainerManagerDescriptor',
      },
      {
        cdObjId: 92832,
        cdObjName: 'ContainerManagerTypeDescriptor',
      },
      {
        cdObjId: 92833,
        cdObjName: 'ScalingDescriptor',
      },
      {
        cdObjId: 92834,
        cdObjName: 'CliControlsDescriptor',
      },
      {
        cdObjId: 92835,
        cdObjName: 'SecurityDescriptor',
      },
      {
        cdObjId: 92836,
        cdObjName: 'ContainerDescriptor',
      },
      {
        cdObjId: 92837,
        cdObjName: 'ContainerManagementFeaturesDescriptor',
      },
      {
        cdObjId: 92838,
        cdObjName: 'DataStoreTypeDescriptor',
      },
      {
        cdObjId: 92839,
        cdObjName: 'DataStoreSchemaDescriptor',
      },
      {
        cdObjId: 92840,
        cdObjName: 'ReplicaDescriptor',
      },
      {
        cdObjId: 92841,
        cdObjName: 'DataStoreReplicationConfig',
      },
      {
        cdObjId: 92842,
        cdObjName: 'DataStoreBackupConfig',
      },
      {
        cdObjId: 92843,
        cdObjName: 'DataStoreFilesConfig',
      },
      {
        cdObjId: 92844,
        cdObjName: 'CacheConfig',
      },
      {
        cdObjId: 92845,
        cdObjName: 'IndexingConfig',
      },
      {
        cdObjId: 92846,
        cdObjName: 'DataStorePerformance',
      },
      {
        cdObjId: 92847,
        cdObjName: 'DataStoreMetadata',
      },
      {
        cdObjId: 92848,
        cdObjName: 'DependencyCategoryDescriptor',
      },
      {
        cdObjId: 92849,
        cdObjName: 'DependencyTypeDescriptor',
      },
      {
        cdObjId: 92850,
        cdObjName: 'DependencySourceDescriptor',
      },
      {
        cdObjId: 92851,
        cdObjName: 'DependencyScopeDescriptor',
      },
      {
        cdObjId: 92852,
        cdObjName: 'ResolutionDescriptor',
      },
      {
        cdObjId: 92853,
        cdObjName: 'UsageDescriptor',
      },
      {
        cdObjId: 92854,
        cdObjName: 'DependencyConfigDescriptor',
      },
      {
        cdObjId: 92855,
        cdObjName: 'PlatformCompatibilityDescriptor',
      },
      {
        cdObjId: 92856,
        cdObjName: 'DependencyLifecycleDescriptor',
      },
      {
        cdObjId: 92857,
        cdObjName: 'DependencyConflictDescriptor',
      },
      {
        cdObjId: 92858,
        cdObjName: 'DependencyMetadataDescriptor',
      },
      {
        cdObjId: 92859,
        cdObjName: 'BaseFunctionDescriptor',
      },
      {
        cdObjId: 92860,
        cdObjName: 'ScopeDescriptor',
      },
      {
        cdObjId: 92861,
        cdObjName: 'ParameterDescriptor',
      },
      {
        cdObjId: 92862,
        cdObjName: 'OutputDescriptor',
      },
      {
        cdObjId: 92863,
        cdObjName: 'TypeInfoDescriptor',
      },
      {
        cdObjId: 92864,
        cdObjName: 'BehaviorDescriptor',
      },
      {
        cdObjId: 92865,
        cdObjName: 'AnnotationsDescriptor',
      },
      {
        cdObjId: 92866,
        cdObjName: 'ApiInfoDescriptor',
      },
      {
        cdObjId: 92867,
        cdObjName: 'DocumentationDescriptor',
      },
      {
        cdObjId: 92868,
        cdObjName: 'MiscellaneousDescriptor',
      },
      {
        cdObjId: 92869,
        cdObjName: 'LanguageEcosystem',
      },
      {
        cdObjId: 92870,
        cdObjName: 'LanguageParadigms',
      },
      {
        cdObjId: 92871,
        cdObjName: 'LanguageTooling',
      },
      {
        cdObjId: 92872,
        cdObjName: 'LanguageFeatures',
      },
      {
        cdObjId: 92873,
        cdObjName: 'LanguageMiscellaneous',
      },
      {
        cdObjId: 92874,
        cdObjName: 'RelationshipDescriptor',
      },
      {
        cdObjId: 92875,
        cdObjName: 'FieldDescriptor',
      },
      {
        cdObjId: 92876,
        cdObjName: 'OrmMappingDescriptor',
      },
      {
        cdObjId: 92877,
        cdObjName: 'ValidationDescriptor',
      },
      {
        cdObjId: 92878,
        cdObjName: 'OrmOptionsDescriptor',
      },
      {
        cdObjId: 92879,
        cdObjName: 'ServiceDescriptor',
      },
      {
        cdObjId: 92880,
        cdObjName: 'WebServer',
      },
      {
        cdObjId: 92881,
        cdObjName: 'SslConfig',
      },
      {
        cdObjId: 92882,
        cdObjName: 'DomainConfig',
      },
      {
        cdObjId: 92883,
        cdObjName: 'ServiceProviderDescriptor',
      },
      {
        cdObjId: 92884,
        cdObjName: 'DataCenterLocation',
      },
      {
        cdObjId: 92885,
        cdObjName: 'ProviderMetadata',
      },
      {
        cdObjId: 92886,
        cdObjName: 'UsageMetrics',
      },
      {
        cdObjId: 92887,
        cdObjName: 'MetricsQuantity',
      },
      {
        cdObjId: 92888,
        cdObjName: 'TestingFrameworkDescriptor',
      },
      {
        cdObjId: 92889,
        cdObjName: 'TestingFeatures',
      },
      {
        cdObjId: 92890,
        cdObjName: 'VersionControlCommit',
      },
      {
        cdObjId: 92891,
        cdObjName: 'BranchProtectionRules',
      },
      {
        cdObjId: 92892,
        cdObjName: 'VersionControlBranch',
      },
      {
        cdObjId: 92893,
        cdObjName: 'WorkflowPolicies',
      },
      {
        cdObjId: 92894,
        cdObjName: 'VersionControlWorkflow',
      },
      {
        cdObjId: 92895,
        cdObjName: 'SourceContributor',
      },
      {
        cdObjId: 92896,
        cdObjName: 'VersionControlTag',
      },
      {
        cdObjId: 92897,
        cdObjName: 'VersionControlMetadata',
      },
      {
        cdObjId: 92898,
        cdObjName: 'DeveloperDescriptor',
      },
      {
        cdObjId: 92899,
        cdObjName: 'CommunityDescriptor',
      },
      {
        cdObjId: 92900,
        cdObjName: 'NetworkConfig',
      },
      {
        cdObjId: 92901,
        cdObjName: 'HardwareSpecs',
      },
      {
        cdObjId: 92902,
        cdObjName: 'SshCredentials',
      },
      {
        cdObjId: 92903,
        cdObjName: 'OperatingSystemPermissionDescriptor',
      },
      {
        cdObjId: 92904,
        cdObjName: 'ConditionDescriptor',
      },
      {
        cdObjId: 92905,
        cdObjName: 'AuditDescriptor',
      },
      {
        cdObjId: 92906,
        cdObjName: 'AccessControlDescriptor',
      },
      {
        cdObjId: 92907,
        cdObjName: 'RoleDescriptor',
      },
      {
        cdObjId: 92908,
        cdObjName: 'PermissionDescriptor',
      },
      {
        cdObjId: 92909,
        cdObjName: 'FileStorageCapacity',
      },
      {
        cdObjId: 92910,
        cdObjName: 'FileStorageLocation',
      },
      {
        cdObjId: 92911,
        cdObjName: 'FileStorageAccess',
      },
      {
        cdObjId: 92912,
        cdObjName: 'FileStorageRedundancy',
      },
      {
        cdObjId: 92913,
        cdObjName: 'FileStorageEncryption',
      },
      {
        cdObjId: 92914,
        cdObjName: 'TypeDescriptor',
      },
      {
        cdObjId: 92915,
        cdObjName: 'TypeDetails',
      },
      {
        cdObjId: 92916,
        cdObjName: 'CdDescriptors',
      },
      {
        cdObjId: 92917,
        cdObjName: 'RoleNames',
      },
      {
        cdObjId: 92918,
        cdObjName: 'WebserverSecurityConfig',
      },
      {
        cdObjId: 92919,
        cdObjName: 'VendorDescriptor',
      },
      {
        cdObjId: 92920,
        cdObjName: 'ServiceCost',
      },
      {
        cdObjId: 92921,
        cdObjName: 'ServicePortConfig',
      },
      {
        cdObjId: 92922,
        cdObjName: 'IngressConfig',
      },
      {
        cdObjId: 92923,
        cdObjName: 'EgressConfig',
      },
      {
        cdObjId: 92924,
        cdObjName: 'DNSConfig',
      },
      {
        cdObjId: 92925,
        cdObjName: 'RoutingConfig',
      },
      {
        cdObjId: 92926,
        cdObjName: 'StaticRoute',
      },
      {
        cdObjId: 92927,
        cdObjName: 'LoadBalancingConfig',
      },
      {
        cdObjId: 92928,
        cdObjName: 'ProxySettings',
      },
      {
        cdObjId: 92929,
        cdObjName: 'NetworkPolicy',
      },
      {
        cdObjId: 92930,
        cdObjName: 'AuthenticationConfig',
      },
      {
        cdObjId: 92931,
        cdObjName: 'FileStoragePerformance',
      },
      {
        cdObjId: 92932,
        cdObjName: 'FileStorageIntegration',
      },
      {
        cdObjId: 92933,
        cdObjName: 'FileStorageBackup',
      },
      {
        cdObjId: 92934,
        cdObjName: 'FileStorageMetadata',
      },
      {
        cdObjId: 92935,
        cdObjName: 'CpuSpecs',
      },
      {
        cdObjId: 92936,
        cdObjName: 'GpuSpecs',
      },
      {
        cdObjId: 92937,
        cdObjName: 'MemorySpecs',
      },
      {
        cdObjId: 92938,
        cdObjName: 'FileStorageOption',
      },
    ];
  }

  //   async fetchSavedDescriptors() {}

  //   async getDescriptors() {}

  async syncDescriptors(): Promise<void> {
    try {
      const localDescriptorsData: CdDescriptors[] =
        await this.getSrcDescriptors();
      const response =
        await this.svDevDescriptor.syncDescriptors(localDescriptorsData);
      CdLogg.debug(
        'DevDescriptorController::syncDescritors()/response:',
        response,
      );
      if (response.app_state?.success) {
        //
      } else {
        CdLogg.error(
          'Login failed:',
          response.app_state?.info || { error: 'Unknown error' },
        );
        throw new Error(
          'Login failed. Please check your credentials and try again.',
        );
      }
    } catch (error: any) {
      CdLogg.error('Error during login:', error.message);
    }
  }

  async syncApps(): Promise<void> {}

  async syncModules(): Promise<void> {}
}
