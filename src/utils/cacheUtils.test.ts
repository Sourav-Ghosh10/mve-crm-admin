import { cacheUtils } from './cacheUtils';
import { apiCache } from './apiCache';

jest.mock('./apiCache', () => ({
    apiCache: {
        clear: jest.fn(),
        removePattern: jest.fn(),
        getStats: jest.fn(),
        cleanup: jest.fn(),
    },
}));

describe('cacheUtils', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('clearAll should call apiCache.clear', () => {
        cacheUtils.clearAll();
        expect(apiCache.clear).toHaveBeenCalledTimes(1);
    });

    it('clearPattern should call apiCache.removePattern', () => {
        const pattern = '/test';
        cacheUtils.clearPattern(pattern);
        expect(apiCache.removePattern).toHaveBeenCalledWith(pattern);
    });

    it('clearScheduleCache should clear /schedules pattern', () => {
        cacheUtils.clearScheduleCache();
        expect(apiCache.removePattern).toHaveBeenCalledWith('/schedules');
    });

    it('getStats should return apiCache.getStats', () => {
        const stats = { size: 10, maxSize: 100, defaultTTL: 1000 };
        (apiCache.getStats as jest.Mock).mockReturnValue(stats);

        const result = cacheUtils.getStats();
        expect(result).toEqual(stats);
        expect(apiCache.getStats).toHaveBeenCalledTimes(1);
    });

    it('cleanup should call apiCache.cleanup', () => {
        cacheUtils.cleanup();
        expect(apiCache.cleanup).toHaveBeenCalledTimes(1);
    });
});
