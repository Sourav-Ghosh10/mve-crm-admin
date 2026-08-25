import React, { useState, useCallback, useEffect } from "react";
import { Download } from "lucide-react";
import { leaveService } from "../../../services/leaveService";
import type { LeaveRequest, LeaveRequestQueryParams, LeaveStatus } from "../../../services/leaveService";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import UnifiedFilter from "../../../components/common/Filter/UnifiedFilter";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
import Avatar from "../../../components/common/Avatar";
import { cn } from "../../../lib/utils";
import { Link } from "react-router-dom";
import { reportService } from "../../../services/reportService";
import { departmentService } from "../../../services/departmentService";
import type { Department } from "../../../types/organization.types";

const LeaveHistoryReport: React.FC = () => {
    const [records, setRecords] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const resp = await departmentService.getAll({ limit: 100 });
                setDepartments(resp.data || []);
            } catch (err) {
                console.error("Failed to fetch departments:", err);
            }
        };
        fetchDepts();
    }, []);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const params: LeaveRequestQueryParams = {
                page,
                limit: 10,
                status: statusFilter === "all" ? "all" : (statusFilter as LeaveStatus),
                search: searchTerm.trim() || undefined
            };

            const resp = await leaveService.getRequests(params);
            setRecords(resp.data || []);
            setTotal(resp.pagination.total || 0);
            setTotalPages(resp.pagination.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch leave history:", err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchTerm]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleExport = async (format: 'pdf' | 'csv') => {
        try {
            await reportService.generateReport({
                type: 'leave',
                format,
                status: statusFilter === "all" ? undefined : statusFilter,
                department: departmentFilter === "all" ? undefined : departmentFilter
            });
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const columns = [
        {
            _id: "employee",
            label: "Employee",
            format: (_: unknown, row: LeaveRequest) => {
                const employee = typeof row.employeeId === 'object' ? row.employeeId : null;
                // const employeeIdString = employee ? employee.id : row.employeeId;

                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={employee?.personalInfo?.profilePicture}
                            firstName={employee?.personalInfo?.firstName}
                            lastName={employee?.personalInfo?.lastName}
                            size="sm"
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">
                                {employee ? `${employee.personalInfo?.firstName} ${employee.personalInfo?.lastName}` : 'System'}
                            </span>
                            {/* <span className="text-[10px] text-foreground-tertiary">ID: {employeeIdString}</span> */}
                        </div>
                    </div>
                );
            }
        },
        {
            _id: "leaveType",
            label: "Type",
            format: (val: unknown) => (
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-lg">
                    {val as string}
                </span>
            )
        },
        {
            _id: "startDate",
            label: "Duration",
            format: (_: unknown, row: LeaveRequest) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground-secondary">
                        {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-black uppercase text-foreground-tertiary">{row.numberOfDays} Days</span>
                </div>
            )
        },
        {
            _id: "status",
            label: "Status",
            format: (val: unknown) => {
                const variants: Record<string, string> = {
                    approved: "bg-success/10 text-success border-success/20",
                    pending: "bg-warning/10 text-warning border-warning/20",
                    rejected: "bg-error/10 text-error border-error/20"
                };
                const statusStr = String(val).toLowerCase();
                return (
                    <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                        variants[statusStr] || "bg-muted text-foreground-tertiary border-border"
                    )}>
                        {val as string}
                    </span>
                );
            }
        },
        {
            _id: "createdAt",
            label: "Applied On",
            format: (val: unknown) => (
                <span className="text-xs text-foreground-tertiary">
                    {new Date(val as string).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/reports" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Reports</Link>
                        <span className="text-foreground-tertiary text-xs">/</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Leave History</span>
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Leave History Audit</h1>
                    <p className="text-xs font-bold text-foreground-tertiary mt-1 uppercase tracking-wider">Historical records of all leave applications</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        startIcon={<Download className="w-4 h-4" />}
                        className="rounded-xl"
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="leave-history-report"
                        placeholder="Search by name or employee ID..."
                    />
                </div>
                <UnifiedFilter
                    filters={[
                        {
                            id: "status",
                            label: "Status",
                            value: statusFilter,
                            onChange: setStatusFilter,
                            options: [
                                { value: "all", label: "All Status" },
                                { value: "pending", label: "Pending" },
                                { value: "approved", label: "Approved" },
                                { value: "rejected", label: "Rejected" }
                            ]
                        },
                        {
                            id: "department",
                            label: "Department",
                            value: departmentFilter,
                            onChange: setDepartmentFilter,
                            options: [
                                { value: "all", label: "All Depts" },
                                ...departments.map(d => ({ value: d.name, label: d.name }))
                            ]
                        }
                    ]}
                />
            </div>

            <div className="bg-surface rounded-3xl border border-border/40 overflow-hidden relative min-h-[400px]">
                {loading && <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center font-black text-primary">SYNCING...</div>}
                <Table columns={columns} rows={records} className="border-none" />
            </div>

            <div className="flex justify-between items-center px-4">
                <p className="text-xs font-bold text-foreground-tertiary tracking-tight font-mono">Records Found: {total}</p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </div>
    );
};

export default LeaveHistoryReport;
