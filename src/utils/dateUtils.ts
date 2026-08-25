import { format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

// ----------------------------------------------------------------------
// Dynamic Timezone Helper
// ----------------------------------------------------------------------

export const getOfficeTimezone = (): string => {
    return localStorage.getItem('admin_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
};

// ----------------------------------------------------------------------
// Core Formatting Types
// ----------------------------------------------------------------------

type DateInput = string | Date;

// ----------------------------------------------------------------------
// Admin / Office Timezone Helpers
// ----------------------------------------------------------------------

/**
 * Formats a date string or object into the selected Admin Timezone.
 * Use this for ALL Admin Panel displays.
 */
export const formatAdminDate = (date: DateInput, formatStr: string = 'MMM d, yyyy'): string => {
    return formatInTimeZone(date, getOfficeTimezone(), formatStr);
};

/**
 * Formats a time string or object into the selected Admin Timezone.
 * Use this for ALL Admin Panel displays.
 */
export const formatAdminTime = (date: DateInput, formatStr: string = 'hh:mm a'): string => {
    return formatInTimeZone(date, getOfficeTimezone(), formatStr);
};

/**
 * Returns the plain date string (YYYY-MM-DD) in the selected Admin Timezone.
 * Useful for filtering and API queries anchored to that timezone.
 */
export const getAdminDateKey = (date: DateInput = new Date()): string => {
    return formatInTimeZone(date, getOfficeTimezone(), 'yyyy-MM-dd');
};

// ----------------------------------------------------------------------
// Employee / Local Timezone Helpers
// ----------------------------------------------------------------------

/**
 * Formats a date string or object into the User's Local Timezone.
 * Use this for Employee Portal displays.
 */
export const formatEmployeeDate = (date: DateInput, formatStr: string = 'MMM d, yyyy'): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
};

/**
 * Formats a time string or object into the User's Local Timezone.
 * Use this for Employee Portal displays.
 */
export const formatEmployeeTime = (date: DateInput, formatStr: string = 'hh:mm a'): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
};

/**
 * Returns today's date in YYYY-MM-DD format based on the user's local timezone.
 */
export const getTodayLocalDate = (): string => {
    return format(new Date(), 'yyyy-MM-dd');
};

// ----------------------------------------------------------------------
// Shift & Consistency Wrappers
// ----------------------------------------------------------------------

/**
 * Safely parses a YYYY-MM-DD string.
 * NOTE: If purely for display, prefer formatAdminDate or formatEmployeeDate.
 */
export const parseLocalDate = (dateStr: string): Date => {
    return parseISO(dateStr);
};

/**
 * Legacy wrapper.
 * @deprecated Use formatEmployeeDate or formatAdminDate to be explicit about context.
 */
export const formatLocalDate = (dateStr: string, formatStr: string = 'MMM d, yyyy'): string => {
    try {
        return format(parseLocalDate(dateStr), formatStr);
    } catch {
        return dateStr;
    }
};

/**
 * Calculates shift status flags based on the user's local time.
 * Used for Employee View interactive elements.
 */
export const getShiftStatus = (shiftDate: string) => {
    const today = getTodayLocalDate();
    return {
        isToday: shiftDate === today,
        isPast: shiftDate < today,
        isFuture: shiftDate > today,
        // Shifts are editable if they are today or in the future
        isEditable: shiftDate >= today,
    };
};

/**
 * Formats a single shift time range.
 * Detects overnight shifts (End < Start) and appends "(Next Day)".
 */
const formatSingleRange = (start: string, end: string): string => {
    if (!start || !end) return '';
    // Simple string comparison for HH:mm works for detection if format is consistent (24h or ISO)
    // Assuming 'start' and 'end' are times like "09:00" or "21:00"

    // If we are dealing with full ISO strings, comparison checks date.
    // If just time strings, we assume overnight if end < start.
    const crossesMidnight = end < start;

    return `${start} - ${end}${crossesMidnight ? ' (Next Day)' : ''}`;
};


/**
 * Helper to determine if a shift is overnight based on start/end time strings (HH:mm).
 */
export const isOvernightShift = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return false;
    return endTime < startTime;
};

/**
 * Formats shift time range(s).
 * @param startTime Single time string or array of strings
 * @param endTime Single time string or array of strings
 */
export const formatShiftRange = (
    startTime?: string | string[],
    endTime?: string | string[]
): string => {
    if (!startTime || !endTime) return '';

    if (Array.isArray(startTime) && Array.isArray(endTime)) {
        return startTime
            .map((s, i) => formatSingleRange(s, endTime[i]))
            .filter(Boolean)
            .join(', ');
    }
    return formatSingleRange(startTime as string, endTime as string);
};

/**
 * Creates a Date object anchored to a specific timezone.
 * Useful for combining a date and a time string (HH:mm) while respecting the source timezone (e.g. Employee's location).
 */
export const getZonedDate = (date: DateInput, timeStr: string, tz: string): Date => {
    const dateStr = typeof date === 'string' ? date.slice(0, 10) : format(date, 'yyyy-MM-dd');
    // Ensure time has seconds for consistent parsing if needed, but 'HH:mm' is usually enough
    return fromZonedTime(`${dateStr} ${timeStr}`, tz);
};
