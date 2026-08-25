import React from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay,
    parseISO,
} from 'date-fns';
import { cn } from '../../lib/utils';
import type { EmployeeRoster, ShiftData } from '../../types/schedule.types';
import type { Holiday } from '../../types/organization.types';
import { Clock, X, Gift, Palmtree } from 'lucide-react';

interface EmployeeCalendarViewProps {
    referenceDate: Date;
    roster: EmployeeRoster | null;
    onDateClick: (date: Date) => void;
    viewMode: 'week' | 'month';
    holidays: Holiday[];
}

const EmployeeCalendarView: React.FC<EmployeeCalendarViewProps> = ({
    referenceDate,
    roster,
    onDateClick,
    viewMode,
    holidays,
}) => {
    const getDateRange = () => {
        if (viewMode === 'week') {
            const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start: weekStart, end: weekEnd });
        } else {
            const monthStart = startOfMonth(referenceDate);
            const monthEnd = endOfMonth(monthStart);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
            return eachDayOfInterval({ start: startDate, end: endDate });
        }
    };

    const calendarDays = getDateRange();
    const monthStart = startOfMonth(referenceDate);

    const getShiftForDay = (day: Date): ShiftData | null => {
        if (!roster) return null;

        const dayStr = format(day, 'yyyy-MM-dd');

        // Try exact string match first (most common for keys like "2025-12-31")
        if (roster.shiftData && roster.shiftData[dayStr]) {
            return roster.shiftData[dayStr];
        }

        // Try ISO match for keys like "2025-12-31T00:00:00.000Z"
        const match = Object.entries(roster.shiftData || {}).find(([key]) => {
            try {
                const dateKey = parseISO(key);
                return isSameDay(dateKey, day);
            } catch {
                return false;
            }
        });

        return (match ? match[1] : null);
    };




    return (
        <div className="bg-surface rounded-3xl border border-border/40 shadow-xl overflow-hidden animate-in fade-in duration-500">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="py-3 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">{day}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className={cn(
                "grid grid-cols-7",
                viewMode === 'week' ? "min-h-fit" : "min-h-[600px]"
            )}>
                {calendarDays.map((day, idx) => {
                    const shift = getShiftForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isTodayDate = isToday(day);
                    const isOff = shift?.shiftType === 'off';
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const holiday = holidays.find(h => h.date.startsWith(dayStr));
                    const holidayName = holiday?.name;

                    // For multiple shifts, we check if startTime/endTime are arrays
                    const startTimes = Array.isArray(shift?.startTime) ? shift?.startTime : [shift?.startTime].filter(Boolean);
                    const hasMultipleShifts = startTimes.length > 1;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => (!holidayName || !!shift) && onDateClick(day)}
                            className={cn(
                                "min-h-[100px] p-3 border-r border-b border-border/40 transition-all group relative",
                                (holidayName && !shift) ? "cursor-default opacity-80" : "cursor-pointer hover:bg-primary/[0.02] hover:z-10",
                                isTodayDate && "bg-primary/[0.01]",
                                viewMode === 'month' && !isCurrentMonth && "bg-muted/10 opacity-30",
                                (idx + 1) % 7 === 0 && "border-r-0",
                                isOff && "bg-muted/5"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                                    isTodayDate
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "text-foreground-secondary group-hover:text-primary"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {holidayName && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 max-w-[calc(100%-32px)] overflow-hidden">
                                        <Gift className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        <span className="text-[8px] font-black text-amber-700 uppercase truncate" title={holidayName}>{holidayName}</span>
                                    </div>
                                )}
                            </div>

                            {shift && !isOff && (
                                <div className="space-y-1.5 overflow-hidden">
                                    {startTimes.map((start, sIdx) => {
                                        const end = Array.isArray(shift.endTime) ? shift.endTime[sIdx] : shift.endTime;

                                        // In month view, only show the first shift and a counter
                                        if (viewMode === 'month' && sIdx > 0) return null;

                                        return (
                                            <div key={sIdx} className="space-y-1.5">
                                                <div className={cn(
                                                    "px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                                                    shift.shiftType === 'day' ? "bg-blue-500/5 border-blue-500/20 text-blue-600" :
                                                        shift.shiftType === 'night' ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-600" :
                                                            "bg-primary/5 border-primary/20 text-primary"
                                                )}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1 uppercase tracking-tighter text-[9px]">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {isOff ? 'OFF' : 'SHIFT'}
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-[11px] flex items-center justify-between tracking-tight">
                                                        <span>{start} - {end}</span>
                                                    </div>
                                                </div>

                                                {/* Breaks Summary */}
                                                {/* {attendance && (
                                                    <div className="flex flex-wrap gap-1 px-1">
                                                        <div className="flex items-center gap-1 bg-amber-500/5 px-1.5 py-0.5 rounded-md border border-amber-500/10">
                                                            <Coffee className="w-2.5 h-2.5 text-amber-500" />
                                                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-tight">
                                                                {attendance.breaks.length} Breaks
                                                            </span>
                                                        </div>
                                                    </div>
                                                )} */}
                                            </div>
                                        );
                                    })}

                                    {hasMultipleShifts && viewMode === 'month' && (
                                        <div className="text-[9px] font-black text-foreground-tertiary pl-1 mt-1">
                                            + {startTimes.length - 1} MORE
                                        </div>
                                    )}
                                </div>
                            )}

                            {isOff && (
                                <div className="mt-2 flex flex-col items-center justify-center py-4 rounded-2xl border border-dashed border-border/40 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center mb-1">
                                        <X className="w-3 h-3 text-foreground-tertiary" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-foreground-tertiary tracking-widest">OFF DAY</span>
                                </div>
                            )}

                            {/* Leave Status */}
                            {shift?.shiftType === 'Leave' && (
                                <div className="mt-2 flex flex-col items-center justify-center py-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-sm animate-in fade-in zoom-in duration-300">
                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mb-1">
                                        <Palmtree className="w-3 h-3 text-orange-600" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-orange-700 tracking-widest text-center px-1 leading-tight">OUT OF OFFICE</span>
                                    {shift.leaveType && (
                                        <span className="text-[8px] font-bold text-orange-600 mt-1 uppercase opacity-70">{shift.leaveType}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EmployeeCalendarView;
