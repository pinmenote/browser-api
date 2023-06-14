import { BrowserApi } from './browser.api';

export class BrowserStorage {
  static async get<T>(key: string): Promise<T> {
    const value = await BrowserApi.localStore.get(key);
    return value[key];
  }

  static async getAll(): Promise<any> {
    return await BrowserApi.localStore.get();
  }

  static async getBytesInUse(key?: string): Promise<number> {
    return await BrowserApi.localStore.getBytesInUse(key);
  }

  static async set<T>(key: string, value: T): Promise<void> {
    const v: { [key: string]: any } = {};
    v[key] = value;
    await BrowserApi.localStore.set(v);
  }

  static async remove(key: string): Promise<void> {
    await BrowserApi.localStore.remove(key);
  }

  static async clear(): Promise<void> {
    await BrowserApi.localStore.clear();
  }
}
