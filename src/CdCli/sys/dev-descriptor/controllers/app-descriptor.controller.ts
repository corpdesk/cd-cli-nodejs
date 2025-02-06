import type { CdAppDescriptor } from '../models/app-descriptor.model';
import { AppDescriptorService } from '../services/app-descriptor.service';

export class AppDescriptorController {
  private appDescriptorService: AppDescriptorService;

  constructor() {
    this.appDescriptorService = new AppDescriptorService();
  }

  // Get all applications
  getAllApps(): CdAppDescriptor[] {
    return this.appDescriptorService.getAllApps();
  }

  // Get a single app by name
  getAppByName(name: string): CdAppDescriptor | null {
    return this.appDescriptorService.getAppByName(name);
  }

  // Create a new application descriptor
  createApp(appDescriptor: CdAppDescriptor): CdAppDescriptor {
    return this.appDescriptorService.createApp(appDescriptor);
  }

  // Update application descriptor
  updateAppDescriptor(
    name: string,
    updatedData: Partial<CdAppDescriptor>,
  ): CdAppDescriptor {
    return this.appDescriptorService.updateAppDescriptor(name, updatedData);
  }

  // Delete an application descriptor
  deleteApp(name: string): boolean {
    return this.appDescriptorService.deleteApp(name);
  }
}
