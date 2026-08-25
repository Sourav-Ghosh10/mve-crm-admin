import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setTimezoneView } from '../../store/slices/uiSlice';
import { cn } from '../../lib/utils';
import Button from './Button';

import TimezoneSelector from './TimezoneSelector';

interface TimezoneToggleProps {
    className?: string;
    variant?: 'vertical' | 'horizontal';
}

const TimezoneToggle: React.FC<TimezoneToggleProps> = ({ className, variant = 'vertical' }) => {
    const dispatch = useAppDispatch();
    const timezoneView = useAppSelector((state) => state.ui.timezoneView);

    return (
        <div className={cn(
            "relative z-40",
            variant === 'vertical' ? "flex flex-col gap-1.5" : "flex flex-row items-center gap-3",
            className
        )}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-tertiary px-1 whitespace-nowrap">
                Timezone View
            </span>
            <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm self-start">
                <div onClick={() => dispatch(setTimezoneView('admin'))}>
                    <TimezoneSelector />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(setTimezoneView('employee'))}
                    className={cn(
                        "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2",
                        timezoneView === 'employee'
                            ? "bg-surface shadow-md text-primary border border-border/50 scale-[1.02]"
                            : "text-foreground-secondary hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    <UserIcon className={cn("w-3.5 h-3.5", timezoneView === 'employee' ? "animate-pulse" : "")} />
                    Employee Time
                </Button>
            </div>
        </div>
    );
};

export default TimezoneToggle;
