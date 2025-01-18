/* eslint-disable style/brace-style */
/* eslint-disable antfu/if-newline */
import type { IJsonUpdate } from './IBase';

export class BaseService {
  err: string[] = []; // error messages

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
