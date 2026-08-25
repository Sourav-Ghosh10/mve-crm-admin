import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Edit,
  Eye,
  UserCheck,
  UserX,
  RefreshCcw,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { User, UserFilters, EmploymentType } from "../../types/user.types";

import { useDebounce } from "../../hooks/useDebounce";
import { useConfirmation } from "../../hooks/useConfirmation";
import { cn } from "../../lib/utils";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import Table from "../../components/common/Table";
import { userService } from "../../services/userService";
import type { EmployeePresence } from "../../services/userService";
import { departmentService } from "../../services/departmentService";
import { roleService } from "../../services/roleService";
import { scheduleService } from "../../services/scheduleService";
import type { Department } from "../../types/organization.types";
import type { Role } from "../../types/role.types";
import GlobalLoader from "../../components/common/LoadingSpinner/GlobalLoader";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import UnifiedFilter from "../../components/common/Filter/UnifiedFilter";
import FilterDropdown from "../../components/common/Filter/FilterDropdown";
import Pagination from "../../components/common/Pagination";
import { getErrorMessage } from "../../utils/errorHandling";
import { SearchInput } from "../../components/common/Search/SearchInput";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

// ─── Presence helpers ───────────────────────────────────────────────
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const PRESENCE_POLL_INTERVAL_MS = 90 * 1000; // 90 seconds

const isUserOnline = (lastActiveAt: string | null | undefined): boolean => {
  if (!lastActiveAt) return false;
  return new Date(lastActiveAt).getTime() > Date.now() - ONLINE_THRESHOLD_MS;
};

const getTimeAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return "long time ago";
};
// ────────────────────────────────────────────────────────────────────

