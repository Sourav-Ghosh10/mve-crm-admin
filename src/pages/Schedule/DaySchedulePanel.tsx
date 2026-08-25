import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { X, Edit2, Clock, Trash2, ChevronLeft, ChevronRight, Info, Palmtree, Maximize2, Minimize2 } from 'lucide-react';
import { format, differenceInHours, parse } from 'date-fns';
// import { formatAdminDate, getAdminDateKey } from '../../utils/dateUtils';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils';
// import { formatShiftRange } from '../../utils/dateUtils';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table/Table';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Avatar from '../../components/common/Avatar';
import TimezoneDualView from '../../components/common/TimezoneDualView';
import TimezoneToggle from '../../components/common/TimezoneToggle';
import { getAdminDateKey, getZonedDate } from '../../utils/dateUtils';
import { useAppSelector } from '../../store/hooks';
import { isSameDay, parseISO } from 'date-fns';
import type { EmployeeRoster, ShiftData } from '../../types/schedule.types';
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";
import { SearchInput } from '../../components/common/Search/SearchInput';

interface DaySchedulePanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    rosters: EmployeeRoster[];
    onEditShift: (employeeId: string, shift: ShiftData, index: number) => void;
    onDeleteShift: (employeeId: string, shift: ShiftData, index: number) => Promise<void>;
    onAddShift: (employeeId: string) => void;
    viewType?: 'grid' | 'list' | 'calendar';
    loading?: boolean;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    onSearchChange?: (search: string) => void;
}

interface ScheduleRow {
    roster: EmployeeRoster;
    shift: ShiftData;
    tIdx: number;
    start?: string;
    end?: string;
    totalShiftSlots: number;
    isUnavailable: boolean;
    _id: string;
}

const ITEMS_PER_PAGE = 10;

