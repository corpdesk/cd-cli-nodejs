/* eslint-disable style/operator-linebreak */
import type { CdAppDescriptor } from '../models/app-descriptor.model';

export class AppDescriptorService {
  private appDescriptors: CdAppDescriptor[] = [];

  // Retrieve all apps
  getAllApps(): CdAppDescriptor[] {
    return this.appDescriptors;
  }

  // Retrieve an app by name
  getAppByName(name: string): CdAppDescriptor | null {
    return this.appDescriptors.find((app) => app.name === name) || null;
  }

  // Create a new app descriptor
  createApp(appDescriptor: CdAppDescriptor): CdAppDescriptor {
    this.appDescriptors.push(appDescriptor);
    return appDescriptor;
  }

  // Update an existing app descriptor
  updateAppDescriptor(
    name: string,
    updatedData: Partial<CdAppDescriptor>,
  ): CdAppDescriptor {
    const appIndex = this.appDescriptors.findIndex((app) => app.name === name);
    if (appIndex === -1) {
      throw new Error(`Application '${name}' not found.`);
    }

    // Preserve existing modules if not provided
    updatedData.modules =
      updatedData.modules ?? this.appDescriptors[appIndex].modules;

    this.appDescriptors[appIndex] = {
      ...this.appDescriptors[appIndex],
      ...updatedData,
    };
    return this.appDescriptors[appIndex];
  }

  // Delete an app descriptor
  deleteApp(name: string): boolean {
    const initialLength = this.appDescriptors.length;
    this.appDescriptors = this.appDescriptors.filter(
      (app) => app.name !== name,
    );
    return this.appDescriptors.length < initialLength;
  }
}
