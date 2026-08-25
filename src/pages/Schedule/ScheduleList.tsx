import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Users } from "lucide-react";
import {
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isAfter,
    parseISO,
    format,
} from "date-fns";
import { getAdminDateKey } from "../../utils/dateUtils";
import { cn } from "../../lib/utils";
import type { EmployeeRoster, PaginatedScheduleResponse } from "../../types/schedule.types";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import UnifiedFilter from "../../components/common/Filter/UnifiedFilter";
import type { OfficeLocation, Department, Holiday } from "../../types/organization.types";
import MultiEmployeeSearch from "../../components/common/Search/MultiEmployeeSearch";
import type { ScheduleFilters } from "../../types/schedule.types";
import { getErrorMessage } from "../../utils/errorHandling";
import CalendarView from "./CalendarView";
import DaySchedulePanel from "./DaySchedulePanel";
import ShiftEditor, { type ShiftFormData } from "./ShiftEditor";
import type { ShiftData } from "../../types/schedule.types";
import { useConfirmation } from "../../hooks/useConfirmation";
import { userService } from "../../services/userService";
import { locationService } from "../../services/locationService";
import { departmentService } from "../../services/departmentService";
import { scheduleService } from "../../services/scheduleService";
import { roleService } from "../../services/roleService";
import { holidayService } from "../../services/holidayService";
import type { User } from "../../types/user.types";
import EmployeeListPanel from "./EmployeeListPanel";
import EmployeeCalendarView from "./EmployeeCalendarView";
import BulkActionsToolbar from "./BulkActionsToolbar";
import TimezoneToggle from "../../components/common/TimezoneToggle";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

interface DayUser {
    firstName: string;
    lastName: string;
    _id: string;
    // Add other properties if needed based on usage
    [key: string]: unknown;
}

interface DaySummary {
    users: DayUser[];
    total: number;
    hasMore: boolean;
}

