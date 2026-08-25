import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
    Clock, 
    CheckCircle2, 
    Users, 
    CheckCircle, 
    UserMinus, 
    AlertCircle,
    MapPin
} from "lucide-react";
import { startOfToday, endOfDay as getEndOfDay, startOfDay as getStartOfDay, format } from "date-fns";
import StatCard from "../../components/common/Stats/StatCard";

import type { Attendance as AttendanceType, AttendanceFilters } from "../../types/attendance.types";
import { attendanceService } from "../../services/attendanceService";
import { departmentService } from "../../services/departmentService";
import { designationService } from "../../services/designationService";
import type { Department, Designation } from "../../types/organization.types";
import { reportService } from "../../services/reportService";
import systemSettingsService from "../../services/systemSettingsService";
import { getPayrollCycleInterval } from "../../utils/payrollCycleUtils";
import { useDebounce } from "../../hooks/useDebounce";
import { cn } from "../../lib/utils";
import Table from "../../components/common/Table";

import Modal from "../../components/common/Modal/Modal";
import FormSelect from "../../components/common/Select/FormSelect";
import Button from "../../components/common/Button/Button";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import UnifiedFilter from "../../components/common/Filter/UnifiedFilter";
import FilterDropdown from "../../components/common/Filter/FilterDropdown";
import Pagination from "../../components/common/Pagination";
import { SearchInput } from "../../components/common/Search/SearchInput";
import { useAppSelector } from "../../store/hooks";
import TimezoneDualView from "../../components/common/TimezoneDualView";
import TimezoneToggle from "../../components/common/TimezoneToggle";
import { getOfficeTimezone } from "../../utils/dateUtils";
import {
    enrichAttendancesWithLiveLocations,
    resolveCheckInLocation,
} from "../../utils/attendanceLocationUtils";

// Treat YYYY-MM-DD as a "date-only" value in local time (avoid UTC shifting).
const ymdToLocalDate = (value: string): Date => {
    const ymd = (value || "").slice(0, 10);
    const [y, m, d] = ymd.split("-").map((n) => Number(n));
    if (!y || !m || !d) return new Date(value);
    return new Date(y, m - 1, d);
};

// Extended interface, though AttendanceType now includes _id, we keep this for safety or extended UI props
type AttendanceRow = AttendanceType;

// Interactive Leaflet Map for multiple independent employee markers (Live Tracking)
export const LeafletLiveMap: React.FC<{
    users: any[]
}> = ({ users }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || users.length === 0) return;

        const loadLeaflet = () => {
            if ((window as any).L) {
                initMap();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => initMap();
            document.body.appendChild(script);
        };

        const initMap = () => {
            const L = (window as any).L;
            if (!L || !mapRef.current) return;

            if (mapInstance.current) {
                mapInstance.current.remove();
            }

            const activeUsers = users.filter(u => u.lastActiveLocation?.latitude && u.lastActiveLocation?.longitude);
            if (activeUsers.length === 0) return;

            const first = activeUsers[0].lastActiveLocation!;
            const map = L.map(mapRef.current).setView([first.latitude, first.longitude], 12);
            mapInstance.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const markersGroup: any[] = [];

            activeUsers.forEach((u) => {
                const loc = u.lastActiveLocation!;
                
                const customMarkerHtml = `
                    <div style="
                        background-color: #6366f1; 
                        width: 18px; 
                        height: 18px; 
                        border-radius: 50%; 
                        border: 2px solid white; 
                        box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 9px;
                    ">${u.fullName?.charAt(0) || 'E'}</div>
                `;

                const icon = L.divIcon({
                    html: customMarkerHtml,
                    className: 'custom-live-icon',
                    iconSize: [18, 18],
                    iconAnchor: [9, 9]
                });

                const popupContent = `
                    <div style="font-family: inherit; font-size: 11px; padding: 4px; min-width: 180px; line-height: 1.4;">
                        <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 900; color: #1e1b4b;">${u.fullName}</h4>
                        <span style="font-size: 10px; color: #666;">@${u.username}</span><br/>
                        <b>Dept:</b> ${u.employment?.department || 'Field'}<br/>
                        <b>Desig:</b> ${u.employment?.designation || 'Staff'}<br/>
                        ${loc.address ? `<div style="margin-top: 6px; border-top: 1px solid #eee; padding-top: 6px; color: #374151; font-size: 10px;"><b>Last Location:</b> ${loc.address}</div>` : ''}
                        <div style="font-size: 9px; color: #9ca3af; margin-top: 4px; text-transform: uppercase;">Updated: ${new Date(loc.updatedAt!).toLocaleTimeString()}</div>
                    </div>
                `;

                const marker = L.marker([loc.latitude, loc.longitude], { icon })
                    .addTo(map)
                    .bindPopup(popupContent);
                
                markersGroup.push(marker);
            });

            if (activeUsers.length > 1) {
                const group = L.featureGroup(markersGroup);
                map.fitBounds(group.getBounds(), { padding: [40, 40] });
            }
        };

        loadLeaflet();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [users]);

    return (
        <div 
            ref={mapRef} 
            className="w-full rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl" 
            style={{ height: '550px', background: '#f1f5f9' }} 
        />
    );
};

