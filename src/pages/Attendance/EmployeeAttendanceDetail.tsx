import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
    Calendar,
    AlertCircle,
    ArrowRight,
    MapPin,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from "date-fns";
import { cn } from "../../lib/utils";
import { attendanceService } from "../../services/attendanceService";
import { userService } from "../../services/userService";
import Table, { type Column } from "../../components/common/Table";
import type { Attendance } from "../../types/attendance.types";
import { Card, CardContent } from "../../components/common/Card";
import Button from "../../components/common/Button";
import BackButton from "../../components/common/BackButton";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Input from "../../components/common/Input/Input";
import Pagination from "../../components/common/Pagination";
import FilterDropdown from "../../components/common/Filter/FilterDropdown";
import TimezoneDualView from "../../components/common/TimezoneDualView";
import TimezoneToggle from "../../components/common/TimezoneToggle";
import { getOfficeTimezone } from "../../utils/dateUtils";
import { resolveCheckInLocation } from "../../utils/attendanceLocationUtils";

type FilterType = "weekly" | "monthly" | "custom";

// Treat YYYY-MM-DD as a "date-only" value in local time (avoid UTC shifting).
const ymdToLocalDate = (value: string): Date => {
    const ymd = (value || "").slice(0, 10);
    const [y, m, d] = ymd.split("-").map((n) => Number(n));
    if (!y || !m || !d) return new Date(value);
    return new Date(y, m - 1, d);
};

const ymdInRangeInclusive = (value: string, start: string, end: string): boolean => {
    const v = (value || "").slice(0, 10);
    const s = (start || "").slice(0, 10);
    const e = (end || "").slice(0, 10);
    if (!v || !s || !e) return true;
    // Lexicographic works for YYYY-MM-DD
    return v >= s && v <= e;
};

