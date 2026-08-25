import { apiCache } from './apiCache';

/**
 * Cache utility functions for manual cache management
 */

export const cacheUtils = {
    /**
     * Clear all cache
     */
    clearAll: () => {
        apiCache.clear();
    },

    /**
     * Clear cache for specific endpoint pattern
     */
    clearPattern: (pattern: string) => {
        apiCache.removePattern(pattern);
    },

    /**
     * Clear schedule-related cache
     */
    clearScheduleCache: () => {
        apiCache.removePattern('/schedules');
    },

    /**
     * Clear attendance-related cache
     */
    clearAttendanceCache: () => {
        apiCache.removePattern('/attendance');
    },

    /**
     * Clear user-related cache
     */
    clearUserCache: () => {
        apiCache.removePattern('/users');
    },

    /**
     * Get cache statistics
     */
    getStats: () => {
        return apiCache.getStats();
    },

    /**
     * Run cache cleanup (remove expired entries)
     */
    cleanup: () => {
        apiCache.cleanup();
    },
};

// Export for global access (useful for debugging)
if (typeof window !== 'undefined') {
    (window as unknown as { cacheUtils: typeof cacheUtils }).cacheUtils = cacheUtils;
}

export default cacheUtils;