const getStatusBadge = (status: string) => {
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
        <span
            className={cn(
                "px-3 py-1 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                variants[status.toLowerCase()] || "bg-muted text-foreground-tertiary border-border"
            )}
        >
            {status}
        </span>
    );
};

const Attendance: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<"log" | "map">("log");
    const [liveUsers, setLiveUsers] = useState<any[]>([]);
    const [fetchingLive, setFetchingLive] = useState(false);

    // Get filters from URL or defaults
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 700);
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
    const [departmentFilter, setDepartmentFilter] = useState<string>(searchParams.get("dept") || "all");
    const [designationFilter, setDesignationFilter] = useState<string>(searchParams.get("desig") || "all");
    const initialPage = Number(searchParams.get("page")) || 1;

    const [records, setRecords] = useState<AttendanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [isExporting, setIsExporting] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportMonth, setExportMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [exportYear, setExportYear] = useState<string>(String(new Date().getFullYear()));
    const [cycleSettings, setCycleSettings] = useState({ startDay: 1, endDay: 31 });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        halfDay: 0
    });

    // Pagination State
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const params: Record<string, string> = {
            limit: limit.toString()
        };
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (statusFilter !== "all") params.status = statusFilter;
        if (departmentFilter !== "all") params.dept = departmentFilter;
        if (designationFilter !== "all") params.desig = designationFilter;
        if (page > 1) params.page = page.toString();
        
        setSearchParams(params, { replace: true });
    }, [debouncedSearchTerm, statusFilter, departmentFilter, designationFilter, page, limit, setSearchParams]);

    // Data helpers
    const authUser = useAppSelector((state) => state.auth.user);

    // Determine start/end date 
    const getActiveRange = () => {
        const today = startOfToday();
        const start = getStartOfDay(today);
        const end = getEndOfDay(today);
        return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
    };

    const fetchRecords = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);

            const { startDate, endDate } = getActiveRange();

            const filters: AttendanceFilters = {
                page: currentPage,
                limit,
                startDate,
                endDate,
            };

            if (departmentFilter !== "all") {
                filters.department = departmentFilter;
            }

            if (debouncedSearchTerm.trim()) {
                filters.search = debouncedSearchTerm.trim();
            }

            // Normalization: Ensure status goes to API correctly
            if (statusFilter !== "all") {
                // To be resilient, capitalize the status as some backends expect 'Present' vs 'present'
                const normalizedStatus = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase();
                
                if (statusFilter === 'late') {
                    // Specific handling for 'Late' as it might be a property of 'Present' status
                    (filters as any).status = 'Present';
                    (filters as any).isLate = true;
                    (filters as any).punctuality = 'Late';
                } else {
                    filters.status = normalizedStatus;
                }
            }

            if (designationFilter !== "all") {
                filters.designation = designationFilter;
            }

            if (!authUser?.isAdmin) {
                filters.userId = authUser?._id || authUser?.id;
            }

            // Fetch Stats, Summary, and live locations in parallel.
            // Summary often omits clock-in geo; last-active fills gaps for clocked-in employees.
            const [resp, statsResp, liveUsers] = await Promise.all([
                attendanceService.getSummary(filters),
                attendanceService.getStats({
                    date: startDate,
                    department: departmentFilter !== "all" ? departmentFilter : undefined,
                    designation: designationFilter !== "all" ? designationFilter : undefined
                }),
                attendanceService.getLastActiveLocations().catch(() => [] as Awaited<ReturnType<typeof attendanceService.getLastActiveLocations>>),
            ]);

            // Map response to ensure _id exists for Table
            let items = enrichAttendancesWithLiveLocations(resp.attendances || [], liveUsers).map((r) => {
                const isLate = r.punctuality === "Late" || r.isLate || (r.sessions && r.sessions.length > 0 && r.sessions.some(s => s.isLate));
                return {
                    ...r,
                    _id: r._id || r.employeeId?._id || r.employeeId || r.date,
                    isLate
                };
            });

            // Frontend fallback filter: if the backend didn't respect the 'late' filter, we do it here
            // This ensures the user doesn't see 'On Time' arrivals when looking for 'Late' ones
            if (statusFilter === 'late') {
                items = items.filter(r => r.isLate);
            }

            setRecords(items as AttendanceRow[]);
            setTotal(resp.total || 0);
            setTotalPages(resp.totalPages || 0);
            setStats(statsResp);
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, departmentFilter, designationFilter, limit, authUser]);


    // Fetch Departments, Designations & Payroll settings
    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const [depsResp, desigResp, cycleResp] = await Promise.all([
                    departmentService.getAll({ limit: 100 }),
                    designationService.getAll({ limit: 100 }),
                    systemSettingsService.getSettingByKey("payroll_cycle_settings").catch(() => null)
                ]);
                setDepartments(depsResp.data);
                setDesignations(desigResp.data);
                if (cycleResp && cycleResp.value) {
                    setCycleSettings({
                        startDay: Number(cycleResp.value.startDay || 1),
                        endDay: Number(cycleResp.value.endDay || 31)
                    });
                }
            } catch (err) {
                console.error("Failed to fetch departments/designations/payroll:", err);
            }
        };
        fetchDeps();
    }, []);

    // Effects
    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm, statusFilter, departmentFilter, designationFilter]);

    useEffect(() => {
        fetchRecords(page);
    }, [fetchRecords, page]);

    // Fetch live employee locations when map tab is active
    useEffect(() => {
        if (activeTab !== 'map') return;
        const fetchLiveUsers = async () => {
            setFetchingLive(true);
            try {
                const users = await attendanceService.getLastActiveLocations();
                setLiveUsers(users);
            } catch (err) {
                console.error('Failed to fetch live locations:', err);
            } finally {
                setFetchingLive(false);
            }
        };
        fetchLiveUsers();
        // Auto-refresh every 2 minutes while the map tab is open
        const interval = setInterval(fetchLiveUsers, 120_000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchRecords(newPage);
    };

    const handleExportReport = async () => {
        try {
            setIsExporting(true);
            const m = Number(exportMonth);
            const y = Number(exportYear);
            if (isNaN(m) || isNaN(y)) {
                throw new Error("Invalid month or year selected");
            }
            const baseDate = new Date(y, m - 1, 15);
            const interval = getPayrollCycleInterval(baseDate, cycleSettings);
            const startDate = format(interval.startDate, 'yyyy-MM-dd');
            const endDate = format(interval.endDate, 'yyyy-MM-dd');

            // Normalization for report generation
            ['present', 'absent', 'late', 'half-day'].includes(statusFilter.toLowerCase())
                ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase()
                : statusFilter;

            await reportService.generateReport({
                type: 'attendance',
                format: 'excel',
                startDate,
                endDate,
                department: departmentFilter !== 'all' ? departmentFilter : undefined,
                designation: designationFilter !== 'all' ? designationFilter : undefined,
                search: debouncedSearchTerm.trim() || undefined,
            });
            setIsExportModalOpen(false);
        } catch (error) {
            console.error("Failed to export attendance report:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const monthOptions = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 7 }, (_, i) => {
        const yr = currentYear - 3 + i;
        return { value: String(yr), label: String(yr) };
    });

    const getExportIntervalPreview = () => {
        const m = Number(exportMonth);
        const y = Number(exportYear);
        if (isNaN(m) || isNaN(y)) return "";
        const baseDate = new Date(y, m - 1, 15);
        const interval = getPayrollCycleInterval(baseDate, cycleSettings);
        return `${format(interval.startDate, "MMMM d, yyyy")} to ${format(interval.endDate, "MMMM d, yyyy")}`;
    };

    const columns = [
        {
            _id: "employeeId", // Key used for data access, but we format it
            label: "Employee",
            format: (_: unknown, row: AttendanceRow) => {
                const emp = row.employeeId;
                const name = row.name || (emp?.personalInfo ? `${emp.personalInfo.firstName || ''} ${emp.personalInfo.lastName || ''}`.trim() || emp.username : "Unknown");
                const email = row.email || emp?.personalInfo?.email || "";
                return (
                    <div className="flex flex-col">
                        <span
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                const userId = emp?._id || (typeof emp === 'string' ? emp : '');
                                if (userId) {
                                    navigate(`/attendance/${userId}`);
                                } else {
                                    console.error("No valid userId found for navigation", emp);
                                }
                            }}

                        >
                            {name}
                        </span>
                        <span className="text-xs text-foreground-tertiary">{email}</span>
                    </div>
                );
            }
        },
        {
            _id: "department",
            label: "Department",
            format: (value: unknown, row: AttendanceRow) => {
                const deptValue = typeof value === 'string' ? value : (row.employeeId?.employment?.department || "-");
                return (
                    <div className="text-sm font-medium text-foreground-secondary">
                        {deptValue}
                    </div>
                );
            }
        },
        {
            _id: "date",
            label: "Date",
            format: (value: unknown) => {
                const dateStr = typeof value === 'string' ? value : String(value || "");
                return (
                    <div className="text-sm font-medium text-foreground-secondary">
                        {dateStr ? ymdToLocalDate(dateStr).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                    </div>
                );
            }
        },

        {
            _id: "checkIn",
            label: "Check In",
            minWidth: 180,
            format: (_: unknown, row: AttendanceRow) => {
                const emp = row.employeeId;
                const employeeTimezone = emp?.employment?.timezone || 'Asia/Kolkata';
                const adminTimezone = getOfficeTimezone();
                const sessions = row.sessions || [];
                const checkInTime = sessions.length > 0 ? sessions[0].checkIn.time : row.checkIn?.time;

                if (!checkInTime) return <span className="text-foreground-tertiary">-</span>;

                return (
                    <div className="flex flex-col gap-1">
                        <TimezoneDualView
                            startTime={checkInTime}
                            primaryTimezone={employeeTimezone}
                            secondaryTimezone={adminTimezone}
                            variant="minimal"
                        />
                        
                    </div>
                );
            }
        },
        {
            _id: "clockInLocation",
            label: "Clock-In Location",
            minWidth: 180,
            format: (_: unknown, row: AttendanceRow) => {
                const checkInLoc = resolveCheckInLocation(row);

                if (!checkInLoc || (!checkInLoc.address && !checkInLoc.latitude)) {
                    return <span className="text-foreground-tertiary">-</span>;
                }

                const address = checkInLoc.address;
                const lat = checkInLoc.latitude;
                const lng = checkInLoc.longitude;

                if (!address && !lat) return <span className="text-foreground-tertiary">-</span>;

                return (
                    <div className="flex flex-col gap-1 py-1">
                        {address ? (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${lat || ''},${lng || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-1.5 max-w-[200px] hover:text-primary transition-colors group"
                                title="Click to view on Google Maps"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs text-foreground-secondary leading-normal font-medium line-clamp-2">
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
                                <MapPin className="w-3.5 h-3.5 text-primary animate-pulse" />
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
            minWidth: 180,
            format: (_: unknown, row: AttendanceRow) => {
                const emp = row.employeeId;
                const employeeTimezone = emp?.employment?.timezone || 'Asia/Kolkata';
                const adminTimezone = getOfficeTimezone();
                const sessions = row.sessions || [];
                const isCurrentlyWorking = sessions.length > 0 && !sessions[sessions.length - 1].checkOut;

                if (isCurrentlyWorking) {
                    return (
                        <div className="flex items-center gap-2">
                             <span className="text-primary font-black uppercase tracking-widest text-[9px] bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg animate-pulse shadow-sm shadow-primary/10">
                                Working
                            </span>
                        </div>
                    );
                }

                // Get the checkout time from root or last recorded session
                const checkOutTime = row.checkOut?.time || (sessions.length > 0 ? sessions[sessions.length - 1].checkOut?.time : null);

                if (!checkOutTime) return <span className="text-foreground-tertiary">--:--</span>;

                const checkOutAddress = sessions.length > 0
                    ? sessions[sessions.length - 1].checkOut?.address
                    : row.checkOut?.address;

                return (
                    <div className="flex flex-col gap-1">
                        <div className="relative inline-block group/session">
                            <TimezoneDualView
                                startTime={checkOutTime}
                                primaryTimezone={employeeTimezone}
                                secondaryTimezone={adminTimezone}
                                variant="minimal"
                            />
                            {sessions.length > 1 && (
                                <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-[10px] font-black text-white shadow-lg ring-2 ring-surface animate-in zoom-in duration-300 z-10">
                                    {sessions.length > 2 ? '2+' : '2'}
                                </div>
                            )}
                        </div>
                        {checkOutAddress && (
                            <div className="flex items-start gap-1 max-w-[200px]">
                                <MapPin className="w-2.5 h-2.5 text-foreground-tertiary flex-shrink-0 mt-0.5" />
                                <span
                                    className="text-[9px] text-foreground-tertiary leading-normal line-clamp-2"
                                    title={checkOutAddress}
                                >
                                    {checkOutAddress}
                                </span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            _id: "totalHours",
            label: "Duration",
            format: (_: unknown, row: AttendanceRow) => {
                const sessions = row.sessions || [];
                const isCurrentlyWorking = sessions.length > 0 && !sessions[sessions.length - 1].checkOut;
                
                // Show Net duration primarily, but include Gross for transparency
                // Backend now sends totalDurationString (Net) and totalGrossDurationString (Gross)
                const netDuration = row.netDurationString || row.totalDurationString || "0S";
                const grossDuration = (row as any).totalGrossDurationString;

                return (
                    <div className="flex flex-col">
                        <div className="flex flex-col">
                            <span className="font-bold text-foreground-secondary uppercase text-xs">
                                Net: {netDuration}
                            </span>
                            {grossDuration && grossDuration !== netDuration && (
                                <span className="text-[9px] text-foreground-tertiary uppercase font-medium">
                                    Gross: {grossDuration}
                                </span>
                            )}
                        </div>
                        {isCurrentlyWorking && (
                            <span className="text-[10px] text-primary font-black uppercase tracking-tighter animate-pulse mt-1">
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
            format: (value: unknown, row: AttendanceRow) => {
                const breaks = row.breaks || [];
                // Use totalBreakDurationString if available, otherwise calculate from breakTime
                const durationStr = row.totalBreakDurationString;
                const breakMinutes = typeof value === 'number' ? value : (parseFloat(value as string) || 0);

                if ((!durationStr || durationStr === "0S") && breakMinutes === 0 && breaks.length === 0) {
                    return <span className="text-foreground-tertiary">-</span>;
                }

                const displayStr = durationStr || (() => {
                    const h = Math.floor(breakMinutes / 60);
                    const m = Math.round(breakMinutes % 60);
                    return h > 0 ? `${h}h ${m}m` : `${m}m`;
                })();

                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground-secondary uppercase">
                            {displayStr}
                        </span>
                        {breaks.length > 0 && (
                            <span className="text-[10px] text-foreground-tertiary">
                                {breaks.length} {breaks.length === 1 ? 'break' : 'breaks'}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            _id: "punctuality",
            label: "Punctuality",
            format: (value: unknown, row: AttendanceRow) => {
                if (row.status !== 'present') return <span className="text-foreground-tertiary">-</span>;

                // Be resilient: check punctuality string, root isLate, and sessions
                const isLate = value === "Late" || row.isLate || (row.sessions && row.sessions.length > 0 && row.sessions.some(s => s.isLate));

                return (
                    <div className="flex items-center gap-2">
                        {isLate ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-warning/10 text-warning border border-warning/20">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Late</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success/10 text-success border border-success/20">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-wider">On Time</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            _id: "status",
            label: "Status",
            format: (_: unknown, row: AttendanceRow) => (
                <div className="flex items-center gap-2">
                    {getStatusBadge(row.status)}
                </div>
            ),
        }
    ];

    if (isInitialLoading) {
        return <GlobalLoader fullScreen message="Loading Attendance Records..." />;
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 px-2 sm:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 relative z-40">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">Attendance Log</h1>
                    <p className="text-sm sm:base text-foreground-tertiary mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Daily attendance and working hours tracking.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    <TimezoneToggle variant="horizontal" />
                    <button
                        disabled={isExporting}
                        className="rounded-2xl border-border px-3 sm:px-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-surface border hover:bg-muted transition-all h-10 disabled:opacity-50"
                        onClick={() => setIsExportModalOpen(true)}
                    >
                        {isExporting ? 'Generating...' : 'Export Report'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Total Employees"
                    value={stats.total}
                    icon={<Users className="w-6 h-6" />}
                    color="info"
                    className={cn(
                        "cursor-pointer hover:border-info",
                        statusFilter === "all" && "ring-2 ring-info"
                    )}
                    onClick={() => setStatusFilter("all")}
                />
                <StatCard
                    title="Present Today"
                    value={stats.present}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="success"
                    className={cn(
                        "cursor-pointer hover:border-success",
                        statusFilter === "present" && "ring-2 ring-success"
                    )}
                    onClick={() => setStatusFilter("present")}
                />
                <StatCard
                    title="Late Arrivals"
                    value={stats.late}
                    icon={<Clock className="w-6 h-6" />}
                    color="warning"
                    className={cn(
                        "cursor-pointer hover:border-warning",
                        statusFilter === "late" && "ring-2 ring-warning"
                    )}
                    onClick={() => setStatusFilter("late")}
                />
                <StatCard
                    title="Absent"
                    value={stats.absent}
                    icon={<UserMinus className="w-6 h-6" />}
                    color="error"
                    className={cn(
                        "cursor-pointer hover:border-error",
                        statusFilter === "absent" && "ring-2 ring-error"
                    )}
                    onClick={() => setStatusFilter("absent")}
                />
                <StatCard
                    title="On Leave"
                    value={stats.onLeave}
                    icon={<AlertCircle className="w-6 h-6" />}
                    color="primary"
                    className={cn(
                        "cursor-pointer hover:border-primary",
                        statusFilter === "on-leave" && "ring-2 ring-primary"
                    )}
                    onClick={() => setStatusFilter("on-leave")}
                />
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border/40 backdrop-blur-sm w-fit shadow-sm">
                <button
                    id="tab-attendance-log"
                    onClick={() => setActiveTab('log')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                        activeTab === 'log'
                            ? "bg-surface shadow-md text-primary border border-border/60"
                            : "text-foreground-tertiary hover:text-foreground hover:bg-surface/50"
                    )}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Attendance Log
                </button>
                <button
                    id="tab-live-map"
                    onClick={() => setActiveTab('map')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                        activeTab === 'map'
                            ? "bg-surface shadow-md text-primary border border-border/60"
                            : "text-foreground-tertiary hover:text-foreground hover:bg-surface/50"
                    )}
                >
                    <span className="relative flex items-center justify-center w-3.5 h-3.5">
                        <span className={cn(
                            "w-2 h-2 rounded-full bg-current",
                            activeTab === 'map' && "animate-ping absolute opacity-60"
                        )} />
                        <span className="w-2 h-2 rounded-full bg-current relative" />
                    </span>
                    Live Map
                    {liveUsers.length > 0 && activeTab === 'map' && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-black">
                            {liveUsers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Early Leaves Panel */}
            {activeTab === ('early_leaves' as any) && (
                <EarlyLeaves />
            )}
            
            {/* Live Map Panel */}
            {activeTab === 'map' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-foreground">Employee Live Locations</h2>
                            <p className="text-xs text-foreground-tertiary mt-0.5">
                                Showing last reported GPS position for active employees · Auto-refreshes every 2 min
                            </p>
                        </div>
                        <button
                            id="btn-refresh-live-map"
                            disabled={fetchingLive}
                            onClick={async () => {
                                setFetchingLive(true);
                                try {
                                    const users = await attendanceService.getLastActiveLocations();
                                    setLiveUsers(users);
                                } finally {
                                    setFetchingLive(false);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-surface text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all disabled:opacity-50"
                        >
                            {fetchingLive ? (
                                <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <Clock className="w-3 h-3" />
                            )}
                            {fetchingLive ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    {fetchingLive && liveUsers.length === 0 ? (
                        <div className="flex items-center justify-center h-[550px] rounded-[2rem] border border-border/50 bg-surface/50">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-sm font-black uppercase tracking-widest text-primary animate-pulse">Loading Live Locations...</p>
                            </div>
                        </div>
                    ) : liveUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] rounded-[2rem] border border-border/50 bg-surface/50 gap-4">
                            <AlertCircle className="w-12 h-12 text-foreground-tertiary" />
                            <p className="text-sm font-bold text-foreground-tertiary">No active employee locations available.</p>
                            <p className="text-xs text-foreground-tertiary">Employees need to be clocked in for their location to appear here.</p>
                        </div>
                    ) : (
                        <LeafletLiveMap users={liveUsers} />
                    )}

                    {/* Employee location list */}
                    {liveUsers.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {liveUsers.map((u: any) => (
                                <div key={u._id} className="flex items-start gap-3 p-4 rounded-2xl border border-border/40 bg-surface hover:border-primary/20 transition-all shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                                        {u.fullName?.charAt(0) || 'E'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-sm text-foreground truncate">{u.fullName}</p>
                                        <p className="text-[10px] text-foreground-tertiary font-medium truncate">@{u.username}</p>
                                        {u.lastActiveLocation?.address && (
                                            <p className="text-[10px] text-foreground-secondary mt-1 leading-normal line-clamp-2">{u.lastActiveLocation.address}</p>
                                        )}
                                        {u.lastActiveLocation?.updatedAt && (
                                            <p className="text-[9px] text-foreground-tertiary mt-1 uppercase tracking-wide">
                                                {new Date(u.lastActiveLocation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Log Panel */}
            {activeTab === 'log' && (
            <>
            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                <div className="flex-1 w-full">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="attendance"
                        placeholder="Search by employee name..."
                    />
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2">
                    <UnifiedFilter
                        filters={[
                            {
                                id: "status",
                                label: "Status",
                                value: statusFilter,
                                onChange: setStatusFilter,
                                options: [
                                    { value: "all", label: "All Status" },
                                    { value: "present", label: "Present" },
                                    { value: "late", label: "Late" },
                                    { value: "absent", label: "Absent" },
                                    { value: "half-day", label: "Half Day" },
                                    { value: "on-leave", label: "On Leave" },
                                    { value: "holiday", label: "Holiday" },
                                    { value: "weekend", label: "Weekend" },
                                ]
                            },
                            {
                                id: "department",
                                label: "Department",
                                value: departmentFilter,
                                onChange: setDepartmentFilter,
                                options: [
                                    { value: "all", label: "All Depts" },
                                    ...departments.map(dep => ({
                                        value: dep.name,
                                        label: dep.name
                                    }))
                                ]
                            },
                            {
                                id: "designation",
                                label: "Designation",
                                value: designationFilter,
                                onChange: setDesignationFilter,
                                options: [
                                    { value: "all", label: "All Desigs" },
                                    ...designations.map(des => ({
                                        value: des.title || des.name || "",
                                        label: des.title || des.name || "Unknown"
                                    }))
                                ]
                            }
                        ]}
                    />
                </div>
            </div>

            <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-black/[0.03] overflow-hidden relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Syncing Records...</p>
                    </div>
                )}
                <Table
                    columns={columns}
                    rows={records}

                    isRowClickable={(row) => {
                        const status = (row as AttendanceRow).status?.toLowerCase();
                        return !['absent', 'holiday', 'weekend', 'scheduled'].includes(status);
                    }}
                    className="border-none"
                    tableClassName="min-w-[640px]"
                    emptyState={
                        <EmptyState
                            title="No attendance records"
                            description={searchTerm ? `No results for "${searchTerm}"` : "No attendance data found for today."}
                            className="py-20"
                        />
                    }
                />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4">
                <div className="flex items-center gap-3">
                    <p className="text-xs sm:text-sm font-bold text-foreground-tertiary uppercase tracking-widest bg-muted/50 px-3 sm:px-4 py-2 rounded-2xl border border-border/30">
                        Page <span className="text-primary">{page}</span> of {totalPages || 1} (Total: {total})
                    </p>
                    <div className="relative group">
                        <FilterDropdown
                            value={limit.toString()}
                            options={[10, 20, 50, 100].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
                            onChange={(v) => handleLimitChange(Number(v))}
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

                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
            </>
            )} {/* end activeTab === 'log' */}

            {/* Export Monthly Modal */}
            <Modal
                open={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                title="Export Attendance Report"
                maxWidth="sm"
            >
                <div className="space-y-6">
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                        Select the month and year you wish to export. The exported attendance spreadsheet will dynamically align with your active payroll cycle settings.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                            label="Select Month"
                            value={exportMonth}
                            onChange={(val) => setExportMonth(val)}
                            options={monthOptions}
                        />
                        <FormSelect
                            label="Select Year"
                            value={exportYear}
                            onChange={(val) => setExportYear(val)}
                            options={yearOptions}
                        />
                    </div>

                    {/* Cycle preview banner */}
                    <div className="p-5 rounded-[1.5rem] bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-inner">
                        <span className="text-[9px] font-black uppercase text-primary tracking-widest block mb-1">
                            Export Date Interval Preview
                        </span>
                        <span className="text-sm font-black text-foreground-secondary tracking-tight">
                            {getExportIntervalPreview()}
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                        <Button
                            variant="ghost"
                            onClick={() => setIsExportModalOpen(false)}
                            className="rounded-2xl font-black uppercase text-xs tracking-widest h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExportReport}
                            isLoading={isExporting}
                            className="rounded-2xl font-black uppercase text-xs tracking-widest h-12 px-6"
                        >
                            Export
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Attendance;



