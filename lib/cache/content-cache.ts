import type { AdapterResult } from "../adapter/content-adapter";

/**
 * Lightweight in-memory cache for adapter outputs.
 * In a real deployment this can be swapped with a distributed cache.
 */
export class ContentCache {
  private readonly store = new Map<string, { value: AdapterResult; createdAt: number }>();

  constructor(private readonly defaultTtlSeconds = 30) {}

  get(key: string): AdapterResult | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const ttl = entry.value.cachePolicy?.revalidate ?? this.defaultTtlSeconds;
    if (ttl <= 0) return entry.value;

    const ageSeconds = (Date.now() - entry.createdAt) / 1000;
    if (ageSeconds > ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: AdapterResult) {
    this.store.set(key, { value, createdAt: Date.now() });
  }
}

export const contentCache = new ContentCache();