const ScheduleList: React.FC = () => {
    const [rosters, setRosters] = useState<EmployeeRoster[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Day panel data state
    const [dayRosters, setDayRosters] = useState<EmployeeRoster[]>([]);
    const [isDayLoading, setIsDayLoading] = useState(false);
    const [dayPage, setDayPage] = useState(1);
    const [dayTotalPages, setDayTotalPages] = useState(1);
    const [daySearchTerm, setDaySearchTerm] = useState('');

    // Calendar state
    const [viewMode, setViewMode] = useState<"week" | "month">("week");
    const [viewType, setViewType] = useState<"grid" | "calendar">("grid");
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [mainPage, setMainPage] = useState(1);

    const [usersByDate, setUsersByDate] = useState<Record<string, DaySummary>>({});

    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

    const transformedUsersByDate = useMemo(() => {
        if (Object.keys(usersByDate).length > 0) return usersByDate;

        const transformed: Record<string, DaySummary> = {};
        rosters.forEach(roster => {
            Object.entries(roster.shiftData || {}).forEach(([dateKey, shift]) => {
                // Only show scheduled shifts (not off days) in the summary bubbles
                if (shift.shiftType !== 'off') {
                    if (!transformed[dateKey]) {
                        transformed[dateKey] = { users: [], total: 0, hasMore: false };
                    }
                    transformed[dateKey].users.push({
                        ...roster.Info,
                        _id: roster.employeeId || roster._id || roster.id
                    } as DayUser);
                    transformed[dateKey].total++;
                }
            });
        });
        return transformed;
    }, [usersByDate, rosters]);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);

    // Shift editor state
    const [isShiftEditorOpen, setIsShiftEditorOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
    const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null); // Track which time slot is being edited
    const [prefilledEmployeeId, setPrefilledEmployeeId] = useState<string>("");
    const [prefilledEmployeeName, setPrefilledEmployeeName] = useState<string>("");
    const [prefilledDate, setPrefilledDate] = useState<Date | undefined>(undefined);
    const [existingDayShifts, setExistingDayShifts] = useState<ShiftData[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);

    // Computed start/end dates for API
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [departmentName, setDepartmentName] = useState<string>("all");

    const [employees, setEmployees] = useState<User[]>([]);
    const [locations, setLocations] = useState<OfficeLocation[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    const { confirm, ConfirmationDialog } = useConfirmation();

    const { hasPermission: canManageSchedule } = usePermissions(PERMISSIONS.SCHEDULE_MANAGE);

    // Navigation limits
    const maxDate = addMonths(startOfMonth(new Date()), 2);

    const isNextDisabled = viewMode === "month"
        ? isSameMonth(referenceDate, maxDate) || isAfter(referenceDate, maxDate)
        : isAfter(startOfWeek(addWeeks(referenceDate, 1), { weekStartsOn: 1 }), endOfMonth(maxDate));

    // Update start/end date based on view mode and reference date
    useEffect(() => {
        let start = referenceDate;
        let end = referenceDate;

        if (viewMode === "week") {
            start = startOfWeek(referenceDate, { weekStartsOn: 1 });
            end = endOfWeek(referenceDate, { weekStartsOn: 1 });
        } else if (viewMode === "month") {
            const monthStart = startOfMonth(referenceDate);
            const monthEnd = endOfMonth(referenceDate);
            start = startOfWeek(monthStart, { weekStartsOn: 1 });
            end = endOfWeek(monthEnd, { weekStartsOn: 1 });
        }

        const newStart = getAdminDateKey(start);
        const newEnd = getAdminDateKey(end);

        if (newStart !== startDate || newEnd !== endDate) {
            setStartDate(newStart);
            setEndDate(newEnd);
        }
    }, [viewMode, referenceDate, startDate, endDate]);

    // Load filter options
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                // Fetch roles first to resolve the "employee" role ObjectId
                const rolesRes = await roleService.getAll({ limit: 100, isActive: true });
                const employeeRole = rolesRes.data.find(
                    (r) => r.name.toLowerCase() === "employee"
                );

                const userParams: Record<string, unknown> = { limit: 100 };
                if (employeeRole) {
                    userParams.roleId = employeeRole._id;
                }

                const [empData, locData, depData, holData] = await Promise.all([
                    userService.getAll(userParams),
                    locationService.getAll({ isActive: true, limit: 100 }),
                    departmentService.getAll({ isActive: true, limit: 100 }),
                    holidayService.getAll({ limit: 100 })
                ]);
                setEmployees(empData.users);
                setLocations(locData.data);
                setDepartments(depData.data);
                setHolidays(holData.data);
            } catch (error) {
                console.error("Failed to fetch filter data:", error);
            }
        };
        fetchFilterData();
    }, []);



    const handlePrevious = () => {
        if (viewMode === "week") setReferenceDate(d => subWeeks(d, 1));
        else if (viewMode === "month") setReferenceDate(d => subMonths(d, 1));
    };

    const handleNext = () => {
        if (isNextDisabled) return;
        if (viewMode === "week") setReferenceDate(d => addWeeks(d, 1));
        else if (viewMode === "month") setReferenceDate(d => addMonths(d, 1));
    };

    const handleToday = () => {
        setReferenceDate(new Date());
    };

    const getRangeLabel = () => {
        if (viewMode === "month") return format(referenceDate, "MMMM yyyy");

        // Week view
        const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
        const end = endOfWeek(referenceDate, { weekStartsOn: 1 });

        // If same month
        if (start.getMonth() === end.getMonth()) {
            return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
        }
        // Different months
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    };

    const getSafeEmployeeId = (user: User) => {
        const rawId = user._id as unknown;
        if (typeof rawId === 'object' && rawId !== null && '$oid' in (rawId as Record<string, unknown>)) {
            return (rawId as { $oid: string }).$oid;
        }
        return String(user._id || user.id);
    };

    const fetchRosterData = useCallback(async () => {
        if (!startDate || !endDate) return;

        try {
            setLoading(true);
            setRosters([]); // Clear previous data to prevent cross-view stale content

            const filters: ScheduleFilters = {
                page: mainPage,
                limit: viewType === 'grid' ? 2 : 2,
                startDate,
                endDate,
            };

            // Apply department filter globally (for all API calls)
            if (departmentName !== "all") {
                filters.department = departmentName;
            }

            let response: PaginatedScheduleResponse | Record<string, unknown> | undefined;
            const isSearching = selectedEmployeeIds.length > 0;

            if (viewType === 'calendar' && selectedEmployee) {
                // Use the specific roster API for the selected employee
                const empId = getSafeEmployeeId(selectedEmployee);
                response = await scheduleService.getRoster(empId, filters);
            } else if (viewType === 'grid' && !isSearching) {
                // Use the summary API for grid view ONLY when not searching/filtering specific employees
                response = await scheduleService.getByDateSummary(filters);
            } else {
                // Use the general filters for list view OR grid view when specific users are selected
                const effectiveEmployeeIds = [...selectedEmployeeIds];
                if (effectiveEmployeeIds.length > 0) filters.employeeIds = effectiveEmployeeIds;

                response = await scheduleService.getAll(filters);
            }

            if (response && 'data' in (response as object)) {
                const data = (response as { data: unknown }).data;


                // Extract items: can be directly in response.data (if array) OR in response.data.rosters/schedules
                let items: EmployeeRoster[] = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data && typeof data === 'object') {
                    const dataObj = data as Record<string, EmployeeRoster[]>;
                    items = dataObj.rosters || dataObj.schedules || dataObj.attendance || [];
                }

                if (viewType === 'grid' && !isSearching) {
                    // Summary API structure: data[0].shiftData
                    let summaryData: { shiftData: Record<string, DaySummary> } | null = null;
                    if (Array.isArray(data)) {
                        summaryData = data[0] as unknown as { shiftData: Record<string, DaySummary> };
                    } else if (data && typeof data === 'object') {
                        const d = data as { summary?: { shiftData: Record<string, DaySummary> }, shiftData?: Record<string, DaySummary> };
                        summaryData = d.summary || (d.shiftData ? { shiftData: d.shiftData } : null);
                    }

                    setUsersByDate(summaryData?.shiftData || {});
                    setRosters([]);
                } else {
                    setRosters(items);
                    setUsersByDate({});
                }


            } else {
                setRosters([]);
                setUsersByDate({});

            }

        } catch (error) {
            console.error("Failed to fetch roster data:", error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    }, [startDate, endDate, departmentName, selectedEmployeeIds, selectedEmployee, viewType, mainPage]);

    useEffect(() => {
        setMainPage(1);
    }, [referenceDate, viewMode, departmentName, selectedEmployeeIds, selectedEmployee, viewType]);

    useEffect(() => {
        fetchRosterData();
    }, [fetchRosterData]);

    // Fetch all schedules for a specific date
    const fetchDaySchedules = useCallback(async (date: Date, page: number = 1, search: string = '') => {
        try {
            setIsDayLoading(true);
            const dateStr = getAdminDateKey(date);
            const filters: ScheduleFilters = {
                startDate: dateStr,
                endDate: dateStr,
                limit: 6,
                page: page,
            };

            // Add search parameter if provided
            if (search.trim()) {
                filters.search = search.trim();
            }

            let response;
            if (viewType === 'calendar' && selectedEmployee) {
                // Use the specific roster API ONLY for calendar view context
                const empId = getSafeEmployeeId(selectedEmployee);
                response = await scheduleService.getRoster(empId, filters);
            } else {
                // Use general filters (including employeeIds array) for grid and list views
                const effectiveEmployeeIds = [...selectedEmployeeIds];
                if (effectiveEmployeeIds.length > 0) filters.employeeIds = effectiveEmployeeIds;
                if (departmentName !== "all") filters.department = departmentName;

                response = await scheduleService.getAll(filters);
            }

            if (response && response.data) {
                setDayRosters(response.data);
                if (response.pagination) {
                    setDayTotalPages(response.pagination.pages);
                    setDayPage(response.pagination.page);
                }
            } else {
                setDayRosters([]);
                setDayTotalPages(1);
                setDayPage(1);
            }
        } catch (error) {
            console.error("Failed to fetch day schedules:", error);
            setDayRosters([]);
            setDayTotalPages(1);
            setDayPage(1);
        } finally {
            setIsDayLoading(false);
        }
    }, [viewType, selectedEmployee, selectedEmployeeIds, departmentName, setIsDayLoading, setDayRosters, setDayPage, setDayTotalPages]);


    const handleSaveShift = useCallback(async (data: ShiftFormData, appliedFields?: string[]) => {
        try {
            // ==============================
            // Normalize date
            // ==============================
            const normalizedDate =
                typeof data.date === "string"
                    ? data.date.slice(0, 10)
                    : format(data.date, "yyyy-MM-dd");

            // ==============================
            // HANDLE BULK MODE
            // ==============================
            if (isBulkMode && selectedEmployeeIds.length > 0) {
                const bulkPayload = selectedEmployeeIds.map(empId => {
                    // Find all rosters for this employee
                    const employeeRosters = [...rosters, ...dayRosters].filter(r =>
                        r.employeeId === empId || r.id === empId || r._id === empId
                    );

                    let targetShift: ShiftData | null = null;

                    // Priority 1: Find an 'off' shift on this date across all rosters
                    for (const roster of employeeRosters) {
                        const shiftEntry = Object.entries(roster.shiftData || {}).find(([key, shift]) => {
                            try {
                                return format(parseISO(key), "yyyy-MM-dd") === normalizedDate &&
                                    (shift as ShiftData).shiftType === 'off';
                            } catch { return false; }
                        });

                        if (shiftEntry) {
                            targetShift = shiftEntry[1] as ShiftData;
                            break; // Stop once we find an 'off' shift
                        }
                    }

                    // Priority 2: If no 'off' shift, take any first shift available for this date
                    if (!targetShift) {
                        for (const roster of employeeRosters) {
                            const shiftEntry = Object.entries(roster.shiftData || {}).find(([key]) => {
                                try {
                                    return format(parseISO(key), "yyyy-MM-dd") === normalizedDate;
                                } catch { return false; }
                            });

                            if (shiftEntry) {
                                targetShift = shiftEntry[1] as ShiftData;
                                break;
                            }
                        }
                    }

                    if (targetShift) {
                        const payload: Record<string, unknown> = {
                            scheduleId: targetShift._id,
                            shiftType: appliedFields?.includes('shiftType') ? data.shiftType : targetShift.shiftType,
                            location: appliedFields?.includes('location') ? data.location : targetShift.location,
                            notes: appliedFields?.includes('notes') ? data.notes : targetShift.notes
                        };

                        if (appliedFields?.includes('startTime')) {
                            payload.startTime = data.startTime ? [data.startTime] : [];
                        } else {
                            payload.startTime = targetShift.startTime;
                        }

                        if (appliedFields?.includes('endTime')) {
                            payload.endTime = data.endTime ? [data.endTime] : [];
                        } else {
                            payload.endTime = targetShift.endTime;
                        }

                        return payload as Record<string, unknown>;
                    }
                    return null;
                }).filter(Boolean);

                if (bulkPayload.length > 0) {
                    await scheduleService.bulkUpdate(bulkPayload as Record<string, unknown>[]);
                    await fetchRosterData();
                    if (selectedDate) {
                        fetchDaySchedules(selectedDate);
                    }
                    // Reset bulk selection after successful update
                    setSelectedEmployeeIds([]);
                    setIsBulkMode(false);
                }
                return;
            }

            // ==============================
            // HANDLE SINGLE EDIT MODE
            // ==============================
            const employeeId = data.employeeId || editingShift?.employeeId;
            if (!employeeId) {
                console.error("No employee ID found for save");
                return;
            }

            const roster = [...rosters, ...dayRosters].find(r =>
                r.employeeId === employeeId || r.id === employeeId || r._id === employeeId
            );

            if (!roster) {
                console.error("Roster not found for employee:", employeeId);
                return;
            }

            const payload: Record<string, unknown> = {
                shiftType: data.shiftType,
                start: data.startTime,
                end: data.endTime,
                startTime: data.startTime ? [data.startTime] : [],
                endTime: data.endTime ? [data.endTime] : [],
                location: data.location,
                notes: data.notes,
                date: normalizedDate
            };

            let paramId = roster._id;

            // Check if shift exists for this date
            const matchEntry = Object.entries(roster.shiftData || {}).find(
                ([key]) => {
                    try {
                        return (
                            format(parseISO(key), "yyyy-MM-dd") ===
                            normalizedDate
                        );
                    } catch {
                        return false;
                    }
                }
            );

            if (matchEntry) {
                // Use the existing shift's ID for this date
                paramId = (matchEntry[1] as ShiftData)._id;
            }

            // Prepare UPDATE payload
            const updatePayload = {
                ...payload,
                scheduleId: roster._id
            };

            // Call UPDATE API
            await scheduleService.update(paramId, updatePayload);

            await fetchRosterData();
            if (selectedDate) {
                fetchDaySchedules(selectedDate);
            }
        } catch (error) {
            console.error("Failed to save shift:", error);
            throw error;
        }
    }, [isBulkMode, selectedEmployeeIds, rosters, dayRosters, editingShift, selectedDate, fetchRosterData, fetchDaySchedules]);



    const handleDeleteShift = useCallback(async (employeeId: string, shift: ShiftData, index: number) => {
        const confirmed = await confirm({
            title: "Remove Shift Time",
            message: "Are you sure you want to remove this shift time?",
            confirmLabel: "Remove",
            variant: "danger"
        });

        if (!confirmed) return;

        try {
            const roster = [...rosters, ...dayRosters].find(r => r.employeeId === employeeId);
            if (!roster) return;

            const existingStarts = Array.isArray(shift.startTime) ? shift.startTime : [shift.startTime as string];
            const existingEnds = Array.isArray(shift.endTime) ? shift.endTime : [shift.endTime as string];

            // Remove the specific index
            const startTimes = (existingStarts as string[]).filter((_, idx) => idx !== index);
            const endTimes = (existingEnds as string[]).filter((_, idx) => idx !== index);

            // Construct payload (keep other fields same as shift)
            const payload = {
                ...shift,
                startTime: startTimes,
                endTime: endTimes,
            };

            // Determine Param ID
            let paramId = roster._id;
            if (shift._id) {
                paramId = shift._id;
            }

            const restPayload: Record<string, unknown> = { ...payload } as unknown as Record<string, unknown>;
            delete restPayload.employeeId;

            const updatePayload = {
                ...restPayload,
                scheduleId: roster._id
            };

            await scheduleService.update(paramId, updatePayload);
            await fetchRosterData();
            if (selectedDate) {
                fetchDaySchedules(selectedDate);
            }
        } catch (error) {
            console.error("Failed to delete shift:", error);
            const errorMessage = getErrorMessage(error, "Failed to delete shift");
            alert(errorMessage);
        }
    }, [confirm, rosters, dayRosters, selectedDate, fetchRosterData, fetchDaySchedules]);


    const handleBulkAssign = () => {
        if (selectedEmployeeIds.length === 0) return;
        setIsBulkMode(false); // Assign is more like bulk create
        setEditingShift(null);
        setEditingTimeIndex(null);
        setPrefilledDate(new Date());
        setIsShiftEditorOpen(true);
    };

    const handleBulkMarkOff = async () => {
        if (selectedEmployeeIds.length === 0) return;

        const confirmed = await confirm({
            title: "Mark as OFF",
            message: `Are you sure you want to mark ${selectedEmployeeIds.length} employees as OFF for today?`,
            // confirmText: "Mark OFF",
            // type: "danger"
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const todayStr = getAdminDateKey();
            const bulkData = selectedEmployeeIds.map(empId => {
                const employeeRosters = [...rosters, ...dayRosters].filter(r =>
                    r.employeeId === empId || r.id === empId || r._id === empId
                );

                let targetShift: ShiftData | null = null;

                // Prioritize finding an actual shift to 'turn off', but if multiple exist,
                // we treat any match on this date as the target.
                for (const roster of employeeRosters) {
                    const shiftForDate = roster?.shiftData?.[todayStr];
                    if (shiftForDate) {
                        targetShift = shiftForDate;
                        // If we find one that's NOT already 'off', prioritize it for the status change
                        if (shiftForDate.shiftType !== 'off') break;
                    }
                }

                if (targetShift) {
                    return {
                        scheduleId: targetShift._id,
                        shiftType: "off",
                        startTime: [],
                        endTime: [],
                        location: targetShift.location,
                        notes: "Bulk marked as OFF"
                    } as Record<string, unknown>;
                }
                return null;
            }).filter(Boolean);

            if (bulkData.length > 0) {
                await scheduleService.bulkUpdate(bulkData as Record<string, unknown>[]);
                await fetchRosterData();
                if (selectedDate) {
                    fetchDaySchedules(selectedDate);
                }
                setSelectedEmployeeIds([]);
            } else {
                alert("No existing shifts found for today to mark as OFF.");
            }
        } catch (error) {
            console.error("Failed to bulk mark off:", error);
            alert(getErrorMessage(error, "Failed to bulk mark off"));
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = useCallback((date: Date) => {
        setSelectedDate(date);
        setIsDayPanelOpen(true);
        setDayPage(1);
        setDaySearchTerm('');
        fetchDaySchedules(date, 1, '');
    }, [fetchDaySchedules]);

    const handleEditShift = useCallback((employeeId: string, shift: ShiftData, index: number) => {
        setEditingShift(shift);
        setEditingTimeIndex(index);
        setPrefilledEmployeeId(employeeId);

        // Find employee name
        const employee = employees.find(e => {
            const safeId = getSafeEmployeeId(e);
            return safeId === employeeId || e.id === employeeId || e.employeeId === employeeId;
        });
        setPrefilledEmployeeName(employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : "");

        // Set prefilled date
        if (shift.date) {
            setPrefilledDate(parseISO(shift.date));
        } else if (selectedDate) {
            setPrefilledDate(selectedDate);
        }

        // Set existing shifts for that day
        const roster = [...rosters, ...dayRosters].find(r => r.employeeId === employeeId);
        if (roster && selectedDate) {
            const dateKey = getAdminDateKey(selectedDate);
            const dayShift = roster.shiftData?.[dateKey];
            setExistingDayShifts(dayShift ? [dayShift] : []);
        }

        setIsShiftEditorOpen(true);
    }, [employees, rosters, dayRosters, selectedDate]);

    const handleAddShift = useCallback((employeeId: string) => {
        setEditingShift(null);
        setEditingTimeIndex(null);
        setPrefilledEmployeeId(employeeId);

        const employee = employees.find(e => {
            const safeId = getSafeEmployeeId(e);
            return safeId === employeeId || e.id === employeeId || e.employeeId === employeeId;
        });
        setPrefilledEmployeeName(employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : "");

        if (selectedDate) {
            setPrefilledDate(selectedDate);
        }

        const roster = [...rosters, ...dayRosters].find(r => r.employeeId === employeeId);
        if (roster && selectedDate) {
            const dateKey = getAdminDateKey(selectedDate);
            const dayShift = roster.shiftData?.[dateKey];
            setExistingDayShifts(dayShift ? [dayShift] : []);
        }

        setIsShiftEditorOpen(true);
    }, [employees, rosters, dayRosters, selectedDate]);

    const handleDayPageChange = useCallback((page: number) => {
        if (selectedDate) {
            fetchDaySchedules(selectedDate, page, daySearchTerm);
        }
    }, [selectedDate, daySearchTerm, fetchDaySchedules]);

    const handleDaySearchChange = useCallback((search: string) => {
        setDaySearchTerm(search);
        setDayPage(1); // Reset to page 1 on search
        if (selectedDate) {
            fetchDaySchedules(selectedDate, 1, search);
        }
    }, [selectedDate, fetchDaySchedules]);


    if (isInitialLoading) {
        return <GlobalLoader fullScreen message="Loading Rosters..." />;
    }

    return (
        <>
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 mx-auto px-2 sm:px-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 relative z-40">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">Deployment Rosters</h1>
                        <p className="text-sm sm:text-base text-foreground-tertiary mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Manage daily and weekly shifts for your workforce.
                        </p>
                    </div>
                    <TimezoneToggle variant="horizontal" />
                </div>

                {/* Bulk Actions Toolbar */}
                {canManageSchedule && selectedEmployeeIds.length > 0 && (
                    <BulkActionsToolbar
                        selectedCount={selectedEmployeeIds.length}
                        onBulkAssign={handleBulkAssign}
                        onBulkMarkOff={handleBulkMarkOff}
                        onClearSelection={() => setSelectedEmployeeIds([])}
                    />
                )}

                <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
                    {/* Search */}
                    <div className="flex-1 w-full">
                        {viewType !== 'calendar' && (
                            <MultiEmployeeSearch
                                options={employees.map(u => ({
                                    ...u,
                                    _id: getSafeEmployeeId(u)
                                }))}
                                selectedEmployees={selectedEmployeeIds}
                                onSelectionChange={setSelectedEmployeeIds}
                                searchKey="schedule-employee-search"
                                placeholder="Select employees..."
                            />
                        )}
                    </div>

                    {/* Date Navigation & Views - Centered on large screens */}
                    <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2 bg-surface/80 p-1 rounded-xl border border-border/50 h-[42px]">
                            <button
                                onClick={handlePrevious}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-foreground-tertiary hover:text-primary"
                                title="Previous"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xs font-black uppercase tracking-widest px-2 min-w-[140px] text-center border-x border-border/50">
                                {getRangeLabel()}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={isNextDisabled}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors text-foreground-tertiary",
                                    isNextDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-muted hover:text-primary"
                                )}
                                title="Next"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-surface/80 rounded-xl border border-border/50 h-[42px]">
                            <button
                                onClick={() => setViewMode("week")}
                                className={cn(
                                    "px-3 h-full rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    viewMode === "week" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground-tertiary hover:bg-muted"
                                )}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode("month")}
                                className={cn(
                                    "px-3 h-full rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    viewMode === "month" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground-tertiary hover:bg-muted"
                                )}
                            >
                                Month
                            </button>
                        </div>

                        <button
                            onClick={handleToday}
                            className="h-[42px] px-4 rounded-xl border-border/50 bg-surface/80 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary hover:bg-muted hover:text-primary transition-all border"
                        >
                            Today
                        </button>
                    </div>

                    {/* Filters & View Switches */}
                    <div className="shrink-0 flex items-center gap-3">
                        <UnifiedFilter
                            filters={[
                                {
                                    id: "department",
                                    label: "Department",
                                    value: departmentName,
                                    onChange: setDepartmentName,
                                    options: [
                                        { value: "all", label: "All Depts" },
                                        ...departments.map(d => ({ value: d.name, label: d.name }))
                                    ]
                                }
                            ]}
                        />

                        <div className="h-[42px] p-1 bg-surface/80 rounded-xl border border-border/50 flex items-center gap-1">
                            <button
                                onClick={() => setViewType("grid")}
                                className={cn(
                                    "w-9 h-full flex items-center justify-center rounded-lg transition-all",
                                    viewType === "grid" ? "bg-primary/10 text-primary" : "text-foreground-tertiary hover:bg-muted"
                                )}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewType("calendar")}
                                className={cn(
                                    "w-9 h-full flex items-center justify-center rounded-lg transition-all",
                                    viewType === "calendar" ? "bg-primary/10 text-primary" : "text-foreground-tertiary hover:bg-muted"
                                )}
                                title="Calendar View"
                            >
                                <Users className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* View Container */}
                <div className="relative min-h-[400px] -mx-4 px-4 sm:mx-0 sm:px-0">
                    {loading && (
                        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300 rounded-3xl">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Syncing Rosters...</p>
                        </div>
                    )}

                    {viewType === 'grid' && (
                        <div className="min-w-[450px] lg:min-w-0">
                            <CalendarView
                                referenceDate={referenceDate}
                                usersByDate={transformedUsersByDate}
                                onDateClick={handleDateClick}
                                loading={loading}
                                viewMode={viewMode}
                                holidays={holidays}
                            />
                        </div>
                    )}

                    {viewType === 'calendar' && (
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-80 flex-shrink-0 order-2 lg:order-1">
                                <EmployeeListPanel
                                    selectedIds={selectedEmployeeIds}
                                    onSelectionChange={setSelectedEmployeeIds}
                                    onEmployeeSelect={setSelectedEmployee}
                                />
                            </div>
                            <div className="flex-1 order-1 lg:order-2">
                                {selectedEmployee ? (
                                    <EmployeeCalendarView
                                        referenceDate={referenceDate}
                                        roster={[...rosters, ...dayRosters].find(r =>
                                        (selectedEmployee && (
                                            r.employeeId === selectedEmployee.employeeId ||
                                            r.employeeId === selectedEmployee.id ||
                                            r.employeeId === selectedEmployee._id ||
                                            r._id === selectedEmployee._id ||
                                            r._id === selectedEmployee.id
                                        ))
                                        ) || rosters[0] || null}
                                        onDateClick={handleDateClick}
                                        viewMode={viewMode}
                                        holidays={holidays}
                                    />
                                ) : (
                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-surface rounded-3xl border border-dashed border-border/40 p-12 text-center">
                                        <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-4">
                                            <Users className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-black text-foreground">No Employee Selected</h3>
                                        <p className="text-sm text-foreground-tertiary mt-2 max-w-sm">
                                            Select an employee from the panel on the left to view their individual deployment roster.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Day Schedule Panel */}
            <DaySchedulePanel
                isOpen={isDayPanelOpen}
                onClose={() => setIsDayPanelOpen(false)}
                selectedDate={selectedDate}
                rosters={dayRosters.length > 0 ? dayRosters : rosters}
                loading={isDayLoading}
                currentPage={dayPage}
                totalPages={dayTotalPages}
                onPageChange={handleDayPageChange}
                onSearchChange={handleDaySearchChange}
                onEditShift={handleEditShift}
                onDeleteShift={handleDeleteShift}
                onAddShift={handleAddShift}
                viewType={viewType}
            />

            {/* Shift Editor Modal */}
            <ShiftEditor
                isOpen={isShiftEditorOpen}
                onClose={() => {
                    setIsShiftEditorOpen(false);
                    setIsBulkMode(false);
                }}
                onSave={handleSaveShift}
                isBulkMode={isBulkMode}
                selectedEmployeeIds={selectedEmployeeIds}
                shift={editingShift}
                editingTimeIndex={editingTimeIndex}
                prefilledEmployeeId={prefilledEmployeeId}
                prefilledEmployeeName={prefilledEmployeeName}
                prefilledDate={prefilledDate}
                employees={employees}
                locations={locations}
                existingShifts={existingDayShifts}
            />
            {ConfirmationDialog}
        </>
    );
};

export default ScheduleList;
