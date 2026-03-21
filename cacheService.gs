// services/cacheService.gs
// Wrapper around CacheService with JSON serialization

const Cache = (() => {
  const cache = CacheService.getScriptCache();

  /**
   * Retrieves and deserializes a cached value. Returns null on miss.
   */
  function get(key) {
    try {
      const raw = cache.get(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      logError('CacheService.get', `Failed to get key: ${key}`, e);
      return null;
    }
  }

  /**
   * Serializes and stores a value with optional TTL (default CONFIG.CACHE_TTL).
   */
  function set(key, value, ttl) {
    try {
      const serialized = JSON.stringify(value);
      // CacheService has a 100KB limit per value
      if (serialized.length > 100000) {
        logInfo('CacheService.set', `Skipping cache for key "${key}" — value too large`);
        return;
      }
      cache.put(key, serialized, ttl || CONFIG.CACHE_TTL);
    } catch (e) {
      logError('CacheService.set', `Failed to set key: ${key}`, e);
    }
  }

  /** Removes a specific cache key. */
  function remove(key) {
    try {
      cache.remove(key);
    } catch (e) {
      logError('CacheService.remove', `Failed to remove key: ${key}`, e);
    }
  }

  /** Removes multiple cache keys at once. */
  function removeAll(keys) {
    try {
      cache.removeAll(keys);
    } catch (e) {
      logError('CacheService.removeAll', 'Failed to remove multiple keys', e);
    }
  }

  /** Invalidates all note-related caches. */
  function invalidateNotes() {
    remove(CONFIG.CACHE_KEYS.NOTES_LIST);
  }

  /** Invalidates project list cache. */
  function invalidateProjects() {
    remove(CONFIG.CACHE_KEYS.PROJECTS_LIST);
  }

  /** Invalidates tag list cache. */
  function invalidateTags() {
    remove(CONFIG.CACHE_KEYS.TAGS_LIST);
  }

  return { get, set, remove, removeAll, invalidateNotes, invalidateProjects, invalidateTags };
})();
