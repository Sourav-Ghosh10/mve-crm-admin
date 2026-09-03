import React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useAppSelector } from '../../store/hooks';

interface TimezoneDualViewProps {
    startTime: string | Date;
    endTime?: string | Date; // Optional for range
    primaryTimezone: string; // Employee/Client TZ
    secondaryTimezone: string; // Admin/Viewer TZ
    label?: string;
    showDate?: boolean;
    showTime?: boolean;
    variant?: 'default' | 'minimal' | 'compact';
}

const TimezoneDualView: React.FC<TimezoneDualViewProps> = ({
    startTime,
    endTime,
    primaryTimezone,
    secondaryTimezone,
    label,
    showDate = false,
    showTime = true,
    variant = 'default'
}) => {
    const timezoneView = useAppSelector((state) => state.ui.timezoneView);
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    const formatStr = showDate 
        ? (showTime ? 'MMM dd, HH:mm' : 'MMM dd, yyyy') 
        : 'hh:mm a';

    let mainStart: string, mainTZAbbr: string, mainEnd: string | null, subStart: string, subTZAbbr: string, subEnd: string | null, subLabel: string, mainTZ: string, subTZ: string;

    try {
        const isEmployeeView = timezoneView === 'employee';

        // Define which is main and which is sub based on preference
        mainTZ = isEmployeeView ? primaryTimezone : secondaryTimezone;
        subTZ = isEmployeeView ? secondaryTimezone : primaryTimezone;

        mainStart = formatInTimeZone(start, mainTZ, formatStr);
        mainTZAbbr = formatInTimeZone(start, mainTZ, 'z');
        mainEnd = end ? formatInTimeZone(end, mainTZ, formatStr) : null;

        subStart = formatInTimeZone(start, subTZ, formatStr);
        subTZAbbr = formatInTimeZone(start, subTZ, 'z');
        subEnd = end ? formatInTimeZone(end, subTZ, formatStr) : null;

        subLabel = isEmployeeView ? "Your time:" : "Employee's View:";
    } catch (error) {
        console.error('Error formatting timezone:', error);
        return (
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-500 text-[10px] font-mono">
                FORMAT_ERROR: CHECK_TZ_STRINGS
            </div>
        );
    }

    if (variant === 'minimal' || variant === 'compact') {
        const isSameTimezone = mainTZ === subTZ || mainTZAbbr === subTZAbbr;
        return (
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground font-mono whitespace-nowrap">
                    <span>{mainStart}{mainEnd ? ` - ${mainEnd}` : ''}</span>
                    <span className="text-[10px] text-primary/80 font-medium px-1.5 py-0.5 rounded bg-primary/10 tracking-tight font-sans">
                        {mainTZAbbr}
                    </span>
                </div>
                {!isSameTimezone && (
                    <div className="flex items-center gap-1 text-[10px] text-foreground-tertiary tracking-tight whitespace-nowrap">
                        <span className="opacity-75">{subLabel}</span>
                        <span className="font-mono">{subStart}{subEnd && ` - ${subEnd}`}</span>
                        <span className="opacity-75">({subTZAbbr})</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1.5 p-3.5 rounded-2xl bg-surface/30 backdrop-blur-sm border border-border/40 shadow-sm hover:border-primary/20 transition-all duration-300 group">
            {label && <span className="text-[10px] uppercase tracking-widest text-primary/70 font-black mb-0.5">{label}</span>}

            <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-black text-foreground tracking-tight">
                    {mainStart}{mainEnd ? ` - ${mainEnd}` : ''}
                </span>
                <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                    {mainTZAbbr}
                </span>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-border/20">
                <span className="text-[10px] font-medium text-foreground-tertiary italic tracking-wider whitespace-nowrap">{subLabel}</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground-secondary">
                    <span className="bg-muted px-2 py-0.5 rounded-md text-[11px] font-mono">{subStart}{subEnd && ` - ${subEnd}`}</span>
                    <span className="text-[10px] font-medium text-foreground-tertiary italic tracking-tight">({subTZAbbr})</span>
                </div>
            </div>
        </div>
    );
};

export default TimezoneDualView;