const DaySchedulePanel: React.FC<DaySchedulePanelProps> = ({
    isOpen,
    onClose,
    selectedDate,
    rosters,
    onEditShift,
    onDeleteShift,
    onAddShift,
    viewType = 'grid',
    loading = false,
    currentPage: propCurrentPage,
    totalPages: propTotalPages,
    onPageChange,
    onSearchChange,
}) => {
    const adminTimezone = useAppSelector((state) => state.ui.selectedTimezone);
    const { hasPermission: canManageSchedule } = usePermissions(PERMISSIONS.SCHEDULE_MANAGE);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [localCurrentPage, setLocalCurrentPage] = useState(1);

    // Resizable sidebar state
    const MIN_WIDTH = 400;
    const MAX_WIDTH = 1200;
    const DEFAULT_WIDTH = 700;
    const [panelWidth, setPanelWidth] = useState(() => {
        const saved = localStorage.getItem('daySchedulePanelWidth');
        return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parseInt(saved, 10))) : DEFAULT_WIDTH;
    });
    const isResizingRef = useRef(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const [isMaximized, setIsMaximized] = useState(false);

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
        if (!isMaximized) {
            setPanelWidth(window.innerWidth);
        } else {
            const saved = localStorage.getItem('daySchedulePanelWidth');
            setPanelWidth(saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parseInt(saved, 10))) : DEFAULT_WIDTH);
        }
    };

    const isWide = isMaximized || panelWidth > 800;

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizingRef.current) return;
            const newWidth = window.innerWidth - moveEvent.clientX;
            const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
            setPanelWidth(clamped);
        };

        const onMouseUp = () => {
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Persist width
            setPanelWidth(prev => {
                localStorage.setItem('daySchedulePanelWidth', String(prev));
                return prev;
            });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    // Reset to full width on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setPanelWidth(window.innerWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isServerSidePagination = propCurrentPage !== undefined && propTotalPages !== undefined;
    const isServerSideSearch = onSearchChange !== undefined;
    const currentPage = isServerSidePagination ? propCurrentPage : localCurrentPage;

    const handlePageChange = (newPage: number | ((prev: number) => number)) => {
        const next = typeof newPage === 'function' ? (newPage as (prev: number) => number)(currentPage) : newPage;
        if (isServerSidePagination) {
            onPageChange?.(next);
        } else {
            setLocalCurrentPage(next);
        }
    };

    // Trigger server-side search when debounced term changes
    React.useEffect(() => {
        if (isServerSideSearch) {
            onSearchChange?.(debouncedSearchTerm.trim());
        }
    }, [debouncedSearchTerm, isServerSideSearch, onSearchChange]);

    // Reset search when opening or changing dates
    React.useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen, selectedDate]);

    const employeesWithShifts = useMemo(() => {
        if (!selectedDate) return [];
        const targetDateKey = getAdminDateKey(selectedDate);

        return rosters
            .map(roster => {
                const shiftsForDay = Object.entries(roster.shiftData || {})
                    .filter(([key]) => {
                        if (key === targetDateKey) return true;
                        try {
                            return isSameDay(parseISO(key), selectedDate);
                        } catch {
                            return false;
                        }
                    })
                    .map(([key, shift]) => ({ ...shift, date: key }));
                return {
                    roster,
                    shifts: shiftsForDay,
                };
            })
            .filter(item => item.shifts.length > 0);
    }, [rosters, selectedDate]);

    const filteredEmployees = useMemo(() => {
        // If server-side search is enabled, don't filter locally
        if (isServerSideSearch) {
            return employeesWithShifts;
        }

        // Local filtering when no server-side search
        if (!searchTerm.trim()) return employeesWithShifts;
        const lowerSearch = searchTerm.trim().toLowerCase();
        return employeesWithShifts.filter(({ roster }) => {
            const firstName = roster.Info?.firstName?.toLowerCase() || '';
            const lastName = roster.Info?.lastName?.toLowerCase() || '';
            const fullName = `${firstName} ${lastName}`;
            return fullName.includes(lowerSearch) || roster.employeeId?.toLowerCase().includes(lowerSearch);
        });
    }, [employeesWithShifts, searchTerm, isServerSideSearch]);

    const totalPages = propTotalPages !== undefined ? propTotalPages : Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = isServerSidePagination
        ? (isServerSideSearch ? employeesWithShifts : filteredEmployees)
        : filteredEmployees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const calculateHours = (start?: string, end?: string) => {
        if (!start || !end) return 0;
        try {
            const startDate = parse(start, 'HH:mm', new Date());
            const endDate = parse(end, 'HH:mm', new Date());
            let diff = differenceInHours(endDate, startDate);
            if (diff < 0) diff += 24; // Handle overnight shifts
            return diff;
        } catch {
            return 0;
        }
    };

    if (!selectedDate) return null;

    return (
        <>
            <div
                className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm z-70 transition-opacity duration-300', isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}
                onClick={onClose}
            />

            <div
                ref={panelRef}
                style={{ width: (window.innerWidth < 640 || isMaximized) ? '100%' : `${panelWidth}px` }}
                className={cn('fixed top-0 right-0 h-full bg-background border-l border-border/50 shadow-2xl z-70 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)', isOpen ? 'translate-x-0' : 'translate-x-full')}
            >
                {/* Resize Handle */}
                <div
                    onMouseDown={handleResizeStart}
                    className="hidden sm:flex absolute left-0 top-0 bottom-0 w-2 cursor-col-resize items-center justify-center z-50 group hover:bg-primary/10 transition-colors"
                >
                    <div className="w-[3px] h-12 rounded-full bg-border/40 group-hover:bg-primary/60 transition-colors" />
                </div>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-border/50 bg-surface/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">{format(selectedDate, 'EEEE')}</h2>
                                <p className="text-sm font-bold text-foreground-tertiary">{format(selectedDate, 'MMMM d, yyyy')}</p>
                                <div className="mt-4">
                                    <TimezoneToggle variant="horizontal" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleMaximize}
                                    className="p-2 hover:bg-muted rounded-xl transition-colors hidden sm:block"
                                    title={isMaximized ? "Restore" : "Maximize"}
                                >
                                    {isMaximized ? <Minimize2 className="w-5 h-5 text-foreground-tertiary" /> : <Maximize2 className="w-5 h-5 text-foreground-tertiary" />}
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {viewType !== 'calendar' && employeesWithShifts.length > 1 && (
                            <div className="flex gap-4">
                                <div className="flex-1 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Active Shifts</div>
                                    <div className="text-2xl font-black text-primary">
                                        {employeesWithShifts.reduce((acc, curr) =>
                                            acc + curr.shifts.filter(s => s.shiftType !== 'off').length, 0
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 px-4 py-3 bg-muted/30 border border-border/50 rounded-2xl">
                                    <div className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest mb-1">Total Personnel</div>
                                    <div className="text-2xl font-black text-foreground">
                                        {employeesWithShifts.length}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    {viewType !== 'calendar' && (employeesWithShifts.length > 1 || searchTerm !== '') && (
                        <div className="p-4 border-b border-border/30">
                            <SearchInput
                                value={searchTerm}
                                onChange={(val) => setSearchTerm(val)}
                                searchKey="day-schedule-panel-search"
                                placeholder="Search employees..."
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] z-10">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Fetching Schedules...</p>
                            </div>
                        ) : paginatedEmployees.length === 0 ? (
                            <EmptyState title="No Records" description="No schedules found for this date." className="py-20" />
                        ) : isWide ? (
                            <div className="animate-in fade-in duration-500">
                                <Table
                                    columns={[
                                        {
                                            _id: 'employee',
                                            label: 'Employee',
                                            format: (_, row: ScheduleRow) => (
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={row.roster.Info?.profilePicture}
                                                        firstName={row.roster.Info?.firstName}
                                                        lastName={row.roster.Info?.lastName}
                                                        size="sm"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground text-xs">{row.roster.Info?.firstName} {row.roster.Info?.lastName}</span>
                                                        <span className="text-[9px] font-black text-foreground-tertiary uppercase tracking-wider">{row.roster.employeeId}</span>
                                                    </div>
                                                </div>
                                            )
                                        },
                                        {
                                            _id: 'shiftType',
                                            label: 'Type',
                                            format: (_, row: ScheduleRow) => (
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                                                        row.shift.shiftType === 'Leave' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                                                            row.shift.shiftType === 'Holiday' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                                row.shift.shiftType === 'off' ? "bg-slate-500/10 text-slate-600 border-slate-500/20" :
                                                                    "bg-primary/10 text-primary border-primary/20"
                                                    )}>
                                                        {row.shift.shiftType === 'Leave' ? 'LEAVE' : row.shift.shiftType === 'Holiday' ? 'HOLIDAY' : row.shift.shiftType === 'off' ? 'OFF' : `SHIFT`}
                                                    </div>
                                                </div>
                                            )
                                        },
                                        {
                                            _id: 'timing',
                                            label: 'Scheduled Timing',
                                            format: (_, row: ScheduleRow) => {
                                                if (row.shift.shiftType === 'off' || row.shift.shiftType === 'Leave' || row.shift.shiftType === 'Holiday') return <span className="text-xs text-foreground-tertiary">N/A</span>;

                                                const employeeTZ = row.roster.employment?.timezone || 'Asia/Kolkata';

                                                const combine = (timeStr?: string) => {
                                                    if (!timeStr || !selectedDate) return undefined;
                                                    return getZonedDate(selectedDate, timeStr, employeeTZ);
                                                };

                                                const sDate = combine(row.start);
                                                const eDate = combine(row.end);

                                                if (!sDate) return <span className="text-xs text-foreground-tertiary">-</span>;

                                                return (
                                                    <TimezoneDualView
                                                        startTime={sDate}
                                                        endTime={eDate}
                                                        primaryTimezone={employeeTZ}
                                                        secondaryTimezone={adminTimezone}
                                                        variant="minimal"
                                                    />
                                                );
                                            }
                                        },
                                        {
                                            _id: 'hours',
                                            label: 'Hours',
                                            format: (_, row: ScheduleRow) => {
                                                const hours = calculateHours(row.start || "", row.end || "");
                                                if (hours === 0) return <span className="text-xs text-foreground-tertiary">-</span>;
                                                return (
                                                    <div className="text-xs font-black text-foreground">
                                                        {hours} <span className="text-[9px] text-foreground-tertiary font-bold">hrs</span>
                                                    </div>
                                                );
                                            }
                                        },
                                        {
                                            _id: 'actions',
                                            label: 'Actions',
                                            align: 'right',
                                            format: (_, row: ScheduleRow) => (
                                                <div className="flex justify-end gap-1">
                                                    {canManageSchedule && (row.shift.shiftType !== 'Leave' && row.shift.shiftType !== 'Holiday') && (
                                                        <>
                                                            <button onClick={() => onEditShift(row.roster.employeeId, row.shift, row.tIdx)} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            {row.totalShiftSlots > 1 && (
                                                                <button onClick={() => onDeleteShift(row.roster.employeeId, row.shift, row.tIdx)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {canManageSchedule && row.tIdx === 0 && !row.isUnavailable && (
                                                        <Button variant="ghost" size="sm" onClick={() => onAddShift(row.roster.employeeId)} className="h-8 px-2 text-[10px] font-black">
                                                            + ADD
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        }
                                    ]}
                                    rows={paginatedEmployees.flatMap(({ roster, shifts }) => {
                                        const totalShiftSlots = shifts.reduce((acc, s) => {
                                            const isOut = s.shiftType === 'off' || s.shiftType === 'Leave' || s.shiftType === 'Holiday';
                                            const times = Array.isArray(s.startTime) ? s.startTime : [s.startTime].filter(Boolean);
                                            return acc + (isOut && times.length === 0 ? 1 : times.length);
                                        }, 0);

                                        const isUnavailable = shifts.some(s => s.shiftType === 'Leave' || s.shiftType === 'Holiday');

                                        return shifts.flatMap((shift) => {
                                            const isOutDay = shift.shiftType === 'off' || shift.shiftType === 'Leave' || shift.shiftType === 'Holiday';
                                            const startTimes = Array.isArray(shift.startTime) ? shift.startTime : [shift.startTime].filter(Boolean);
                                            const renderTimes = isOutDay && startTimes.length === 0 ? [undefined] : startTimes;

                                            return renderTimes.map((start, tIdx) => {
                                                const end = Array.isArray(shift.endTime) ? shift.endTime[tIdx] : (tIdx === 0 ? shift.endTime : undefined);
                                                return {
                                                    roster,
                                                    shift,
                                                    tIdx,
                                                    start,
                                                    end,
                                                    totalShiftSlots,
                                                    isUnavailable,
                                                    _id: `${roster._id}-${shift._id}-${tIdx}`
                                                };
                                            });
                                        });
                                    })}
                                    className="rounded-[2rem] border border-border/40 overflow-hidden shadow-sm"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Active Deployments</h3>
                                        <p className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-widest">{paginatedEmployees.length} Personnel Scheduled</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {paginatedEmployees.map(({ roster, shifts }) => (
                                        <div key={roster._id} className="bg-surface rounded-[2rem] border border-border/40 overflow-hidden shadow-sm">
                                            <div className="p-5 border-b border-border/30 bg-muted/5 flex items-center gap-3">
                                                <Avatar
                                                    src={roster.Info?.profilePicture}
                                                    firstName={roster.Info?.firstName}
                                                    lastName={roster.Info?.lastName}
                                                    size="md"
                                                    className="shadow-sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-foreground truncate">{roster.Info?.firstName} {roster.Info?.lastName}</h3>
                                                    <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-wider">{roster.employeeId}</p>
                                                </div>
                                                {(() => {
                                                    const hasLeave = shifts.some(s => s.shiftType === 'Leave');
                                                    const hasHoliday = shifts.some(s => s.shiftType === 'Holiday');

                                                    if (hasLeave || hasHoliday) {
                                                        return (
                                                            <div className={cn(
                                                                "px-2 py-1 rounded-lg flex items-center gap-1 animate-in fade-in zoom-in duration-300 border",
                                                                hasHoliday ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "bg-orange-500/10 border-orange-500/20 text-orange-600"
                                                            )}>
                                                                <Palmtree className="w-3 h-3" />
                                                                <span className="text-[9px] font-black uppercase tracking-tight">
                                                                    {hasHoliday ? 'HOLIDAY' : 'OUT OF OFFICE'}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    if (!canManageSchedule) return null;

                                                    return (
                                                        <Button variant="ghost" size="sm" onClick={() => onAddShift(roster.employeeId)} className="rounded-lg h-8 px-2 text-[10px] font-black">
                                                            + ADD
                                                        </Button>
                                                    );
                                                })()}
                                            </div>

                                            <div className="p-5 space-y-4">
                                                {(() => {
                                                    const totalShiftSlots = shifts.reduce((acc, s) => {
                                                        const isOut = s.shiftType === 'off' || s.shiftType === 'Leave' || s.shiftType === 'Holiday';
                                                        const times = Array.isArray(s.startTime) ? s.startTime : [s.startTime].filter(Boolean);
                                                        return acc + (isOut && times.length === 0 ? 1 : times.length);
                                                    }, 0);

                                                    return shifts.flatMap((shift) => {
                                                        const isOutDay = shift.shiftType === 'off' || shift.shiftType === 'Leave' || shift.shiftType === 'Holiday';
                                                        const isOff = shift.shiftType === 'off';
                                                        const startTimes = Array.isArray(shift.startTime) ? shift.startTime : [shift.startTime].filter(Boolean);

                                                        // Ensure at least one loop for OUT/OFF shifts even if they have no times
                                                        const renderTimes = isOutDay && startTimes.length === 0 ? [undefined] : startTimes;

                                                        return renderTimes.map((start, tIdx) => {
                                                            const end = Array.isArray(shift.endTime) ? shift.endTime[tIdx] : (tIdx === 0 ? shift.endTime : undefined);
                                                            // const attendance = getMockAttendance(roster.employeeId, selectedDate, start || "");
                                                            const hours = calculateHours(start || "", end || "");

                                                            return (
                                                                <div key={`${shift._id}-${tIdx}`} className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                                                                                {isOutDay ? <></> : `Shift ${tIdx + 1}`}
                                                                            </div>
                                                                            <span className="text-xs font-bold text-foreground">
                                                                                {shift.shiftType === 'Leave' ? 'ON LEAVE' : shift.shiftType === 'Holiday' ? 'HOLIDAY' : isOff ? 'DAY OFF' : 'SHIFT'}
                                                                            </span>
                                                                        </div>
                                                                        {(() => {
                                                                            const isOut = shift.shiftType === 'Leave' || shift.shiftType === 'Holiday';
                                                                            if (isOut) return null;

                                                                            if (!canManageSchedule) return null;

                                                                            return (
                                                                                <div className="flex gap-2">
                                                                                    <button onClick={() => onEditShift(roster.employeeId, shift, tIdx)} className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    {totalShiftSlots > 1 && (
                                                                                        <button onClick={() => onDeleteShift(roster.employeeId, shift, tIdx)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    {!isOff && shift.shiftType !== 'Leave' && shift.shiftType !== 'Holiday' && (
                                                                        <>
                                                                            {/* Timing Details Grid */}
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <div className="p-3 bg-muted/5 border border-border/40 rounded-2xl">
                                                                                    <div className="text-[9px] font-black text-foreground-tertiary uppercase mb-1">Scheduled</div>
                                                                                    {(() => {
                                                                                        const employeeTZ = roster.employment?.timezone || 'Asia/Kolkata';

                                                                                        const combine = (timeStr?: string) => {
                                                                                            if (!timeStr || !selectedDate) return undefined;
                                                                                            return getZonedDate(selectedDate, timeStr, employeeTZ);
                                                                                        };

                                                                                        const sDate = combine(start);
                                                                                        const eDate = combine(end);

                                                                                        if (!sDate) return <span className="text-xs text-foreground-tertiary">-</span>;

                                                                                        return (
                                                                                            <TimezoneDualView
                                                                                                startTime={sDate}
                                                                                                endTime={eDate}
                                                                                                primaryTimezone={employeeTZ}
                                                                                                secondaryTimezone={adminTimezone}
                                                                                                variant="minimal"
                                                                                            />
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}

                                                                    {/* Holiday Details */}
                                                                    {shift.shiftType === 'Holiday' && (
                                                                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Palmtree className="w-3.5 h-3.5 text-amber-600" />
                                                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Public Holiday</span>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="text-[10px] font-bold text-foreground flex justify-between">
                                                                                    <span className="text-foreground-tertiary uppercase">Event</span>
                                                                                    <span className="font-black text-amber-600 truncate max-w-[150px]" title={shift.holidayName || ""}>{shift.holidayName || 'N/A'}</span>
                                                                                </div>
                                                                                <div className="mt-2 text-[10px] font-bold text-foreground">
                                                                                    <span className="text-foreground-tertiary uppercase block mb-1">Notice</span>
                                                                                    <p className="bg-muted/30 p-2 rounded-lg italic">"Enjoy your holiday!"</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Leave Details (If 'Leave') */}
                                                                    {shift.shiftType === 'Leave' && (
                                                                        <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Palmtree className="w-3.5 h-3.5 text-orange-600" />
                                                                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Leave Details</span>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="text-[10px] font-bold text-foreground flex justify-between">
                                                                                    <span className="text-foreground-tertiary uppercase">Type</span>
                                                                                    <span className="font-black text-orange-600">{shift.leaveType || 'N/A'}</span>
                                                                                </div>
                                                                                {shift.isHalfDayLeave && (
                                                                                    <div className="text-[10px] font-bold text-foreground flex justify-between">
                                                                                        <span className="text-foreground-tertiary uppercase">Duration</span>
                                                                                        <span className="font-black">Half Day</span>
                                                                                    </div>
                                                                                )}
                                                                                {shift.leaveReason && (
                                                                                    <div className="mt-2 text-[10px] font-bold text-foreground">
                                                                                        <span className="text-foreground-tertiary uppercase block mb-1">Reason</span>
                                                                                        <p className="bg-muted/30 p-2 rounded-lg italic">"{shift.leaveReason}"</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {!isOff && shift.shiftType !== 'Holiday' && (
                                                                        <div className="flex items-center justify-between px-2 pt-1 border-t border-border/30">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Info className="w-3 h-3 text-foreground-tertiary" />
                                                                                <span className="text-[10px] font-bold text-foreground-tertiary">{shift.notes || 'No notes provided'}</span>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-xs font-black text-foreground">
                                                                                    {hours} <span className="text-[10px] text-foreground-tertiary font-bold">HRS</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - Only show if not in calendar view and more than one page exists */}
                    {viewType !== 'calendar' && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-border/50 bg-surface/80 backdrop-blur-sm flex items-center justify-between">
                            <div className="text-xs font-black text-foreground-tertiary uppercase tracking-widest">
                                Page <span className="text-primary">{currentPage}</span> of {totalPages}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(p => p - 1)}
                                    className="p-2.5 bg-surface border-2 border-border/80 rounded-2xl disabled:opacity-30 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm flex items-center justify-center active:scale-95 disabled:pointer-events-none"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(p => p + 1)}
                                    className="p-2.5 bg-surface border-2 border-border/80 rounded-2xl disabled:opacity-30 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm flex items-center justify-center active:scale-95 disabled:pointer-events-none"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default DaySchedulePanel;
