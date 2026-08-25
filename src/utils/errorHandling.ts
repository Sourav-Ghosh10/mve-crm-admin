import { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api.types';

export const getErrorMessage = (error: unknown, fallback: string): string | string[] => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const responseData = axiosError.response?.data;

    // 1. Try responseData.error.details (validation errors)
    if (
        responseData?.error &&
        typeof responseData.error === 'object' &&
        responseData.error.details &&
        Array.isArray(responseData.error.details)
    ) {
        return responseData.error.details.map(d => d.message);
    }

    // 2. Try responseData.error.message (if error is an object)
    if (
        responseData?.error &&
        typeof responseData.error === 'object' &&
        'message' in responseData.error &&
        typeof responseData.error.message === 'string'
    ) {
        return responseData.error.message;
    }

    // 3. Try responseData.message
    if (responseData?.message && typeof responseData.message === 'string') {
        return responseData.message;
    }

    // 4. Try responseData.error (if error is a string)
    if (responseData?.error && typeof responseData.error === 'string') {
        return responseData.error;
    }

    // 5. Try axiosError.message
    if (axiosError.message && typeof axiosError.message === 'string') {
        return axiosError.message;
    }

    return fallback;
};
