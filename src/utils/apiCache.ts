/**
 * In-memory API cache with TTL (Time-To-Live) support
 */

interface CacheEntry {
    data: unknown;
    timestamp: number;
    ttl: number;
}

interface CacheConfig {
    defaultTTL?: number; // in milliseconds
    maxSize?: number; // maximum number of cached items
}

class ApiCache {
    private cache: Map<string, CacheEntry> = new Map();
    private defaultTTL: number;
    private maxSize: number;

    constructor(config: CacheConfig = {}) {
        this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // Default: 5 minutes
        this.maxSize = config.maxSize || 100; // Default: 100 items
    }

    /**
     * Generate cache key from URL and params
     */
    private generateKey(url: string, params?: Record<string, unknown>): string {
        const paramString = params ? JSON.stringify(params) : '';
        return `${url}${paramString}`;
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry): boolean {
        const now = Date.now();
        return now - entry.timestamp < entry.ttl;
    }

    /**
     * Get cached data if valid
     */
    get(url: string, params?: Record<string, unknown>): unknown | null {
        const key = this.generateKey(url, params);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (this.isValid(entry)) {
            return entry.data;
        }

        // Remove expired entry
        this.cache.delete(key);
        return null;
    }

    /**
     * Set cache data with optional custom TTL
     */
    set(url: string, data: unknown, params?: Record<string, unknown>, customTTL?: number): void {
        const key = this.generateKey(url, params);

        // Enforce max size by removing oldest entry if needed
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: customTTL || this.defaultTTL,
        });
    }

    /**
     * Clear specific cache entry
     */
    remove(url: string, params?: Record<string, unknown>): void {
        const key = this.generateKey(url, params);
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries matching a pattern
     */
    removePattern(pattern: string): void {
        const keysToDelete: string[] = [];

        this.cache.forEach((_, key) => {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; maxSize: number; defaultTTL: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            defaultTTL: this.defaultTTL,
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (!this.isValid(entry)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));
    }
}

// Create singleton instance
export const apiCache = new ApiCache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
});

// TTL configurations for different endpoints (in milliseconds)
export const TTL_CONFIG = {
    // Static data - longer cache
    LOCATIONS: 15 * 60 * 1000,      // 15 minutes
    DEPARTMENTS: 15 * 60 * 1000,    // 15 minutes
    DESIGNATIONS: 15 * 60 * 1000,   // 15 minutes
    CLIENTS: 15 * 60 * 1000,        // 15 minutes
    HOLIDAYS: 30 * 60 * 1000,       // 30 minutes

    // User data - medium cache
    USERS: 10 * 60 * 1000,          // 10 minutes
    USER_PROFILE: 5 * 60 * 1000,    // 5 minutes
    AUTH_ME: 5 * 60 * 1000,         // 5 minutes

    // Dynamic data - shorter cache
    SCHEDULES: 3 * 60 * 1000,       // 3 minutes
    ATTENDANCE: 2 * 60 * 1000,      // 2 minutes
    LEAVE: 3 * 60 * 1000,           // 3 minutes
    REIMBURSEMENTS: 2 * 60 * 1000,   // 2 minutes

    // Real-time data - very short cache
    CURRENT_SESSION: 30 * 1000,     // 30 seconds

    // No cache for mutations (POST, PUT, DELETE)
    NO_CACHE: 0,
};

// Run cleanup periodically (every 5 minutes)
if (typeof window !== 'undefined') {
    setInterval(() => {
        apiCache.cleanup();
    }, 5 * 60 * 1000);
}

export default apiCache;
