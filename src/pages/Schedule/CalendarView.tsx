import React from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday
} from 'date-fns';
import { cn } from '../../lib/utils';
import type { Holiday } from '../../types/organization.types';
import { Gift } from 'lucide-react';

interface DayUser {
    firstName: string;
    lastName: string;
    _id: string;
    [key: string]: unknown;
}

interface CalendarViewProps {
    referenceDate: Date;
    usersByDate: Record<string, { users: DayUser[], total: number, hasMore: boolean }>;
    onDateClick: (date: Date) => void;
    loading: boolean;
    viewMode: 'week' | 'month';
    holidays: Holiday[];
}

const CalendarView: React.FC<CalendarViewProps> = ({
    referenceDate,
    usersByDate,
    onDateClick,
    viewMode,
    holidays,
}) => {
    // Calculate date range based on view mode
    const getDateRange = () => {
        if (viewMode === 'week') {
            const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start: weekStart, end: weekEnd });
        } else {
            // Month view
            const monthStart = startOfMonth(referenceDate);
            const monthEnd = endOfMonth(monthStart);
            const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
            const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
            return eachDayOfInterval({ start: startDate, end: endDate });
        }
    };

    const calendarDays = getDateRange();
    const monthStart = startOfMonth(referenceDate);

    const getDaySummary = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return usersByDate[dateStr] || { users: [], total: 0, hasMore: false };
    };

    return (
        <div className="bg-surface rounded-3xl sm:rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-black/[0.03] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <div key={day} className="py-2 sm:py-4 text-center">
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">{day.slice(0, 3)}</span>
                        <span className="sm:hidden text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">{day[0]}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className={cn(
                "grid grid-cols-7",
                viewMode === 'week' ? "min-h-fit sm:min-h-fit" : "min-h-[500px] sm:min-h-[600px]"
            )}>
                {calendarDays.map((day, idx) => {
                    const daySummary = getDaySummary(day);
                    const shifts = daySummary.users;
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isTodayDate = isToday(day);
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const holiday = holidays.find(h => h.date.startsWith(dayStr));
                    const holidayName = holiday?.name;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => (!holidayName || daySummary.total > 0) && onDateClick(day)}
                            className={cn(
                                "min-h-[70px] sm:min-h-[100px] p-1.5 sm:p-3 border-r border-b border-border/40 transition-all group relative overflow-hidden",
                                (holidayName && daySummary.total === 0) ? "cursor-default opacity-80" : "cursor-pointer hover:bg-primary/5 hover:border-primary/20 hover:z-10",
                                isTodayDate && "bg-primary/[0.02]",
                                viewMode === 'month' && !isCurrentMonth && "bg-muted/10 opacity-30",
                                (idx + 1) % 7 === 0 && "border-r-0",
                                viewMode === 'week' && "min-h-[100px] sm:min-h-[150px]"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-xs sm:text-sm font-bold w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-all shrink-0",
                                    isTodayDate
                                        ? "bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/20"
                                        : "text-foreground-secondary group-hover:text-primary group-hover:bg-primary/10"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {holidayName && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm animate-in fade-in zoom-in duration-300 max-w-[calc(100%-44px)] overflow-hidden">
                                        <Gift className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter hidden sm:inline truncate" title={holidayName}>{holidayName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:block space-y-1 mt-1">
                                {shifts.map((user) => (
                                    <div
                                        key={user._id}
                                        className="text-[9px] font-black px-2 py-1 w-full rounded-lg border border-border/40 text-foreground-secondary hover:bg-muted bg-surface transition-all flex items-center justify-between"
                                    >
                                        <span className="truncate max-w-[80%]">{user.firstName} {user.lastName}</span>
                                    </div>
                                ))}

                                {daySummary.total > shifts.length && (
                                    <div className="text-[9px] font-black text-foreground-tertiary px-1.5 pt-1 uppercase tracking-tighter opacity-60">
                                        + {daySummary.total - shifts.length} more
                                    </div>
                                )}
                            </div>

                            {/* Mobile Indicators - Dots shown only on mobile */}
                            <div className="flex sm:hidden flex-wrap gap-1 mt-2 justify-center">
                                {shifts.map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                                ))}
                                {daySummary.total > shifts.length && <div className="text-[8px] font-black text-primary leading-none">+</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
