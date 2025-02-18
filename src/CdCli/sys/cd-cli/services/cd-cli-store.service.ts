import { createClient } from 'redis';

export class CdCliStoreService {
  private client;

  constructor() {
    this.client = createClient();
    this.client.connect();
  }

  async set<T>(key: string, value: T, expiresAt?: number): Promise<void> {
    const data = JSON.stringify({ value, expiresAt });
    await this.client.set(key, data);
    if (expiresAt) {
      await this.client.expireAt(key, expiresAt);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data).value : null;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