const EmployeeAttendanceDetail: React.FC = () => {
    const { employeeId } = useParams<{ employeeId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Filter States
    const [filterType, setFilterType] = useState<FilterType>(
        (searchParams.get("type") as FilterType) || "weekly"
    );
    const [startDate, setStartDate] = useState<string>(
        searchParams.get("start") || format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    );
    const [endDate, setEndDate] = useState<string>(
        searchParams.get("end") || format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
    );

    // Pagination State
    const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
    const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);

    // Sync state to URL
    useEffect(() => {
        const params: Record<string, string> = {
            type: filterType,
            start: startDate,
            end: endDate,
            page: page.toString(),
            limit: limit.toString()
        };
        setSearchParams(params, { replace: true });
    }, [filterType, startDate, endDate, page, limit, setSearchParams]);

    // Fetch Employee Info
    const { data: employee, isLoading: isLoadingEmployee } = useQuery({
        queryKey: ["employee", employeeId],
        queryFn: () => userService.getById(employeeId!),
        enabled: !!employeeId,
    });

    // Fetch Attendance Data
    const { data: attendanceData, isLoading: isLoadingAttendance, isFetching } = useQuery({
        queryKey: ["employee-attendance", employeeId, filterType, startDate, endDate, page, limit],
        queryFn: () => attendanceService.getAll({
            userId: employeeId,
            employeeId: employeeId,
            startDate: startDate,
            endDate: endDate,
            page,
            limit
        }),
        enabled: !!employeeId && !!startDate && !!endDate,
        placeholderData: keepPreviousData,
    });

    const handleFilterChange = (type: FilterType) => {
        setFilterType(type);
        const now = new Date();
        if (type === "weekly") {
            setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
            setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        } else if (type === "monthly") {
            setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
            setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        }
        setPage(1); // Reset page on filter change
    };

    const fadedStatuses = ['absent', 'on-leave', 'leave', 'holiday', 'weekend', 'scheduled'];

    const columns: Column<Attendance>[] = [
        {
            _id: "date",
            label: "Date",
            format: (value: unknown, row: Attendance) => (
                <div className={cn(
                    "flex flex-col transition-opacity duration-300",
                    fadedStatuses.includes(row.status?.toLowerCase()) && "opacity-40"
                )}>
                    <span className="font-bold text-foreground">
                        {format(ymdToLocalDate(String(value || "")), "MMM dd, yyyy")}
                    </span>
                    <span className="text-[10px] text-foreground-tertiary uppercase font-black tracking-widest">
                        {format(ymdToLocalDate(String(value || "")), "EEEE")}
                    </span>
                </div>
            )
        },
        {
            _id: "checkIn",
            label: "Check In",
            format: (value: unknown, employee: Attendance) => {
                const val = value as { time?: string } | undefined;
                return (
                    <div className={cn(
                        "flex items-center gap-2 transition-opacity duration-300",
                        fadedStatuses.includes(employee.status?.toLowerCase()) && "opacity-40"
                    )}>
                        {val?.time ? (
                            <TimezoneDualView
                                startTime={val.time}
                                primaryTimezone={employee?.employeeId?.employment?.timezone || 'Asia/Kolkata'}
                                secondaryTimezone={getOfficeTimezone()}
                            />
                        ) : (
                            <span className="font-mono font-bold text-sm text-foreground-tertiary">--:--</span>
                        )}
                    </div>
                );
            }
        },
        {
            _id: "clockInLocation",
            label: "Location",
            format: (_: unknown, row: Attendance) => {
                const isFaded = fadedStatuses.includes(row.status?.toLowerCase());
                const checkInLoc = resolveCheckInLocation(row);

                if (!checkInLoc || (!checkInLoc.address && !checkInLoc.latitude)) {
                    return <span className={cn("text-foreground-tertiary", isFaded && "opacity-40")}>-</span>;
                }

                const address = checkInLoc.address;
                const lat = checkInLoc.latitude;
                const lng = checkInLoc.longitude;

                if (!address && !lat) return <span className={cn("text-foreground-tertiary", isFaded && "opacity-40")}>-</span>;

                return (
                    <div className={cn(
                        "flex flex-col gap-1 py-1 transition-opacity duration-300",
                        isFaded && "opacity-40"
                    )}>
                        {address ? (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${lat || ''},${lng || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-1 max-w-[150px] hover:text-primary transition-colors group"
                                title="Click to view on Google Maps"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs text-foreground-secondary leading-normal font-medium line-clamp-1">
                                    {address}
                                </span>
                            </a>
                        ) : lat && lng ? (
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                                title="Click to view on Google Maps"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                            </a>
                        ) : (
                            <span className="text-foreground-tertiary">-</span>
                        )}
                    </div>
                );
            }
        },
        {
            _id: "checkOut",
            label: "Check Out",
            format: (value: unknown, row: Attendance) => {
                const val = value as { time?: string } | undefined;
                const sessions = row.sessions || [];
                const isCurrentlyWorking = sessions.length > 0 && !sessions[sessions.length - 1].checkOut;

                return (
                    <div className={cn(
                        "flex items-center gap-2 transition-opacity duration-300",
                        fadedStatuses.includes(row.status?.toLowerCase()) && "opacity-40"
                    )}>
                        <div className="relative inline-block group/session">
                            {isCurrentlyWorking ? (
                                <span className="text-primary font-black uppercase tracking-widest text-[9px] bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg animate-pulse shadow-sm shadow-primary/10">
                                    Working
                                </span>
                            ) : (row.checkOut?.time || val?.time) ? (
                                <TimezoneDualView
                                    startTime={row.checkOut?.time || val?.time || ""}
                                    primaryTimezone={employee?.employment?.timezone || 'Asia/Kolkata'}
                                    secondaryTimezone={getOfficeTimezone()}
                                />
                            ) : (
                                <span className="font-mono font-bold text-sm text-foreground-tertiary">--:--</span>
                            )}
                            {(row.sessions && row.sessions.length > 1) && !isCurrentlyWorking && (
                                <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[1.2rem] h-4.5 px-1 rounded-full bg-primary text-[9px] font-black text-white shadow-md ring-2 ring-surface z-10">
                                    {row.sessions.length > 2 ? '2+' : '2'}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            _id: "totalHours",
            label: "Duration",
            format: (_: unknown, row: Attendance) => {
                const isFaded = fadedStatuses.includes(row.status?.toLowerCase());
                const sessions = row.sessions || [];
                const isCurrentlyWorking = sessions.length > 0 && !sessions[sessions.length - 1].checkOut;

                // Show duration even if shift is ongoing, similar to the main Attendance Log
                const durationStr = row.netDurationString || row.totalDurationString || "";

                return (
                    <div className="flex flex-col">
                        <span className={cn(
                            "font-black text-foreground text-sm transition-opacity duration-300 uppercase",
                            isFaded && "opacity-40"
                        )}>
                            {durationStr || "-"}
                        </span>
                        {isCurrentlyWorking && !isFaded && (
                            <span className="text-[10px] text-primary font-black uppercase tracking-tighter animate-pulse">
                                Working
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            _id: "breakTime",
            label: "Breaks",
            format: (value: unknown, row: Attendance) => {
                const breaksCount = row.breaks?.length || 0;
                // Use totalBreakDurationString if available, otherwise calculate from value
                const durationStr = row.totalBreakDurationString;
                const breakMinutes = Number(value) || 0;
                const isFaded = fadedStatuses.includes(row.status?.toLowerCase());

                // Treat "0S" or null/empty as "-"
                if ((!durationStr || durationStr === "0S") && breakMinutes === 0 && breaksCount === 0) {
                    return <span className={cn("text-foreground-tertiary", isFaded && "opacity-40")}>-</span>;
                }

                const displayStr = durationStr || (() => {
                    const h = Math.floor(breakMinutes / 60);
                    const m = Math.round(breakMinutes % 60);
                    return h > 0 ? `${h}h ${m}m` : `${m}m`;
                })();

                return (
                    <span className={cn(
                        "font-bold text-foreground-secondary text-sm transition-opacity duration-300 uppercase",
                        isFaded && "opacity-40"
                    )}>
                        {displayStr}
                    </span>
                );
            }
        },
        {
            _id: "punctuality",
            label: "Punctuality",
            format: (value: unknown, row: Attendance) => {
                if (row.status !== "present") return <span className="text-foreground-tertiary opacity-40">-</span>;

                // Be resilient: check punctuality string, root isLate, and sessions
                const isLate = value === "Late" || row.isLate || (row.sessions && row.sessions.length > 0 && row.sessions.some(s => s.isLate));

                return isLate ? (
                    <span className="px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Late
                    </span>
                ) : (
                    <span className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        On Time
                    </span>
                );
            }
        },
        {
            _id: "status",
            label: "Status",
            format: (status: unknown) => {
                const statusStr = String(status);
                const variants: Record<string, string> = {
                    present: "bg-success/10 text-success border-success/20",
                    absent: "bg-error/10 text-error border-error/20",
                    late: "bg-warning/10 text-warning border-warning/20",
                    "half-day": "bg-blue-500/10 text-blue-600 border-blue-500/20",
                    "on-leave": "bg-purple-500/10 text-purple-600 border-purple-500/20",
                    holiday: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    weekend: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                };
                return (
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        variants[statusStr.toLowerCase()] || "bg-muted text-foreground-tertiary border-border"
                    )}>
                        {statusStr}
                    </span>
                );
            }
        }
    ];

    if (isLoadingEmployee || (isLoadingAttendance && !attendanceData)) {
        return <GlobalLoader fullScreen message="Loading detailed attendance..." />;
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-error" />
                <h2 className="text-xl font-bold">Employee not found</h2>
                <Button onClick={() => navigate("/attendance")}>Back to Log</Button>
            </div>
        );
    }

    const records = (attendanceData?.attendances || [])
        // Safety: backend can ignore filters; never show rows outside the selected range
        .filter((r) => ymdInRangeInclusive(String(r.date || ""), startDate, endDate))
        // De-dupe by date (some APIs return duplicates per user/day)
        .reduce<Attendance[]>((acc, r) => {
            const key = String(r.date || "").slice(0, 10);
            if (!key) return [...acc, r];
            if (acc.some((x) => String(x.date || "").slice(0, 10) === key)) return acc;
            return [...acc, r];
        }, [])
        .map((r) => {
            const isLate = r.punctuality === "Late" || r.isLate || (r.sessions && r.sessions.length > 0 && r.sessions.some(s => s.isLate));
            return {
                ...r,
                _id: r._id || r.date,
                isLate
            };
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto px-2 md:px-4">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4 w-full md:w-auto">
                    <BackButton label="Back to Attendance Log" />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-4">
                            {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                {employee.id || employee._id}
                            </span>
                        </h1>
                        <p className="text-foreground-tertiary font-medium flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            Showing attendance from <span className="text-foreground font-bold">{format(ymdToLocalDate(startDate), "MMM dd")}</span> to <span className="text-foreground font-bold">{format(ymdToLocalDate(endDate), "MMM dd, yyyy")}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <TimezoneToggle variant="horizontal" />
                </div>
            </div>

            {/* Controls Card */}
            <Card className="rounded-xl sm:rounded-xl border-border/50 shadow-2xl shadow-black/[0.03] overflow-hidden bg-surface">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        {/* Tabs */}
                        <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border/50 gap-1">
                            {(["weekly", "monthly", "custom"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleFilterChange(type)}
                                    className={cn(
                                        "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                        filterType === type
                                            ? "bg-surface text-primary shadow-sm border border-border/50"
                                            : "text-foreground-tertiary hover:text-foreground"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range Controls */}
                        {filterType === "custom" && (
                            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-right-4 duration-300 w-full lg:w-auto">
                                <div className="space-y-1 w-full sm:w-auto">
                                    <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest ml-1">Start Date</p>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="rounded-xl border-border/50 h-10 w-full sm:w-40"
                                    />
                                </div>
                                <div className="sm:pt-5">
                                    <ArrowRight className="w-4 h-4 text-foreground-tertiary hidden sm:block" />
                                </div>
                                <div className="space-y-1 w-full sm:w-auto">
                                    <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-widest ml-1">End Date</p>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="rounded-xl border-border/50 h-10 w-full sm:w-40"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Quick Summary View */}
                        <div className="flex items-center gap-6 px-4 py-2 bg-muted/30 rounded-2xl border border-border/20 ml-auto lg:ml-0">
                            <div>
                                <p className="text-[9px] font-black text-foreground-tertiary uppercase tracking-tighter">Total Present</p>
                                <p className="text-lg font-black text-success">{records.filter(r => r.status === 'present').length} Days</p>
                            </div>
                            <div className="w-px h-8 bg-border/50" />
                            <div>
                                <p className="text-[9px] font-black text-foreground-tertiary uppercase tracking-tighter">Total Late</p>
                                <p className="text-lg font-black text-warning">{records.filter(r => r.isLate).length}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card className="rounded-xl sm:rounded-xl border-border/40 shadow-2xl shadow-black/[0.03] overflow-hidden bg-surface">
                <div className="relative min-h-[400px]">
                    {isFetching && (
                        <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Updating View...</p>
                        </div>
                    )}
                    <Table
                        columns={columns}
                        rows={records}
                        onRowClick={(row) => {
                            const dateKey = String((row as Attendance).date || "").slice(0, 10);
                            navigate(`/attendance/record/${encodeURIComponent(dateKey)}/${employeeId}`);
                        }}
                        isRowClickable={(row) => {
                            // Clickable if there is any actual attendance data
                            return !!(row as Attendance).checkIn?.time || ((row as Attendance).sessions && (row as Attendance).sessions.length > 0);
                        }}
                        rowClassName={(row) => {
                            const isTodayRow = isToday(new Date(row.date));
                            return isTodayRow ? "bg-primary/[0.04] border-l-4 border-l-primary shadow-sm z-10" : "";
                        }}
                        className="border-none"
                        emptyState={
                            <EmptyState
                                title="No attendance history"
                                description="No records found for the selected period."
                                className="py-24"
                            />
                        }
                    />
                </div>
            </Card>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4">
                {filterType !== 'weekly' && (
                    <div className="flex items-center gap-3">
                        <p className="text-xs sm:text-sm font-bold text-foreground-tertiary uppercase tracking-widest bg-muted/50 px-3 sm:px-4 py-2 rounded-2xl border border-border/30">
                            Page <span className="text-primary">{page}</span> of {attendanceData?.totalPages || 1} (Total: {attendanceData?.total || 0})
                        </p>
                        <div className="relative group">
                            <FilterDropdown
                                value={limit.toString()}
                                options={[10, 20, 50, 100].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
                                onChange={(v) => {
                                    setLimit(Number(v));
                                    setPage(1);
                                }}
                                className="
                            h-9 px-3 rounded-xl border-border/50
                            text-xs font-bold text-foreground-tertiary
                            hover:text-foreground-tertiary
                            focus:text-foreground-tertiary
                            data-[state=open]:text-foreground-tertiary
                            "
                                align="start"
                            />
                        </div>
                    </div>
                )}

                {(attendanceData?.totalPages || 0) > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={attendanceData?.totalPages || 1}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    );
};

export default EmployeeAttendanceDetail;
