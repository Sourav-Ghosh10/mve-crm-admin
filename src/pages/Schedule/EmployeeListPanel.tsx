import React, { useState, useEffect, useCallback } from "react";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { userService } from "../../services/userService";
import { roleService } from "../../services/roleService";
import type { User, UserFilters } from "../../types/user.types";
import type { Role } from "../../types/role.types";
import { SearchInput } from "../../components/common/Search/SearchInput";

interface EmployeeListPanelProps {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEmployeeSelect: (employee: User | null) => void;
}

const EmployeeListPanel: React.FC<EmployeeListPanelProps> = ({
    selectedIds,
    onSelectionChange,
    onEmployeeSelect,
}) => {
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<UserFilters>({
        limit: 6,
    });
    const [showFilters, setShowFilters] = useState(true);
    const [departments, setDepartments] = useState<string[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const queryFilters: UserFilters = {
                ...filters,
                page,
            };
            if (search.trim()) {
                queryFilters.search = search.trim();
            }

            // Remove empty strings to avoid validation errors
            if (!queryFilters.roleId) delete queryFilters.roleId;
            if (!queryFilters.department) delete queryFilters.department;

            const response = await userService.getAll(queryFilters);
            setEmployees(response.users);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setLoading(false);
        }
    }, [filters, search, page]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch roles from service
                const rolesRes = await roleService.getAll({ limit: 100, isActive: true });
                setRoles(rolesRes.data);

                // Fetch departments (or hardcode if no service exists yet)
                setDepartments(["Operations", "Safety", "Logistics", "IT", "HR"]);
            } catch (error) {
                console.error("Failed to fetch filters:", error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = employees.map((emp) => emp.id);
            const combined = Array.from(new Set([...selectedIds, ...allIds]));
            onSelectionChange(combined);
        } else {
            const currentIds = employees.map((emp) => emp.id);
            const filtered = selectedIds.filter((id) => !currentIds.includes(id));
            onSelectionChange(filtered);
        }
    };

    const handleToggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((sid) => sid !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const isAllSelected = employees.length > 0 && employees.every((emp) => selectedIds.includes(emp.id));

    return (
        <div className="flex flex-col h-full bg-surface border-r border-border/50">
            {/* Header */}
            <div className="p-4 border-b border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-foreground">Employees</h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            showFilters ? "bg-primary/10 text-primary" : "text-foreground-tertiary hover:bg-muted"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div>
                    <SearchInput
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        searchKey="employee-panel-search"
                        placeholder="Search by name, ID..."
                        className="bg-muted/30 border-border/50 rounded-xl"
                    />
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="p-4 bg-muted/20 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300 border border-border/50 shadow-inner">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">Role</label>
                                <select
                                    className="w-full px-2 py-1.5 bg-surface border border-border/50 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    value={typeof filters.roleId === 'string' ? filters.roleId : ""}
                                    onChange={(e) => {
                                        setFilters({ ...filters, roleId: e.target.value || undefined });
                                        setPage(1);
                                    }}
                                >
                                    <option value="">All Roles</option>
                                    {roles.map(r => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">Status</label>
                                <select
                                    className="w-full px-2 py-1.5 bg-surface border border-border/50 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFilters({
                                            ...filters,
                                            isActive: val === "all" ? undefined : val === "active",
                                        });
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">Department</label>
                            <select
                                className="w-full px-2 py-1.5 bg-surface border border-border/50 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                value={filters.department || ""}
                                onChange={(e) => {
                                    setFilters({ ...filters, department: e.target.value });
                                    setPage(1);
                                }}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setFilters({ limit: 6 });
                                    setSearch("");
                                }}
                                className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-primary uppercase">Loading...</span>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {/* Select All Row */}
                        <div className="flex items-center px-4 py-2 bg-muted/5">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="ml-3 text-[10px] font-black uppercase text-foreground-tertiary tracking-wider">
                                Select All
                            </span>
                        </div>

                        {employees.map((emp) => (
                            <div
                                key={emp.id}
                                className={cn(
                                    "flex items-center px-4 py-3 cursor-pointer transition-colors group",
                                    selectedIds.includes(emp.id) ? "bg-primary/5" : "hover:bg-muted/30"
                                )}
                                onClick={() => {
                                    onEmployeeSelect(emp);
                                }}
                            >
                                <div onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(emp.id)}
                                        onChange={() => handleToggleSelect(emp.id)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                </div>
                                <div className="ml-3 flex-1 min-w-0" onClick={() => onEmployeeSelect(emp)}>
                                    <h4 className="text-sm font-bold text-foreground truncate">
                                        {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                                    </h4>
                                    <p className="text-[10px] font-medium text-foreground-tertiary truncate">
                                        {typeof emp.employment.role === 'string' ? emp.employment.role : emp.employment.role?.name} • {emp.employment.department}
                                    </p>
                                </div>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    emp.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"
                                )} />
                            </div>
                        ))}

                        {employees.length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-xs font-bold text-foreground-tertiary">No employees found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] font-black text-foreground-tertiary">
                    Page {page} of {totalPages}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg border border-border/50 disabled:opacity-30 hover:bg-muted text-foreground-secondary"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg border border-border/50 disabled:opacity-30 hover:bg-muted text-foreground-secondary"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeListPanel;
