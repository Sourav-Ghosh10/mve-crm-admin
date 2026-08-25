import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Archive,
  Calculator,
  Percent,
  Banknote,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import payrollService, { type AllowanceDeductionMaster } from "../../../services/payrollService";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useDebounce } from "../../../hooks/useDebounce";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import AllowanceDeductionForm from "./AllowanceDeductionForm";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";

const AllowanceDeductionList: React.FC = () => {
  const [masters, setMasters] = useState<AllowanceDeductionMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hasData, setHasData] = useState(true);
  const [error, setError] = useState<string | string[] | null>(null);

  const { confirm, ConfirmationDialog } = useConfirmation();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMaster, setCurrentMaster] = useState<Partial<AllowanceDeductionMaster> | null>(null);

  const { hasPermission: canManage } = usePermissions(PERMISSIONS.PAYROLL_MANAGE);

  const fetchMasters = useCallback(
    async (currentPage: number) => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit,
          search: debouncedSearchTerm.trim() || undefined,
          isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
        };
        const response = await payrollService.getMasters(params);
        setMasters(response.data);
        setTotalPages(response.pagination.pages);

        const hasActiveFilters = debouncedSearchTerm.trim() || statusFilter !== "all" || typeFilter !== "all";
        if (!hasActiveFilters && response.pagination.total === 0) {
          setHasData(false);
        } else {
          setHasData(true);
        }
      } catch (error) {
        console.error("Failed to fetch payroll masters:", error);
      } finally {
        setLoading(false);
        setIsInitialLoading(false);
      }
    },
    [debouncedSearchTerm, statusFilter, typeFilter, limit]
  );

  useEffect(() => {
    fetchMasters(1);
    setPage(1);
  }, [fetchMasters]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchMasters(newPage);
  };

  const handleToggleStatus = async (master: AllowanceDeductionMaster) => {
    const action = master.isActive ? "deactivate" : "activate";

    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Master`,
      message: `Are you sure you want to ${action} "${master.name}"?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
      variant: master.isActive ? "danger" : "info",
    });

    if (confirmed) {
      try {
        await payrollService.toggleMasterStatus(master._id, !master.isActive);
        fetchMasters(page);
      } catch (error) {
        const errorMessage = getErrorMessage(error, `Failed to ${action} master`);
        alert(errorMessage);
      }
    }
  };

  const handleDelete = async (master: AllowanceDeductionMaster) => {
    const confirmed = await confirm({
      title: "Delete Master",
      message: `Are you sure you want to delete "${master.name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (confirmed) {
      try {
        await payrollService.deleteMaster(master._id);
        fetchMasters(page);
      } catch (error) {
        const errorMessage = getErrorMessage(error, "Failed to delete master");
        alert(errorMessage);
      }
    }
  };

  const handleEdit = (master: AllowanceDeductionMaster) => {
    setCurrentMaster(master);
    setError(null);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setCurrentMaster({ isActive: true, type: "ALLOWANCE" as any, calculationType: "FIXED" as any });
    setError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      setError(null);
      if (currentMaster?._id) {
        await payrollService.updateMaster(currentMaster._id, data);
      } else {
        await payrollService.createMaster(data);
      }
      setIsModalOpen(false);
      fetchMasters(page);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to save allowance/deduction master");
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      _id: "name",
      label: "Master Details",
      format: (_: unknown, row: AllowanceDeductionMaster) => (
        <div className="flex items-center gap-4 py-1">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all",
            (row.type as string) === "ALLOWANCE" 
              ? "bg-success/10 text-success border-success/20 shadow-success/5" 
              : "bg-error/10 text-error border-error/20 shadow-error/5"
          )}>
            {row.calculationType === "FIXED" ? <Banknote className="w-6 h-6" /> : <Percent className="w-6 h-6" />}
          </div>
          <div>
            <div className="font-black text-foreground text-base tracking-tight">{row.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border",
                (row.type as string) === "ALLOWANCE" ? "bg-success/5 text-success border-success/10" : "bg-error/5 text-error border-error/10"
              )}>
                {row.type as string}
              </span>
              <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50">
                {row.code}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      _id: "value",
      label: "Value",
      format: (_: unknown, row: AllowanceDeductionMaster) => (
        <div className="flex flex-col">
          <span className="font-black text-foreground">
            {row.calculationType === "PERCENTAGE" ? `${row.value}%` : `₹${row.value.toLocaleString()}`}
          </span>
          <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-tighter">
            {row.calculationType === "PERCENTAGE" 
              ? `of ${row.percentageOf === 'BASIC' ? 'Basic' : row.percentageOf === 'GROSS' ? 'Gross' : 'CTC'}` 
              : "Fixed Amount"}
          </span>
        </div>
      ),
    },
    {
      _id: "isTaxable",
      label: "Taxable",
      format: (val: any) => (
        <span className={cn(
          "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
          val ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-foreground-tertiary border-border"
        )}>
          {val ? "Yes" : "No"}
        </span>
      ),
    },
    {
      _id: "status",
      label: "Status",
      format: (_: unknown, row: AllowanceDeductionMaster) => (
        <span className={cn(
          "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
          row.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-foreground-tertiary border-border"
        )}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      _id: "actions",
      label: "Actions",
      align: "right" as const,
      format: (_: unknown, row: AllowanceDeductionMaster) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
            title="Edit Master"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
              row.isActive ? "hover:bg-warning/10 hover:text-warning" : "hover:bg-success/10 hover:text-success",
              "text-foreground-secondary"
            )}
            title={row.isActive ? "Deactivate" : "Activate"}
          >
            {row.isActive ? <Archive className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-error/10 hover:text-error text-foreground-secondary transition-all"
            title="Delete Master"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const displayColumns = canManage ? columns : columns.filter((col) => col._id !== "actions");

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Accessing Payroll Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Allowance & Deductions</h1>
          <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Configure core salary components, benefits, and statutory deductions.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleAdd} startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}>
            Add Master
          </Button>
        )}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            searchKey="payroll-masters"
            placeholder="Search by name or code..."
            disabled={!hasData}
          />
        </div>

        <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
          <FilterDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full lg:w-[160px]"
            options={[
              { value: "all", label: "All Types" },
              { value: "ALLOWANCE", label: "Allowances" },
              { value: "DEDUCTION", label: "Deductions" },
            ]}
          />
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full lg:w-[160px]"
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
            ]}
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl sm:rounded-xl border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing Structural Matrix...</p>
          </div>
        )}
        <Table
          columns={displayColumns}
          rows={masters}
          className="border-none"
          emptyState={
            <EmptyState
              title="Negative Data Flux"
              description={searchTerm ? `The component "${searchTerm}" cannot be detected.` : "Initialize your first salary component to expand the payroll matrix."}
              className="py-24"
              icon={<Calculator className="w-12 h-12 text-foreground-tertiary/20" />}
            />
          }
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 pb-8">
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 rounded-2xl bg-muted/50 border border-border/30 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
            Page <span className="text-primary">{page}</span> of {totalPages || 1}
          </div>
        </div>

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentMaster?._id ? "Edit Component" : "Add Salary Component"}
        maxWidth="md"
      >
        <AllowanceDeductionForm
          initialValues={currentMaster || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={formLoading}
          error={error}
        />
      </Modal>
      {ConfirmationDialog}
    </div>
  );
};

export default AllowanceDeductionList;
