import { StorageService } from '../service/storage.service';

/** In-memory stand-in for StorageService (which wraps @ionic/storage) for unit tests. */
export class FakeStorageService implements Pick<StorageService, 'setItem' | 'getItem' | 'removeItem' | 'clear'> {
  readonly data = new Map<string, unknown>();

  async setItem(key: string, value: unknown) {
    this.data.set(key, value);
  }

  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  async removeItem(key: string) {
    this.data.delete(key);
  }

  async clear() {
    this.data.clear();
  }
}
