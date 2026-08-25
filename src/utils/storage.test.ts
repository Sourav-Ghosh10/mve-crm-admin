import { setItem, getItem } from './storage';

describe('storage utils', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('setItem should store JSON stringified value', () => {
        const key = 'test-key';
        const value = { a: 1 };
        setItem(key, value);

        expect(localStorage.getItem(key)).toBe(JSON.stringify(value));
    });

    it('getItem should return parsed JSON value', () => {
        const key = 'test-key';
        const value = { b: 2 };
        localStorage.setItem(key, JSON.stringify(value));

        expect(getItem(key)).toEqual(value);
    });

    it('getItem should return null if key does not exist', () => {
        expect(getItem('non-existent')).toBeNull();
    });

    it('getItem should handle invalid JSON gracefully (though currently it might throw)', () => {
        localStorage.setItem('bad-json', '{invalid}');
        // Given the current implementation of storage.ts, this will throw.
        // If we wanted to test gracefullness we'd need to modify storage.ts
        expect(() => getItem('bad-json')).toThrow();
    });
});
