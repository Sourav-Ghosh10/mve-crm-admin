import { startOfMonth, endOfMonth } from 'date-fns';

export interface PayrollCycleSettings {
  startDay: number;
  endDay: number;
}

/**
 * Resolves the startDate and endDate (Date objects) of the payroll cycle for a given base date and settings.
 * Handles custom payroll cycle settings and clamps startDay/endDay according to actual calendar months lengths.
 * 
 * @param date - The target date (usually in the month you want to generate payroll for)
 * @param settings - The payroll cycle settings { startDay, endDay }
 * @returns An object containing the start and end Dates (local time)
 */
export const getPayrollCycleInterval = (
  date: Date,
  settings?: PayrollCycleSettings
): { startDate: Date; endDate: Date } => {
  const startDay = settings?.startDay ?? 1;
  const endDay = settings?.endDay ?? 31;

  if (startDay === 1) {
    return {
      startDate: startOfMonth(date),
      endDate: endOfMonth(date),
    };
  } else {
    // E.g., startDay = 26, endDay = 25
    // For a given date (e.g. May 15, 2026):
    // The cycle starts on the 26th of the previous month (April 26, 2026)
    // and ends on the 25th of the current month (May 25, 2026)
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-indexed

    // Start Date: resolved startDay of the previous month
    const startMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const startYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const maxDaysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate();
    const resolvedStartDay = Math.min(startDay, maxDaysInStartMonth);
    const startDate = new Date(startYear, startMonth, resolvedStartDay, 0, 0, 0, 0);

    // End Date: resolved endDay of the current month
    const maxDaysInEndMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const resolvedEndDay = Math.min(endDay, maxDaysInEndMonth);
    const endDate = new Date(currentYear, currentMonth, resolvedEndDay, 23, 59, 59, 999);

    return { startDate, endDate };
  }
};
