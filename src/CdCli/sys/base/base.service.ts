/* eslint-disable brace-style */
/* eslint-disable style/indent */
/* eslint-disable style/brace-style */
/* eslint-disable antfu/if-newline */
import type {
  BaseServiceInterface,
  CdFxReturn,
  IJsonUpdate,
  IQuery,
} from './IBase';

export abstract class AbstractBaseService<T>
  implements BaseServiceInterface<T>
{
  err: string[] = []; // Store error messages

  async create(data: T): Promise<CdFxReturn<null>> {
    try {
      // const typeId = this.getTypeId(); // Internal logic to determine typeId
      console.log(`Saving ${JSON.stringify(data)} to database with type`);

      return { data: null, state: true, message: 'Created successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async read(q?: IQuery): Promise<CdFxReturn<T[]>> {
    try {
      // If no query is provided, default to pulling all data
      const query = q ?? { where: {} };

      console.log(`Reading from database with query:`, query);
      const result: T[] = []; // Replace with actual TypeORM fetch logic

      return { data: result, state: true, message: 'Read successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      console.log(`Updating with ${JSON.stringify(q)}`);

      return { data: null, state: true, message: 'Updated successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  async delete(criteria: Record<string, any>): Promise<CdFxReturn<null>> {
    try {
      console.log(`Deleting with criteria:`, criteria);

      return { data: null, state: true, message: 'Deleted successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Delete failed: ${(error as Error).message}`,
      };
    }
  }

  // protected abstract getTypeId(): number; // Ensures each subclass defines a typeId

  validateJsonUpdate<T>(
    jsonUpdate: IJsonUpdate[],
    rootInterface: T,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    function traversePath(
      currentPath: string[],
      currentInterface: any,
    ): boolean {
      // If no path left to validate, return true
      if (currentPath.length === 0) return true;

      const [currentKey, ...remainingPath] = currentPath;

      if (Array.isArray(currentInterface) && currentKey === '[0]') {
        // Check if the interface is an array and the key indicates an index
        return traversePath(remainingPath, currentInterface[0]);
      } else if (currentInterface && typeof currentInterface === 'object') {
        // Check if the key exists in the interface
        if (!(currentKey in currentInterface)) {
          errors.push(
            `Invalid path key '${currentKey}' at '${currentPath.join('.')}'`,
          );
          return false;
        }
        // Continue traversing the remaining path
        return traversePath(remainingPath, currentInterface[currentKey]);
      } else {
        // If the structure doesn't match, log an error
        errors.push(
          `Unexpected type at '${currentPath.join(
            '.',
          )}'. Expected object or array.`,
        );
        return false;
      }
    }

    // Validate each update item
    jsonUpdate.forEach((update) => {
      if (!update.modelField || update.modelField !== 'cdCliProfileData') {
        errors.push(`Invalid modelField: '${update.modelField}'`);
        return;
      }

      const { path } = update;
      if (!Array.isArray(path) || path.length === 0) {
        errors.push(`Invalid path: '${JSON.stringify(path)}'`);
        return;
      }

      // Start traversal from the root interface
      traversePath(path, rootInterface);
    });

    return { valid: errors.length === 0, errors };
  }
}

export class BaseService extends AbstractBaseService<unknown> {
  async create(data: any): Promise<CdFxReturn<null>> {
    try {
      // const typeId = this.getTypeId(); // Internal logic to determine typeId
      console.log(`Saving ${JSON.stringify(data)} to database with type`);

      return { data: null, state: true, message: 'Created successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async read(q?: IQuery): Promise<CdFxReturn<unknown[]>> {
    try {
      // If no query is provided, default to pulling all data
      const query = q ?? { where: {} };

      console.log(`Reading from database with query:`, query);
      const result: unknown[] = []; // Replace with actual TypeORM fetch logic

      return { data: result, state: true, message: 'Read successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  async update(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      console.log(`Updating with ${JSON.stringify(q)}`);

      return { data: null, state: true, message: 'Updated successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  async delete(criteria: Record<string, any>): Promise<CdFxReturn<null>> {
    try {
      console.log(`Deleting with criteria:`, criteria);

      return { data: null, state: true, message: 'Deleted successfully' };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Delete failed: ${(error as Error).message}`,
      };
    }
  }

  // public getTypeId(): number; // Ensures each subclass defines a typeId
}
