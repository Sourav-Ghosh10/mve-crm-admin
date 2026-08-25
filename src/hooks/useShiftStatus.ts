import { useMemo } from 'react';
import { getShiftStatus, getTodayLocalDate } from '../utils/dateUtils';

/**
 * Hook to get the current status of a shift.
 * Memoized to prevent unnecessary recalculations.
 */
export const useShiftStatus = (shiftDate: string) => {
    return useMemo(() => getShiftStatus(shiftDate), [shiftDate]);
};

/**
 * Hook to get today's date in YYYY-MM-DD format,
 * potentially updating if the day changes while the app is open.
 */
export const useTodayDate = () => {
    // In a real production app, you might want a useEffect that sets up 
    // an interval to refresh this at midnight.
    return getTodayLocalDate();
};
