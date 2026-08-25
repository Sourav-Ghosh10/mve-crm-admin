import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Edit,
  Trash2,
  Calendar,
  User as UserIcon,
  CreditCard,
  History,
  Search,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import payrollService, {
  type SalaryConfig,
  type AllowanceDeductionMaster,
} from "../../../services/payrollService";
import { userService } from "../../../services/userService";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import SalaryConfigForm from "./SalaryConfigForm";
import BulkSalarySetupModal from "./BulkSalarySetupModal";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";
import { format } from "date-fns";

const SalaryConfigList: React.FC = () => {
  const [allMergedConfigs, setAllMergedConfigs] = useState<SalaryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { confirm, ConfirmationDialog } = useConfirmation();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [currentConfig, setCurrentConfig] =
    useState<Partial<SalaryConfig> | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | string[] | null>(null);

  const { hasPermission: canManage } = usePermissions(
    PERMISSIONS.PAYROLL_MANAGE,
  );

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch active employees and active configs in parallel
      const [empRes, configRes] = await Promise.all([
        userService.getAll({ limit: 100, isActive: true }),
        payrollService.getSalaryConfigs({ limit: 100 }),
      ]);

      const configsMap = new Map<string, SalaryConfig>();
      configRes.data.forEach((c) => {
        const empId =
          typeof c.employeeId === "object"
            ? (c.employeeId as any)?._id
            : c.employeeId;
        if (empId) {
          const existing = configsMap.get(empId.toString());
          // Map the config, preferring the active one if multiple exist
          if (!existing || (!existing.isActive && c.isActive)) {
            configsMap.set(empId.toString(), c);
          }
        }
      });

      const merged: any[] = empRes.users.map((u) => {
        const config = configsMap.get(u._id.toString());
        if (config) {
          return {
            ...config,
            employeeId: u,
          };
        } else {
          return {
            _id: `empty-${u._id}`,
            employeeId: u,
            monthlyCTC: 0,
            effectiveFrom: "",
            isActive: false,
            items: [],
            isVirtual: true,
          };
        }
      });

      // Sort by employee name alphabetically
      merged.sort((a, b) => {
        const nameA =
          `${(a.employeeId as any).personalInfo?.firstName || ""} ${(a.employeeId as any).personalInfo?.lastName || ""}`.toLowerCase();
        const nameB =
          `${(b.employeeId as any).personalInfo?.firstName || ""} ${(b.employeeId as any).personalInfo?.lastName || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setAllMergedConfigs(merged);
    } catch (error) {
      console.error("Failed to fetch salary configs:", error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Client-Side filter based on statusFilter and searchQuery
  const filteredConfigs = useMemo(() => {
    return allMergedConfigs.filter((item) => {
      // 1. Status Filter
      if (statusFilter === "active") {
        if ((item as any).isVirtual || item.isActive !== true) return false;
      } else if (statusFilter === "inactive") {
        if ((item as any).isVirtual || item.isActive !== false) return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const emp = item.employeeId as any;
        const firstName = emp?.personalInfo?.firstName || "";
        const lastName = emp?.personalInfo?.lastName || "";
        const name = `${firstName} ${lastName}`.toLowerCase();
        const email = (emp?.personalInfo?.email || "").toLowerCase();
        const dept = (emp?.employment?.department || "").toLowerCase();
        const desg = (emp?.employment?.designation || "").toLowerCase();
        const empCode = (emp?.employeeId || "").toLowerCase();

        return (
          name.includes(query) ||
          email.includes(query) ||
          dept.includes(query) ||
          desg.includes(query) ||
          empCode.includes(query)
        );
      }

      return true;
    });
  }, [allMergedConfigs, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredConfigs.length / limit) || 1;
  const activePage = Math.min(page, totalPages);

  const displayConfigs = useMemo(() => {
    return filteredConfigs.slice((activePage - 1) * limit, activePage * limit);
  }, [filteredConfigs, activePage, limit]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleAdd = (employeeId?: string) => {
    setCurrentConfig({ isActive: true, employeeId: employeeId as any });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (config: SalaryConfig) => {
    setCurrentConfig(config);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsFormLoading(true);
      setFormError(null);
      if (currentConfig?._id) {
        // The employee is immutable for an existing configuration. The update
        // validator intentionally does not accept employeeId, so do not send it.
        await payrollService.updateSalaryConfig(currentConfig._id, {
          monthlyCTC: data.monthlyCTC,
          effectiveFrom: data.effectiveFrom,
          isActive: data.isActive,
          items: data.items?.filter((item: any) => item.masterId),
        });
      } else {
        await payrollService.createSalaryConfig({ ...data, items: data.items?.filter((item: any) => item.masterId) });
      }
      setIsModalOpen(false);
      fetchConfigs();
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to save configuration",
      );
      setFormError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDelete = async (config: SalaryConfig) => {
    const confirmed = await confirm({
      title: "Delete Configuration",
      message: `Are you sure you want to delete this salary configuration?`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (confirmed) {
      try {
        await payrollService.deleteSalaryConfig(config._id);
        fetchConfigs();
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to delete configuration",
        );
        alert(errorMessage);
      }
    }
  };

  const columns = [
    {
      _id: "employee",
      label: "Employee",
      format: (_: unknown, row: SalaryConfig) => {
        const emp = typeof row.employeeId === "object" ? row.employeeId : null;
        const name = emp
          ? `${(emp as any).personalInfo?.firstName} ${(emp as any).personalInfo?.lastName}`
          : "Unknown User";
        const empCode = emp ? (emp as any).employeeId : null;
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-foreground text-base tracking-tight">
                {name}
              </div>
              {empCode && (
                <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50 w-fit mt-1">
                  ID: {empCode}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      _id: "monthlyCTC",
      label: "Monthly (CTC)",
      format: (val: any, row: any) => {
        if (row.isVirtual) {
          return <span className="text-foreground-tertiary font-bold">—</span>;
        }
        const displayVal = val || row.basicSalary || 0;
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-success" />
            <span className="font-black text-foreground text-lg">
              ₹{displayVal.toLocaleString()}
            </span>
          </div>
        );
      },
    },
    {
      _id: "effectiveFrom",
      label: "Effective From",
      format: (val: any, row: any) => {
        if (row.isVirtual || !val) {
          return <span className="text-foreground-tertiary font-bold">—</span>;
        }
        return (
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">
              {format(new Date(val), "dd MMM yyyy")}
            </span>
          </div>
        );
      },
    },
    {
      _id: "components",
      label: "Components",
      format: (_: unknown, row: SalaryConfig) => {
        if ((row as any).isVirtual || !row.items || row.items.length === 0) {
          return (
            <span className="text-foreground-tertiary font-bold text-xs uppercase tracking-wider">
              —
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1.5 max-w-xs">
            {row.items
              .filter((i) => i.isActive)
              .map((item, idx) => {
                const master = item.masterId as AllowanceDeductionMaster;
                return (
                  <span
                    key={idx}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border",
                      (master?.type as string) === "ALLOWANCE"
                        ? "bg-success/5 text-success border-success/10"
                        : "bg-error/5 text-error border-error/10",
                    )}
                  >
                    {master?.code || "???"}:{" "}
                    {item.overrideValue != null
                      ? `₹${item.overrideValue}`
                      : "Default"}
                  </span>
                );
              })}
          </div>
        );
      },
    },
    {
      _id: "status",
      label: "Status",
      format: (val: any, row: any) => {
        if (row.isVirtual) {
          return (
            <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border bg-amber/5 text-amber-600 border-amber/10">
              Unset
            </span>
          );
        }
        return (
          <span
            className={cn(
              "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
              val
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-foreground-tertiary border-border",
            )}
          >
            {val ? "Active" : "Archived"}
          </span>
        );
      },
    },
    {
      _id: "actions",
      label: "Actions",
      align: "right" as const,
      format: (_: unknown, row: any) => {
        if (row.isVirtual) {
          const empId =
            typeof row.employeeId === "object"
              ? row.employeeId._id
              : row.employeeId;
          return (
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAdd(empId)}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 h-8 rounded-xl border border-primary/20 hover:bg-primary/5 text-primary"
              >
                Set Salary
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleEdit(row)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
              title="Edit Configuration"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-error/10 hover:text-error text-foreground-secondary transition-all"
              title="Delete Configuration"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const displayColumns = canManage
    ? columns
    : columns.filter((col) => col._id !== "actions");

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">
            Accessing Salary Matrix...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">
            Salary Configurations
          </h1>
          <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Manage dynamic salary structures and component overrides for
            employees.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
        <div className="flex-1 w-full text-foreground-tertiary font-bold text-sm px-4 flex items-center gap-3">
          <History className="w-5 h-5 opacity-40 text-primary" />
          Salary Structure Records
        </div>

        <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary pointer-events-none" />
            <input
              type="text"
              className="w-full h-[42px] pl-12 pr-4 bg-muted/40 border border-border/40 focus:border-primary/50 focus:outline-none rounded-2xl text-xs font-semibold placeholder-foreground-tertiary transition-all"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <FilterDropdown
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full lg:w-[200px]"
            options={[
              { value: "all", label: "All Configs" },
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Archived Only" },
            ]}
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
              Syncing Structural Matrix...
            </p>
          </div>
        )}
        <Table
          columns={displayColumns}
          rows={displayConfigs}
          className="border-none"
          emptyState={
            <EmptyState
              title="Negative Data Flux"
              description="No salary configurations detected in the current sector."
              className="py-24"
              icon={
                <History className="w-12 h-12 text-foreground-tertiary/20" />
              }
            />
          }
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 pb-8">
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
            Page <span className="text-primary">{page}</span> of{" "}
            {totalPages || 1}
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

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          currentConfig?._id
            ? "Edit Salary Configuration"
            : "New Salary Configuration"
        }
        maxWidth="xl"
      >
        <SalaryConfigForm
          initialValues={currentConfig || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isFormLoading}
          error={formError}
        />
      </Modal>

      <Modal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Set Everyone's Salary"
        maxWidth="xl"
      >
        <BulkSalarySetupModal
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => fetchConfigs()}
        />
      </Modal>

      {ConfirmationDialog}
    </div>
  );
};

export default SalaryConfigList;


