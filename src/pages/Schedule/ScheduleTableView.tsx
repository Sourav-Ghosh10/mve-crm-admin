import React from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import Table, { type Column } from '../../components/common/Table/Table';
import type { EmployeeRoster } from '../../types/schedule.types';
import { cn } from '../../lib/utils';
import { Coffee } from 'lucide-react';
import TimezoneDualView from '../../components/common/TimezoneDualView';
import { useAppSelector } from '../../store/hooks';
import { getZonedDate } from '../../utils/dateUtils';

interface ScheduleTableViewProps {
    rosters: EmployeeRoster[];
    startDate: string;
    endDate: string;
}

interface FlatShift {
    _id: string;
    employeeName: string;
    date: string;
    shiftType: string;
    startTime: string[];
    endTime: string[];
    status: string;
    employeeTimezone: string;
    adminTimezone: string;
}

const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({ rosters }) => {
    const adminTimezone = useAppSelector((state) => state.ui.selectedTimezone);

    // Flatten roaster data for a table
    const flatRows: FlatShift[] = [];

    rosters.forEach(roster => {
        Object.entries(roster.shiftData || {}).forEach(([dateKey, shift]) => {
            if (shift.shiftType === 'off') return;

            const startTimes = Array.isArray(shift.startTime) ? shift.startTime : [shift.startTime];
            const endTimes = Array.isArray(shift.endTime) ? shift.endTime : [shift.endTime];

            flatRows.push({
                _id: `${roster._id}-${dateKey}`,
                employeeName: `${roster.Info.firstName} ${roster.Info.lastName}`,
                date: dateKey,
                shiftType: shift.shiftType || 'day',
                startTime: startTimes.filter(Boolean) as string[],
                endTime: endTimes.filter(Boolean) as string[],
                status: isSameDay(parseISO(dateKey), new Date()) ? 'Logged In' : 'Logged Out',
                employeeTimezone: roster.employment?.timezone || 'Asia/Kolkata',
                adminTimezone: adminTimezone,
            });
        });
    });

    const columns: Column<FlatShift>[] = [
        {
            _id: 'employeeName',
            label: 'Employee',
            format: (val) => <span className="font-black text-foreground">{String(val)}</span>,
        },
        {
            _id: 'date',
            label: 'Date',
            format: (val) => <span className="text-foreground-secondary font-bold">{format(parseISO(String(val)), 'MMM d, yyyy')}</span>,
        },
        {
            _id: 'shiftType',
            label: 'Shift',
            format: (val) => (
                <div className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit",
                    val === 'day' ? "bg-blue-500/5 border-blue-500/10 text-blue-600" :
                        val === 'night' ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-600" :
                            "bg-primary/5 border-primary/20 text-primary"
                )}>
                    {String(val) === 'off' ? 'OFF' : 'SHIFT'}
                </div>
            ),
        },
        {
            _id: 'time',
            label: 'Schedule',
            format: (_, row) => {
                return (
                    <div className="space-y-2">
                        {row.startTime.map((start, i) => {
                            const combine = (timeStr: string) => {
                                return getZonedDate(row.date, timeStr, row.employeeTimezone);
                            };
                            return (
                                <TimezoneDualView
                                    key={i}
                                    startTime={combine(start)}
                                    endTime={combine(row.endTime[i])}
                                    primaryTimezone={row.employeeTimezone}
                                    secondaryTimezone={row.adminTimezone}
                                    variant="minimal"
                                />
                            );
                        })}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="bg-surface rounded-3xl border border-border/40 overflow-hidden shadow-2xl shadow-black/[0.02]">
            <Table
                columns={columns}
                rows={flatRows}
                className="border-none"
                emptyState={
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4">
                            <Coffee className="w-8 h-8 text-foreground-tertiary" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">No Shifts Found</h3>
                        <p className="text-sm text-foreground-tertiary mt-1">Try selecting different employees or date range.</p>
                    </div>
                }
            />
        </div>
    );
};

export default ScheduleTableView;
