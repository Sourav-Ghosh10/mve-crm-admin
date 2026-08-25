import { getErrorMessage } from './errorHandling';
import { AxiosError } from 'axios';

describe('getErrorMessage', () => {
    const fallback = 'An error occurred';

    it('should return validation error details if present', () => {
        const error = {
            response: {
                data: {
                    error: {
                        details: [
                            { message: 'First name is required' },
                            { message: 'Last name is required' }
                        ]
                    }
                }
            }
        } as unknown as AxiosError;

        const result = getErrorMessage(error, fallback);
        expect(result).toEqual(['First name is required', 'Last name is required']);
    });

    it('should return error message object if present', () => {
        const error = {
            response: {
                data: {
                    error: {
                        message: 'Unauthorized access'
                    }
                }
            }
        } as unknown as AxiosError;

        const result = getErrorMessage(error, fallback);
        expect(result).toBe('Unauthorized access');
    });

    it('should return response message if present', () => {
        const error = {
            response: {
                data: {
                    message: 'Resource not found'
                }
            }
        } as unknown as AxiosError;

        const result = getErrorMessage(error, fallback);
        expect(result).toBe('Resource not found');
    });

    it('should return error string if present in data.error', () => {
        const error = {
            response: {
                data: {
                    error: 'Database connection failed'
                }
            }
        } as unknown as AxiosError;

        const result = getErrorMessage(error, fallback);
        expect(result).toBe('Database connection failed');
    });

    it('should return axios error message if no data exists', () => {
        const error = {
            message: 'Network Error'
        } as unknown as AxiosError;

        const result = getErrorMessage(error, fallback);
        expect(result).toBe('Network Error');
    });

    it('should return fallback if no error information exists', () => {
        const error = {} as unknown as AxiosError;
        const result = getErrorMessage(error, fallback);
        expect(result).toBe(fallback);
    });
});
