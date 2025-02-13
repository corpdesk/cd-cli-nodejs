/* eslint-disable brace-style */
/* eslint-disable node/prefer-global/process */
import type {
  CdFxReturn,
  ICdResponse,
  IQuery,
  ISessResp,
} from '../../base/IBase';
import type {
  CdDescriptor,
  TypeDescriptor,
  TypeDetails,
} from '../models/dev-descriptor.model';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import ts from 'typescript';
import { HttpService } from '../../base/http.service';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller';
import CdCliVaultController from '../../cd-cli/controllers/cd-cli-vault.controller';
import CdLogg from '../../cd-comm/controllers/cd-logger.controller';

import { CdObjService } from '../../moduleman/services/dev-descriptor.service';
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
  savedDescriptors: CdDescriptor[] = [];
  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.modelsDir = join(__dirname, '../src/CdCli/sys/dev-descriptor/models');
  }

  async getSrcDescriptors(): Promise<CdFxReturn<CdDescriptor[]>> {
    CdLogg.debug('DevDescriptorController::getSrcDescriptors()/starting...');
    try {
      this.savedDescriptors = await this.fetchSavedDescriptors();
      CdLogg.debug(
        `DevDescriptorController::getSrcDescriptors()/this.savedDescriptors.length:${this.savedDescriptors.length}`,
      );

      const srcDescriptors: CdDescriptor[] = [];
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

            const jDetails: TypeDescriptor[] = this.extractTypeDetails(node);
            srcDescriptors.push({ cdObjId, cdObjName, jDetails });
          }
        });
      }

      CdLogg.debug(
        `DevDescriptorController::getSrcDescriptors()/srcDescriptors.length:${srcDescriptors.length}`,
      );
      return { data: srcDescriptors, state: true }; // Standardized return object
    } catch (e) {
      CdLogg.error(
        `Encountered an error while compiling descriptors. Error: ${(e as Error).message}`,
      );
      return { data: null, state: false }; // On failure, return null
    }
  }

  private extractTypeDetails(
    node: ts.InterfaceDeclaration | ts.EnumDeclaration,
    // descriptors: CdDescriptor[],
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

  // private mapTypeToDetails(
  //   typeNode: ts.TypeNode,
  //   // descriptors: CdDescriptor[],
  // ): TypeDetails {
  //   const typeDetails: TypeDetails = { cdObjId: -1 }; // Default value

  //   if (!typeNode) {
  //     return typeDetails; // Return default if typeNode is undefined
  //   }

  //   // Handle array types
  //   if (ts.isArrayTypeNode(typeNode)) {
  //     const elementType = typeNode.elementType;
  //     typeDetails.isArray = true;
  //     typeDetails.cdObjId = this.getCdObjId(elementType);
  //   }
  //   // Handle union types (e.g., AppType | AppType[])
  //   else if (ts.isUnionTypeNode(typeNode)) {
  //     for (const subtype of typeNode.types) {
  //       if (ts.isArrayTypeNode(subtype)) {
  //         typeDetails.isArray = true;
  //         typeDetails.cdObjId = this.getCdObjId(subtype.elementType);
  //       } else {
  //         typeDetails.cdObjId = this.getCdObjId(subtype);
  //       }
  //     }
  //   }
  //   // Handle primitive types (number, string, boolean, etc.)
  //   else if (
  //     typeNode.kind >= ts.SyntaxKind.FirstKeyword &&
  //     typeNode.kind <= ts.SyntaxKind.LastKeyword
  //   ) {
  //     typeDetails.isPrimitive = true;
  //     typeDetails.cdObjId = this.getCdObjId(typeNode);
  //   }

  //   // Handle interface or descriptor types
  //   else if (ts.isTypeReferenceNode(typeNode)) {
  //     const typeName = typeNode.typeName.getText();
  //     const referencedDescriptor = this.savedDescriptors.find(
  //       (d) => d.cdObjName === typeName,
  //     );

  //     if (referencedDescriptor) {
  //       typeDetails.cdObjId = referencedDescriptor.cdObjId;
  //       typeDetails.isInterface = true;
  //       typeDetails.isDescriptor = true; // If it’s a descriptor type
  //     }
  //   }

  //   return typeDetails;
  // }
  private mapTypeToDetails(typeNode: ts.TypeNode): TypeDetails {
    const typeDetails: TypeDetails = { cdObjId: -1 }; // Default value

    if (!typeNode) {
      return typeDetails; // Return default if typeNode is undefined
    }

    // Handle array types
    if (ts.isArrayTypeNode(typeNode)) {
      typeDetails.isArray = true;
      typeDetails.cdObjId = this.getCdObjId(typeNode.elementType);
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

        // Check if the referenced type extends another type
        const extendsCdObjId = this.getExtendedCdObjId(typeName);
        if (extendsCdObjId) {
          typeDetails.extend = extendsCdObjId;
        }
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

  private getExtendedCdObjId(typeName: string): number | undefined {
    const referencedDescriptor = this.savedDescriptors.find(
      (d) => d.cdObjName === typeName,
    );

    if (!referencedDescriptor) {
      return undefined;
    }

    const sourceFile = ts.createSourceFile(
      `${typeName}.ts`,
      fs.readFileSync(join(this.modelsDir, `${typeName}.ts`), 'utf8'),
      ts.ScriptTarget.ESNext,
      true,
    );

    let extendId: number | undefined;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
              const extendedTypeName = clause.types[0].expression.getText();
              const extendedDescriptor = this.savedDescriptors.find(
                (d) => d.cdObjName === extendedTypeName,
              );

              if (extendedDescriptor) {
                extendId = extendedDescriptor.cdObjId;
              }
            }
          }
        }
      }
    });

    return extendId;
  }

  // generateObjectId
  getCdObjIdByName(name: string, descriptors: CdDescriptor[]): number {
    const found = descriptors.find((desc) => desc.cdObjName === name);
    return found ? found.cdObjId : -1;
  }

  async showSrcDescriptors(options?: {
    names?: string[]; // Updated to accept multiple names
    json?: boolean;
    pretty?: boolean;
  }) {
    let result: CdFxReturn<CdDescriptor[]>;

    CdLogg.debug(
      `DevDescriptorController::showSrcDescriptors()/options?.names:${options?.names}`,
    );
    CdLogg.debug(
      `DevDescriptorController::showSrcDescriptors()/options.names.length:${options?.names?.length}`,
    );
    // Fetch descriptors based on whether names are provided
    if (options?.names && options.names.length > 0) {
      CdLogg.debug(
        `DevDescriptorController::showSrcDescriptors()/selecting by names...`,
      );
      CdLogg.debug(
        `DevDescriptorController::showSrcDescriptors()/options?.names:${options?.names}`,
      );
      result = await this.getDescriptorsByNames(options.names);
    } else {
      CdLogg.debug(
        `DevDescriptorController::showSrcDescriptors()/getting all...`,
      );
      result = await this.getAllDescriptors();
    }

    // Handle errors
    if (!result.state) {
      console.error(result.message || 'Failed to fetch descriptors.');
      return;
    }

    if (!result.data || result.data.length === 0) {
      console.log('No descriptors found.');
      return;
    }

    const srcDescriptors: CdDescriptor[] = result.data;
    CdLogg.debug(
      `DevDescriptorController::showSrcDescriptors()/srcDescriptors:${srcDescriptors.length}`,
    );

    // Handle JSON output
    if (options?.json) {
      console.log(
        options.pretty
          ? JSON.stringify(srcDescriptors, null, 2) // Pretty JSON
          : JSON.stringify(srcDescriptors),
      ); // Compact JSON
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

  async getDescriptorsByNames(
    names: string[],
  ): Promise<CdFxReturn<CdDescriptor[]>> {
    const result = await this.getAllDescriptors();

    if (!result.state) {
      return {
        data: null,
        state: false,
        message: 'Failed to fetch descriptors.',
      };
    }

    const filteredDescriptors =
      result.data?.filter((desc) => names.includes(desc.cdObjName)) || [];

    return { data: filteredDescriptors, state: true };
  }

  async getAllDescriptors(): Promise<CdFxReturn<CdDescriptor[]>> {
    const result = await this.getSrcDescriptors();

    if (!result.state) {
      return {
        data: null,
        state: false,
        message: 'Failed to retrieve source descriptors.',
      };
    }

    if (!result.data || result.data.length === 0) {
      return { data: null, state: false, message: 'No descriptors available.' };
    }

    const matchingDescriptors = result.data;

    if (matchingDescriptors.length === 0) {
      return {
        data: null,
        state: false,
        message: `No descriptor found`,
      };
    }

    return {
      data: matchingDescriptors,
      state: true,
      message: 'Descriptor(s) found successfully.',
    };
  }

  async fetchSavedDescriptors(): Promise<CdDescriptor[]> {
    const q: IQuery = {
      select: ['cdObjId', 'cdObjName'],
      where: { cdObjTypeGuid: '5ab9a944-1014-4664-ad96-8ceb737d1857' },
    };
    const svCdObj = new CdObjService();
    const res: ICdResponse = await svCdObj.getCdObj(q);
    CdLogg.debug(`DevDescriptorController::fetchSavedDescriptors()/res:${res}`);
    if (res.app_state.success) {
      const descriptors: CdDescriptor[] = res.data.items;
      return descriptors;
    } else {
      CdLogg.error(
        `There was an error syncing descriptors:${res.app_state.info?.app_msg}`,
      );
      return [];
    }
  }

  async syncDescriptors(names?: string[]): Promise<void> {
    try {
      CdLogg.debug(
        `DevDescriptorController::syncDescriptors()/starting... names: ${JSON.stringify(names)}`,
      );

      let result: CdFxReturn<CdDescriptor[]>;

      if (names && names.length > 0) {
        result = await this.getDescriptorsByNames(names);
      } else {
        result = await this.getSrcDescriptors();
      }

      if (!result.state) {
        const e = result.message || 'Unknown error';
        CdLogg.error(`Failed to fetch descriptors:${e}`);
        throw new Error(result.message || 'Failed to fetch descriptors.');
      }

      CdLogg.debug(
        `DevDescriptorController::syncDescriptors()/Fetched ${result.data?.length} descriptors`,
      );

      const response = await this.svDevDescriptor.syncDescriptors(
        result.data || [],
      );

      CdLogg.debug(
        'DevDescriptorController::syncDescriptors()/response:',
        response,
      );

      if (response.app_state?.success) {
        CdLogg.success('✔ Descriptors successfully synced.');
      } else {
        CdLogg.error(
          'Sync failed:',
          response.app_state?.info || { error: 'Unknown error' },
        );
        throw new Error('Sync failed. Please check and try again.');
      }
    } catch (error: any) {
      CdLogg.error('Error during descriptor syncing:', error.message);
      throw error;
    }
  }

  async syncApps(names: string[]): Promise<void> {
    CdLogg.debug('names:', names);
  }

  async syncModules(names: string[]): Promise<void> {
    CdLogg.debug('names:', names);
  }
}
