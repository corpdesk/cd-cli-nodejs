import {
  Repository,
  ObjectLiteral,
  DeepPartial,
  FindManyOptions,
} from 'typeorm';
import { SqliteDataSource } from './sqlite-datasource';
import { CD_FX_FAIL, CdFxReturn, Cmd, IServiceInput } from './IBase';
import CdLog from '../cd-comm/controllers/cd-logger.controller';

export class SqliteStore<T> {
  async create(serviceInput: IServiceInput): Promise<CdFxReturn<T>> {
    try {
      CdLog.debug(`SqliteStore.create() - Processing: ${serviceInput.docName}`);

      if (!serviceInput.serviceModel) {
        return {
          data: null,
          state: false,
          message: 'Service model is required',
        };
      }

      if (!serviceInput.data) {
        return {
          data: null,
          state: false,
          message: 'Payload data is required',
        };
      }

      // Dynamically get repository using service model
      const repository = SqliteDataSource.getRepository(
        serviceInput.serviceModel,
      );

      const entityInstance = repository.create(serviceInput.data);
      const savedEntity = await repository.save(entityInstance);

      CdLog.info(
        `SqliteStore.create() - Created entity for ${serviceInput.docName}`,
      );

      return {
        data: savedEntity as any,
        state: true,
        message: `${serviceInput.docName} created successfully`,
      };
    } catch (error: any) {
      CdLog.error(`SqliteStore.create() - Error: ${error.message}`);

      return {
        data: null,
        state: false,
        message: `Error creating ${serviceInput.docName}: ${error.message}`,
      };
    }
  }

  async read(
    serviceInput: IServiceInput,
  ): Promise<CdFxReturn<T[] | ObjectLiteral[]>> {
    try {
      CdLog.debug(`SqliteStore.read() - Processing: ${serviceInput.docName}`);

      if (!serviceInput.serviceModel) {
        return {
          data: null,
          state: false,
          message: 'Service model is required',
        };
      }

      if (!serviceInput.cmd || !serviceInput.cmd.query) {
        return {
          data: null,
          state: false,
          message: 'Query object is required',
        };
      }

      // Dynamically get repository using service model
      const repository = SqliteDataSource.getRepository(
        serviceInput.serviceModel,
      );

      // Extract query
      const queryOptions: any = serviceInput.cmd.query;

      // Execute query
      const results = await repository.find(queryOptions);

      CdLog.info(
        `SqliteStore.read() - Found ${results.length} records for ${serviceInput.docName}`,
      );

      return {
        data: results,
        state: true,
        message: `${results.length} records retrieved successfully`,
      };
    } catch (error: any) {
      CdLog.error(`SqliteStore.read() - Error: ${error.message}`);

      return {
        data: null,
        state: false,
        message: `Error retrieving ${serviceInput.docName}: ${error.message}`,
      };
    }
  }

  async update(serviceInput: IServiceInput): Promise<CdFxReturn<any>> {
    try {
      const repository = SqliteDataSource.getRepository(
        serviceInput.serviceModel,
      );

      if (!serviceInput.cmd || !serviceInput.cmd.query.update) {
        return CD_FX_FAIL;
      }

      const result = await repository.update(
        serviceInput.cmd.query.where,
        serviceInput.cmd.query.update,
      );

      if ('affected' in result) {
        return {
          state: true,
          message: `${result.affected} record(s) updated`,
          data: result,
        };
      } else {
        return {
          state: false,
          message: 'Some error occurred',
          data: result,
        };
      }
    } catch (error) {
      return { state: false, data: null, message: (error as Error).toString() };
    }
  }

  async delete(serviceInput: IServiceInput): Promise<any> {
    try {
      const repository = SqliteDataSource.getRepository(
        serviceInput.serviceModel,
      );

      if (!serviceInput.cmd || !serviceInput.cmd.query.where) {
        return CD_FX_FAIL;
      }
      const result = await repository.delete(serviceInput.cmd.query.where);

      if ('affected' in result) {
        return {
          state: true,
          message: `${result.affected} record(s) deleted`,
          data: result,
        };
      } else {
        return {
          state: false,
          message: 'Some error occurred',
          data: result,
        };
      }
    } catch (error) {
      return { state: false, data: null, message: (error as Error).toString() };
    }
  }
}
