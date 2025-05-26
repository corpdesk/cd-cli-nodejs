import { CdAiServiceInterface } from '../models/cd-ai.model';

export class AiServiceRegistry {
  private static registry = new Map<string, CdAiServiceInterface>();

  static register(service: CdAiServiceInterface) {
    this.registry.set(service.type, service);
  }

  static getAllServices(): CdAiServiceInterface[] {
    return Array.from(this.registry.values());
  }

  static getService(type: string): CdAiServiceInterface | undefined {
    return this.registry.get(type);
  }
}
