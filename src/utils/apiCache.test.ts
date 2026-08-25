import { apiCache } from './apiCache';

describe('ApiCache', () => {
    beforeEach(() => {
        apiCache.clear();
    });

    it('should set and get values correctly', () => {
        const url = '/api/test';
        const data = { foo: 'bar' };
        apiCache.set(url, data);

        expect(apiCache.get(url)).toEqual(data);
    });

    it('should distinguish keys based on params', () => {
        const url = '/api/test';
        const data1 = { id: 1 };
        const data2 = { id: 2 };
        const params1 = { page: 1 };
        const params2 = { page: 2 };

        apiCache.set(url, data1, params1);
        apiCache.set(url, data2, params2);

        expect(apiCache.get(url, params1)).toEqual(data1);
        expect(apiCache.get(url, params2)).toEqual(data2);
    });

    it('should return null for expired entries', (done) => {
        const url = '/api/expired';
        const data = { expired: true };
        const ttl = 10; // 10ms

        apiCache.set(url, data, undefined, ttl);

        setTimeout(() => {
            expect(apiCache.get(url)).toBeNull();
            done();
        }, 20);
    });

    it('should respect max size and remove oldest entries', () => {
        // Since we are using the singleton, it might have a large maxSize (100)
        // Let's verify stats first
        const stats = apiCache.getStats();

        // Fill up the cache to maxSize
        for (let i = 0; i < stats.maxSize + 10; i++) {
            apiCache.set(`/url/${i}`, { i });
        }

        expect(apiCache.getStats().size).toBe(stats.maxSize);
    });

    it('should remove entries by pattern', () => {
        apiCache.set('/users/1', { name: 'John' });
        apiCache.set('/users/2', { name: 'Jane' });
        apiCache.set('/settings', { theme: 'dark' });

        apiCache.removePattern('/users');

        expect(apiCache.get('/users/1')).toBeNull();
        expect(apiCache.get('/users/2')).toBeNull();
        expect(apiCache.get('/settings')).toBeDefined();
    });

    it('should clear all entries', () => {
        apiCache.set('/a', 1);
        apiCache.set('/b', 2);
        apiCache.clear();
        expect(apiCache.getStats().size).toBe(0);
    });
});
