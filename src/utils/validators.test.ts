import { isValidEmail } from './validators';

describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        expect(isValidEmail('a@b.c')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
        expect(isValidEmail('test@example')).toBe(false);
        expect(isValidEmail('testexample.com')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('test@.com')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});
