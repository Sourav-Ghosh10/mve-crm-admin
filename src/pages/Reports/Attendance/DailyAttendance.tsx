import React, { useState, useCallback, useEffect } from "react";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { attendanceService } from "../../../services/attendanceService";
import type { Attendance, AttendanceFilters } from "../../../types/attendance.types";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import UnifiedFilter from "../../../components/common/Filter/UnifiedFilter";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
// import GlobalLoader from "../../../components/common/LoadingSpinner/GlobalLoader";
import Avatar from "../../../components/common/Avatar";
import { cn } from "../../../lib/utils";
import { Link } from "react-router-dom";
import { reportService } from "../../../services/reportService";

const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
        present: "bg-success/10 text-success border-success/20",
        absent: "bg-error/10 text-error border-error/20",
        late: "bg-warning/10 text-warning border-warning/20",
        "half-day": "bg-blue-500/10 text-blue-600 border-blue-500/20",
        "on-leave": "bg-purple-500/10 text-purple-600 border-purple-500/20",
        holiday: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
            variants[status.toLowerCase()] || "bg-muted text-foreground-tertiary border-border"
        )}>
            {status}
        </span>
    );
};

const DailyAttendanceReport: React.FC = () => {
    const [records, setRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const now = new Date();
            const start = format(now, "yyyy-MM-dd");
            const end = format(now, "yyyy-MM-dd");

            const filters: AttendanceFilters = {
                page,
                limit: 10,
                startDate: start,
                endDate: end,
                status: statusFilter === "all" ? undefined : statusFilter,
                search: searchTerm.trim() || undefined
            };

            const resp = await attendanceService.getAll(filters);
            setRecords(resp.attendances || []);
            setTotal(resp.total || 0);
            setTotalPages(resp.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch daily attendance:", err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchTerm]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleExport = async (format: 'pdf' | 'csv') => {
        try {
            const now = new Date();
            const start = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
            const end = new Date(now.setHours(23, 59, 59, 999)).toISOString().split('T')[0];

            await reportService.generateReport({
                type: 'attendance',
                format,
                startDate: start,
                endDate: end,
                status: statusFilter === "all" ? undefined : statusFilter,
                search: searchTerm.trim() || undefined
            });
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const columns = [
        {
            _id: "name",
            label: "Employee",
            format: (_: unknown, row: Attendance) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={row.employeeId?.personalInfo?.profilePicture}
                        firstName={row.employeeId?.personalInfo?.firstName}
                        lastName={row.employeeId?.personalInfo?.lastName}
                        size="sm"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                            {row.name || row.employeeId?.personalInfo?.firstName + " " + row.employeeId?.personalInfo?.lastName}
                        </span>
                        <span className="text-[10px] text-foreground-tertiary">{row.employeeId?.employeeId || "N/A"}</span>
                    </div>
                </div>
            )
        },
        {
            _id: "dept",
            label: "Dept",
            format: (_: unknown, row: Attendance) => (
                <span className="text-sm font-bold text-foreground-secondary">
                    {row.employeeId?.employment?.department || "N/A"}
                </span>
            )
        },
        {
            _id: "checkIn",
            label: "Punch In",
            format: (_: unknown, row: Attendance) => (
                <span className="text-sm font-mono text-foreground-secondary">
                    {row.checkIn?.time ? new Date(row.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                </span>
            )
        },
        {
            _id: "checkOut",
            label: "Punch Out",
            format: (_: unknown, row: Attendance) => (
                <span className="text-sm font-mono text-foreground-secondary">
                    {row.checkOut?.time ? new Date(row.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                </span>
            )
        },
        {
            _id: "totalHours",
            label: "Working Hours",
            format: (val: unknown) => {
                const totalHours = Number(val) || 0;
                const hh = Math.floor(totalHours);
                const mm = Math.round((totalHours - hh) * 60);
                return <span className="text-sm font-bold text-foreground">{hh}h {mm}m</span>;
            }
        },
        {
            _id: "status",
            label: "Status",
            format: (val: unknown) => getStatusBadge(String(val))
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/reports" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Reports</Link>
                        <span className="text-foreground-tertiary text-xs">/</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Daily Attendance</span>
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Daily Attendance Report</h1>
                    <p className="text-xs font-bold text-foreground-tertiary mt-1 uppercase tracking-wider">Show records for {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        startIcon={<Download className="w-4 h-4" />}
                        className="rounded-xl border-primary text-primary"
                        onClick={() => handleExport('pdf')}
                    >
                        Export PDF
                    </Button>
                    <Button
                        variant="outline"
                        startIcon={<Download className="w-4 h-4" />}
                        className="rounded-xl"
                        onClick={() => handleExport('csv')}
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="daily-attendance-report"
                        placeholder="Search employee..."
                    />
                </div>
                <UnifiedFilter
                    filters={[{
                        id: "status",
                        label: "Status",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: "all", label: "All Status" },
                            { value: "present", label: "Present" },
                            { value: "absent", label: "Absent" },
                            { value: "late", label: "Late" },
                            { value: "on-leave", label: "On-Leave" },
                            { value: "half-day", label: "Half-Day" }
                        ]
                    }]}
                />
            </div>

            <div className="bg-surface rounded-3xl border border-border/40 overflow-hidden relative min-h-[400px]">
                {loading && <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center font-black text-primary">SYNCING...</div>}
                <Table columns={columns} rows={records} className="border-none" />
            </div>

            <div className="flex justify-between items-center px-4">
                <p className="text-xs font-bold text-foreground-tertiary">Total Records: {total}</p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </div>
    );
};

export default DailyAttendanceReport;