const getStatusBadge = (isActive: boolean) => {
  return (
    <span
      className={cn(
        "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
        isActive
          ? "bg-success/10 text-success border border-success/20 shadow-sm shadow-success/5"
          : "bg-muted text-foreground-tertiary border border-border shadow-sm",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const getRoleBadge = (role: string | Role) => {
  const roleName = typeof role === 'string' ? role : role?.name || 'Unknown';
  const variants: Record<string, string> = {
    admin: "bg-primary/10 text-primary border-primary/20",
    hr: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    manager: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    employee: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
      variants[roleName.toLowerCase()] || variants.employee
    )}>
      {roleName}
    </span>
  );
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 700);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [deptFilter, setDeptFilter] = useState<string>(searchParams.get("dept") || "all");
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get("role") || "all");
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") || "all");
  const initialPage = Number(searchParams.get("page")) || 1;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasData, setHasData] = useState(true); // Track if any data exists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(6);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sync state to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearchTerm) params.search = debouncedSearchTerm;
    if (statusFilter !== "all") params.status = statusFilter;
    if (deptFilter !== "all") params.dept = deptFilter;
    if (roleFilter !== "all") params.role = roleFilter;
    if (typeFilter !== "all") params.type = typeFilter;
    if (page > 1) params.page = page.toString();
    
    setSearchParams(params, { replace: true });
  }, [debouncedSearchTerm, statusFilter, deptFilter, roleFilter, typeFilter, page, setSearchParams]);

  // ─── Presence state ──────────────────────────────────────────────
  const [presenceMap, setPresenceMap] = useState<Map<string, EmployeePresence>>(new Map());
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPresence = useCallback(async () => {
    try {
      // Skip if tab is not visible
      if (document.hidden) return;
      const data = await userService.getPresence();
      const map = new Map<string, EmployeePresence>();
      data.forEach((emp) => map.set(emp._id, emp));
      setPresenceMap(map);
    } catch (err) {
      console.error("Failed to fetch presence:", err);
    }
  }, []);

  // Initial presence fetch + light polling every 90 seconds
  useEffect(() => {
    fetchPresence();
    presenceIntervalRef.current = setInterval(fetchPresence, PRESENCE_POLL_INTERVAL_MS);
    return () => {
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
    };
  }, [fetchPresence]);
  // ────────────────────────────────────────────────────────────────

  const { confirm, ConfirmationDialog } = useConfirmation();

  // Permissions
  const { hasPermission: canCreate } = usePermissions(PERMISSIONS.EMPLOYEE_CREATE);
  const { hasPermission: canEdit } = usePermissions(PERMISSIONS.EMPLOYEE_EDIT);
  const { hasPermission: canDelete } = usePermissions(PERMISSIONS.EMPLOYEE_DELETE);
  const { hasPermission: canManageSchedule } = usePermissions(PERMISSIONS.SCHEDULE_MANAGE);

  const fetchUsers = React.useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      const filters: UserFilters = {
        page: currentPage,
        limit,
      };

      if (debouncedSearchTerm.trim()) {
        filters.search = debouncedSearchTerm.trim();
      }

      if (statusFilter === "active") filters.isActive = true;
      if (statusFilter === "inactive") filters.isActive = false;

      if (deptFilter !== "all") {
        filters.department = deptFilter;
      }

      if (roleFilter !== "all") {
        filters.roleId = roleFilter;
      }

      if (typeFilter !== "all") {
        filters.employmentType = typeFilter as EmploymentType;
      }

      const response = await userService.getAll(filters);
      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.totalPages);

      // Only disable search if there's no data AND no active filters/search
      const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all" || deptFilter !== "all" || roleFilter !== "all" || typeFilter !== "all";
      if (!hasActiveFilters && response.total === 0) {
        setHasData(false);
      } else if (response.total > 0) {
        setHasData(true);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, deptFilter, roleFilter, typeFilter, limit]);

  // Fetch departments and roles on mount
  React.useEffect(() => {
    const loadFilters = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          departmentService.getAll({ limit: 100, isActive: true }),
          roleService.getAll({ limit: 100, isActive: true })
        ]);
        setDepartments(deptRes.data);
        setRoles(roleRes.data);
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      }
    };
    loadFilters();
  }, []);

  // Handle search, status filter, and limit changes
  React.useEffect(() => {
    setPage(1);
    fetchUsers(1);
  }, [fetchUsers]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage);
  };

  const handleAddUser = () => {
    navigate("/users/create");
  };

  const handleEditUser = (user: User) => {
    navigate(`/users/edit/${user._id}`);
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? "deactivate" : "activate";
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
      variant: user.isActive ? 'danger' : 'info'
    });

    if (confirmed) {
      try {
        await userService.delete(user._id, !user.isActive);
        await fetchUsers(page);
      } catch (error) {
        console.error(`Failed to ${action} user:`, error);
        const errorMessage = getErrorMessage(error, `Failed to ${action} user`);
        const errorMessageStr = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
        await confirm({
          title: "Error",
          message: errorMessageStr,
          confirmLabel: "OK",
          variant: "danger"
        });
      }
    }
  };
  const handleResetRoster = async () => {
    const confirmed = await confirm({
      title: "Reset All Rosters",
      message: "Are you sure you want to reset all employee rosters from today up to Sunday? This will overwrite any manual adjustments with profile defaults.",
      confirmLabel: "Reset Roster",
      variant: "danger"
    });

    if (confirmed) {
      try {
        setLoading(true);
        await scheduleService.resetRoster();
        await confirm({
          title: "Success",
          message: "Rosters have been reset and regenerated successfully up to Sunday.",
          confirmLabel: "OK",
          variant: "success"
        });
      } catch (error) {
        console.error("Failed to reset roster:", error);
        const errorMessage = getErrorMessage(error, "Failed to reset roster");
        await confirm({
          title: "Error",
          message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
          confirmLabel: "OK",
          variant: "danger"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetIndividualRoster = async (user: User) => {
    const confirmed = await confirm({
      title: "Reset Employee Roster",
      message: `Are you sure you want to reset the roster for ${user.personalInfo.firstName} ${user.personalInfo.lastName} from today up to Sunday?`,
      confirmLabel: "Reset Roster",
      variant: "danger"
    });

    if (confirmed) {
      try {
        setLoading(true);
        await scheduleService.resetRoster(user._id);
        await confirm({
          title: "Success",
          message: `Roster for ${user.personalInfo.firstName} has been reset successfully.`,
          confirmLabel: "OK",
          variant: "success"
        });
      } catch (error) {
        console.error("Failed to reset individual roster:", error);
        const errorMessage = getErrorMessage(error, "Failed to reset roster");
        await confirm({
          title: "Error",
          message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
          confirmLabel: "OK",
          variant: "danger"
        });
      } finally {
        setLoading(false);
      }
    }
  };

   const columns = [
    {
      _id: "name",
      label: "Employee Profile",
      format: (_: unknown, row: User) => {
        const presence = presenceMap.get(row._id);
        const lastActive = presence?.lastActiveAt || row.lastActiveAt;
        const online = isUserOnline(lastActive);

        return (
          <Button
            variant="ghost"
            onClick={() => navigate(`/users/${row._id}`)}
            className="group text-left h-auto p-0 hover:bg-transparent flex items-center gap-4 py-1"
          >
            <div className="relative">
              <Avatar
                src={row.personalInfo.profilePicture}
                firstName={row.personalInfo.firstName}
                lastName={row.personalInfo.lastName}
                size="lg"
                className="group-hover:scale-105 group-hover:rotate-3 transition-transform"
              />
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface transition-colors",
                  online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-gray-400"
                )}
              />
            </div>
            <div>
              <div className="font-bold text-foreground group-hover:text-primary transition-colors text-base leading-snug">
                {row.personalInfo.firstName} {row.personalInfo.lastName}
              </div>
              <div className="text-xs font-medium text-foreground-tertiary flex items-center gap-2">
                <span className="bg-muted px-1.5 py-0.5 rounded-md border border-border/50">{row.employeeId}</span>
                <span className="opacity-30">•</span>
                <span className="truncate max-w-[150px]">{row.personalInfo.email}</span>
              </div>
            </div>
          </Button>
        );
      },
    },
    {
      _id: "presence",
      label: "Presence",
      format: (_: unknown, row: User) => {
        const presence = presenceMap.get(row._id);
        const lastActive = presence?.lastActiveAt || row.lastActiveAt;
        const online = isUserOnline(lastActive);

        return (
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span
                className={cn(
                  "block w-2.5 h-2.5 rounded-full transition-colors",
                  online ? "bg-emerald-500" : "bg-gray-400"
                )}
              />
              {online && (
                <span className="absolute inline-flex w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  online ? "text-emerald-600" : "text-foreground-tertiary"
                )}
              >
                {online ? "Online" : "Offline"}
              </span>
              {!online && lastActive && (
                <span className="text-[10px] text-foreground-tertiary/70 leading-tight">
                  Last seen {getTimeAgo(lastActive)}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      _id: "role",
      label: "Authority",
      format: (_: unknown, row: User) => getRoleBadge(row.employment.role),
    },
    {
      _id: "department",
      label: "Division & Role",
      format: (_: unknown, row: User) => (
        <div className="space-y-1">
          <div className="font-bold text-foreground-secondary text-sm">{row.employment.department}</div>
          <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-tighter bg-muted/50 px-2 py-0.5 rounded-lg border border-border/30 w-fit">
            {row.employment.designation}
          </div>
        </div>
      )
    },
    {
      _id: "status",
      label: "Availability",
      format: (_: unknown, row: User) => getStatusBadge(row.isActive),
    },
    {
      _id: "actions",
      label: "Actions",
      align: "center" as const,
      format: (_: unknown, row: User) => (
        <div className="flex items-center justify-center gap-2 pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/users/${row._id}`)}
            className="w-9 h-9 rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all group"
            title="View Insight"
          >
            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Button>

          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditUser(row)}
              className="w-9 h-9 rounded-xl hover:bg-accent/10 hover:text-foreground text-foreground-secondary transition-all group"
              title="Modify"
            >
              <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </Button>
          )}

          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleStatus(row)}
              className={cn(
                "w-9 h-9 rounded-xl transition-all group",
                row.isActive
                  ? "hover:bg-warning/10 hover:text-warning text-foreground-secondary"
                  : "hover:bg-success/10 hover:text-success text-foreground-secondary"
              )}
              title={row.isActive ? "Deactivate User" : "Activate User"}
            >
              {row.isActive ? (
                <UserX className="w-4 h-4 group-hover:scale-110 transition-transform" />
              ) : (
                <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </Button>
          )}

          {canManageSchedule && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleResetIndividualRoster(row)}
              className="w-9 h-9 rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all group"
              title="Reset Roster"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isInitialLoading) {
    return <GlobalLoader fullScreen message="Loading Directory..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 px-2 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight">User Directory</h1>
          <p className="text-sm sm:text-base text-foreground-tertiary mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Manage and monitor your global workforce efficiency.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
          {canManageSchedule && (
            <Button
              variant="outline"
              onClick={handleResetRoster}
              startIcon={<RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              Reset Roster
            </Button>
          )}
          {canCreate && (
            <Button
              onClick={handleAddUser}
              startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              Onboard Talent
            </Button>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            searchKey="users"
            placeholder="Search name, ID..."
            disabled={!hasData}
          />
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2">
          <UnifiedFilter
            filters={[
              {
                id: "dept",
                label: "Department",
                value: deptFilter,
                onChange: setDeptFilter,
                options: [
                  { value: "all", label: "All Departments" },
                  ...departments.map(d => ({ value: d.name, label: d.name }))
                ]
              },
              {
                id: "role",
                label: "Role",
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { value: "all", label: "All Roles" },
                  ...roles.map(r => ({ value: r._id, label: r.name }))
                ]
              },
              {
                id: "type",
                label: "Employment Type",
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { value: "all", label: "All Types" },
                  { value: "full-time", label: "Full-Time" },
                  { value: "part-time", label: "Part-Time" },
                  { value: "contract", label: "Contract" },
                  { value: "intern", label: "Intern" },
                ]
              },
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
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
            <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Syncing Directory...</p>
          </div>
        )}
        <Table
          columns={columns}
          rows={users}
          className="border-none"
          tableClassName="min-w-[640px]"
          emptyState={
            <EmptyState
              title="No personnel found"
              description={searchTerm ? `No results for "${searchTerm}"` : "The directory is currently empty."}
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
              options={[6, 12, 24, 50].map(v => ({ value: v.toString(), label: `${v} / Page` }))}
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
      {ConfirmationDialog}
    </div>
  );
};

export default UserList;
