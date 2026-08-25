import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
        expect(formatCurrency(100)).toBe('$100.00');
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
        expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
        expect(formatCurrency(-50)).toBe('-$50.00');
    });
});
