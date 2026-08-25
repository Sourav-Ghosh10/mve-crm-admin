import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  User as UserIcon,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";
import payrollService from "../../../services/payrollService";
import type { Payslip, SalaryConfig } from "../../../services/payrollService";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { useConfirmation } from "../../../hooks/useConfirmation";
import Modal from "../../../components/common/Modal/Modal";
import GeneratePayslipForm from "./GeneratePayslipForm";
import PayslipDetailsView from "./PayslipDetailsView";
import FilterDropdown from "../../../components/common/Filter/FilterDropdown";
import Pagination from "../../../components/common/Pagination";
import { getErrorMessage } from "../../../utils/errorHandling";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../config/permissions";
import { userService } from "../../../services/userService";
import systemSettingsService from "../../../services/systemSettingsService";
import { getPayrollCycleInterval } from "../../../utils/payrollCycleUtils";
import { format } from "date-fns";

const PayslipList: React.FC = () => {
  const [allMergedPayslips, setAllMergedPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [cycleSettings, setCycleSettings] = useState({ startDay: 1, endDay: 31 });
  const [selectedGenerateEmployeeId, setSelectedGenerateEmployeeId] = useState<string | undefined>(undefined);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const { confirm, ConfirmationDialog } = useConfirmation();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | string[] | null>(null);

  const { hasPermission: canManage } = usePermissions(PERMISSIONS.PAYROLL_MANAGE);

  const fetchPayslips = useCallback(
    async () => {
      try {
        setLoading(true);
        // Fetch active employees, period payslips, and active configurations in parallel
        const [empRes, payslipsRes, configsRes] = await Promise.all([
          userService.getAll({ limit: 100, isActive: true }),
          payrollService.getPayslips({ limit: 100, month: selectedMonth, year: selectedYear }),
          payrollService.getSalaryConfigs({ limit: 100 })
        ]);

        const configsMap = new Map<string, SalaryConfig>();
        configsRes.data.forEach(c => {
          const empId = typeof c.employeeId === 'object' ? (c.employeeId as any)?._id : c.employeeId;
          if (empId && c.isActive) {
            configsMap.set(empId.toString(), c);
          }
        });

        const payslipsMap = new Map<string, Payslip>();
        payslipsRes.data.forEach(p => {
          const empId = typeof p.employeeId === 'object' ? (p.employeeId as any)?._id : p.employeeId;
          if (empId) {
            payslipsMap.set(empId.toString(), p);
          }
        });

        const merged: any[] = empRes.users.map(u => {
          const payslip = payslipsMap.get(u._id.toString());
          const hasSalaryConfig = configsMap.has(u._id.toString());
          
          if (payslip) {
            return {
              ...payslip,
              employeeId: u,
              hasSalaryConfig
            };
          } else {
            return {
              _id: `virtual-${u._id}`,
              employeeId: u,
              month: selectedMonth,
              year: selectedYear,
              grossEarnings: 0,
              netPay: 0,
              daysWorked: 0,
              totalDays: 0,
              lopDays: 0,
              status: "UNPREPARED",
              isVirtual: true,
              hasSalaryConfig
            };
          }
        });

        // Sort by employee name alphabetically
        merged.sort((a, b) => {
          const nameA = `${(a.employeeId as any).personalInfo?.firstName || ""} ${(a.employeeId as any).personalInfo?.lastName || ""}`.toLowerCase();
          const nameB = `${(b.employeeId as any).personalInfo?.firstName || ""} ${(b.employeeId as any).personalInfo?.lastName || ""}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setAllMergedPayslips(merged);
      } catch (error) {
        console.error("Failed to fetch payslips:", error);
      } finally {
        setLoading(false);
        setIsInitialLoading(false);
      }
    },
    [selectedMonth, selectedYear]
  );

  // Fetch Payroll Cycle Settings
  useEffect(() => {
    const fetchCycleSettings = async () => {
      try {
        const res = await systemSettingsService.getSettingByKey("payroll_cycle_settings").catch(() => null);
        if (res && res.value) {
          setCycleSettings({
            startDay: Number(res.value.startDay || 1),
            endDay: Number(res.value.endDay || 31)
          });
        }
      } catch (err) {
        console.error("Failed to fetch payroll cycle settings:", err);
      }
    };
    fetchCycleSettings();
  }, []);

  useEffect(() => {
    fetchPayslips();
    setPage(1);
  }, [fetchPayslips]);

  // Compute if the current date is after the cycle end date of the selected month/year
  const isAfterEndDay = useMemo(() => {
    if (!selectedMonth || !selectedYear) return false;
    const baseDate = new Date(selectedYear, selectedMonth - 1, 15);
    const interval = getPayrollCycleInterval(baseDate, cycleSettings);
    return new Date() > interval.endDate;
  }, [selectedMonth, selectedYear, cycleSettings]);

  // Check if there are any unprepared active employees remaining
  const hasUnprepared = useMemo(() => {
    return allMergedPayslips.some(item => item.isVirtual);
  }, [allMergedPayslips]);

  const hasDrafts = useMemo(() => {
    return allMergedPayslips.some(item => !item.isVirtual && item.status === 'DRAFT');
  }, [allMergedPayslips]);

  const isGenerateDisabled = !canManage || !isAfterEndDay || !hasUnprepared;

  // Client-Side filter based on statusFilter
  const filteredPayslips = useMemo(() => {
    return allMergedPayslips.filter(item => {
      if (statusFilter === "all") return true;
      if (statusFilter === "UNPREPARED") return item.isVirtual;
      return item.status === statusFilter;
    });
  }, [allMergedPayslips, statusFilter]);

  const totalPages = Math.ceil(filteredPayslips.length / limit) || 1;
  const activePage = Math.min(page, totalPages);
  
  const displayPayslips = useMemo(() => {
    return filteredPayslips.slice((activePage - 1) * limit, activePage * limit);
  }, [filteredPayslips, activePage, limit]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleMonthFilterChange = (val: string) => {
    setSelectedMonth(parseInt(val, 10));
    setPage(1);
  };

  const handleYearFilterChange = (val: string) => {
    setSelectedYear(parseInt(val, 10));
    setPage(1);
  };

  const handleGenerateClick = (employeeId?: string) => {
    setSelectedGenerateEmployeeId(employeeId);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleGenerateSubmit = async (data: any) => {
    try {
      setIsFormLoading(true);
      setFormError(null);
      await payrollService.generatePayslip(data);
      setIsModalOpen(false);
      fetchPayslips();
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to generate payslip");
      setFormError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    const unpreparedItems = allMergedPayslips.filter(item => item.isVirtual);
    if (unpreparedItems.length === 0) return;

    // Filter into generation-ready and skipped items
    const itemsToGenerate = unpreparedItems.filter(item => item.hasSalaryConfig);
    const skippedItems = unpreparedItems.filter(item => !item.hasSalaryConfig);
    const skippedNames = skippedItems.map(item => {
      const p = item.employeeId?.personalInfo;
      return p ? `${p.firstName} ${p.lastName}` : "Unknown";
    });

    if (itemsToGenerate.length === 0) {
      alert(
        `Bulk process halted. No active salary configurations detected for the remaining ${unpreparedItems.length} employees.\n\nPlease configure their salaries first.`
      );
      return;
    }

    const confirmMessage = skippedNames.length > 0
      ? `Generate salaries for the ${itemsToGenerate.length} prepared employees for ${selectedMonth}/${selectedYear}?\n\nNote: ${skippedNames.length} employees (${skippedNames.join(", ")}) will be skipped because they lack a salary configuration.`
      : `Are you sure you want to generate salaries/payslips for all ${itemsToGenerate.length} unprepared employees for ${selectedMonth}/${selectedYear}?`;

    const confirmed = await confirm({
      title: "Generate Bulk Salaries",
      message: confirmMessage,
      confirmLabel: "Generate All",
      variant: "success"
    });

    if (confirmed) {
      try {
        setIsBulkGenerating(true);
        let successCount = 0;
        let failCount = 0;

        for (const item of itemsToGenerate) {
          const empId = typeof item.employeeId === 'object' ? item.employeeId._id : item.employeeId;
          try {
            await payrollService.generatePayslip({
              employeeId: empId,
              month: selectedMonth,
              year: selectedYear
            });
            successCount++;
          } catch (err) {
            console.error(`Failed to generate payslip for ${empId}:`, err);
            failCount++;
          }
        }

        // Notify user with comprehensive results
        if (failCount === 0 && skippedNames.length === 0) {
          alert(`Successfully generated salaries for all ${successCount} employees!`);
        } else {
          let msg = `Successfully generated salaries for ${successCount} employees.`;
          if (failCount > 0) {
            msg += `\nFailed to generate for ${failCount} employees.`;
          }
          if (skippedNames.length > 0) {
            msg += `\nSkipped ${skippedNames.length} employees lacking active configurations: ${skippedNames.join(", ")}.`;
          }
          alert(msg);
        }

        fetchPayslips();
      } catch (error) {
        alert(getErrorMessage(error, "Failed to bulk generate salaries"));
      } finally {
        setIsBulkGenerating(false);
      }
    }
  };

  const handleUpdateStatus = async (payslip: Payslip, newStatus: string) => {
    const confirmed = await confirm({
      title: "Update Status",
      message: `Are you sure you want to ${newStatus.toLowerCase()} this payslip?`,
      confirmLabel: "Update",
      variant: newStatus === 'CANCELLED' ? 'danger' : 'success'
    });

    if (confirmed) {
      try {
        await payrollService.updatePayslipStatus(payslip._id, newStatus);
        fetchPayslips();
      } catch (error) {
        const errorMessage = getErrorMessage(error, "Failed to update status");
        alert(errorMessage);
      }
    }
  };

  const handleDownloadPayslip = async (row: any) => {
    try {
      setDownloadingIds((prev) => ({ ...prev, [row._id]: true }));
      const blob = await payrollService.downloadPayslipPDF(row._id);
      
      const emp = typeof row.employeeId === 'object' ? row.employeeId : null;
      const firstName = emp?.personalInfo?.firstName || 'Employee';
      const lastName = emp?.personalInfo?.lastName || '';
      const fullName = `${firstName}_${lastName}`.replace(/\s+/g, '_');
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = monthNames[row.month - 1] || "Month";
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${fullName}_${monthName}_${row.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download payslip:", error);
      alert("Failed to download payslip PDF. Please try again.");
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [row._id]: false }));
    }
  };

  const handlePublishAllPayslips = async () => {
    const confirmed = await confirm({
      title: "Generate & Publish Payslips",
      message: `Are you sure you want to publish all generated payslips for ${selectedMonth}/${selectedYear}? This will make them visible to all employees in their respective logins.`,
      confirmLabel: "Publish All",
      variant: "success"
    });

    if (confirmed) {
      try {
        setIsPublishing(true);
        await payrollService.publishPayslips(selectedMonth, selectedYear);
        alert("All payslips published successfully! Employees can now access them from their logins.");
        fetchPayslips();
      } catch (error) {
        const errMsg = getErrorMessage(error, "Failed to publish payslips");
        alert(errMsg);
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = {
        month: selectedMonth,
        year: selectedYear,
        ...(statusFilter !== "all" && { status: statusFilter }),
      };
      const blob = await payrollService.exportPayslipsExcel(params);
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = monthNames[selectedMonth - 1] || "Month";
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Monthly_Salary_${monthName}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert("Failed to export Excel file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      _id: "employee",
      label: "Employee",
      format: (_: unknown, row: any) => {
        const emp = typeof row.employeeId === 'object' ? row.employeeId : null;
        const name = emp ? `${(emp as any).personalInfo?.firstName} ${(emp as any).personalInfo?.lastName}` : "Unknown User";
        const empCode = emp ? (emp as any).employeeId : null;
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-sm">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-foreground text-base tracking-tight">
                {name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50">
                  {row.month}/{row.year}
                </span>
                {empCode && (
                  <span className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest bg-muted px-2 py-0.5 rounded-lg border border-border/50">
                    ID: {empCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      _id: "summary",
      label: "Earnings",
      format: (_: unknown, row: any) => {
        if (row.isVirtual) {
          return <span className="text-foreground-tertiary font-bold text-sm">—</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-foreground-tertiary uppercase">Gross</span>
              <span className="font-black text-foreground text-sm">₹{row.grossEarnings.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-foreground-tertiary uppercase">Net Pay</span>
              <span className="font-black text-success text-sm underline decoration-success/30 underline-offset-4">₹{row.netPay.toLocaleString()}</span>
            </div>
          </div>
        );
      },
    },
    {
      _id: "attendance",
      label: "Attendance",
      format: (_: unknown, row: any) => {
        if (row.isVirtual) {
          return <span className="text-foreground-tertiary font-bold text-sm">—</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-tighter">
              Days: {row.daysWorked} / {row.totalDays}
            </span>
            {row.lopDays > 0 && (
              <span className="text-[10px] font-bold text-error uppercase tracking-tighter">
                LOP: {row.lopDays} Days
              </span>
            )}
          </div>
        );
      },
    },
    {
      _id: "status",
      label: "Status",
      format: (val: any, row: any) => {
        if (row.isVirtual) {
          if (!row.hasSalaryConfig) {
            return (
              <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border flex items-center gap-2 w-fit bg-error/5 text-error border-error/10">
                <AlertCircle className="w-3 h-3 text-error animate-pulse" />
                No Salary Config
              </span>
            );
          }
          return (
            <span className="px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border flex items-center gap-2 w-fit bg-amber-500/5 text-amber-600 border-amber-500/10">
              <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />
              Unprepared
            </span>
          );
        }
        return (
          <span className={cn(
            "px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all flex items-center gap-2 w-fit",
            val === 'FINALIZED' ? "bg-success/10 text-success border-success/20" : 
            val === 'DRAFT' ? "bg-warning/10 text-warning border-warning/20" : 
            "bg-muted text-foreground-tertiary border-border"
          )}>
            {val === 'FINALIZED' ? <CheckCircle2 className="w-3 h-3" /> : 
             val === 'DRAFT' ? <Clock className="w-3 h-3" /> : 
             <AlertCircle className="w-3 h-3" />}
            {val}
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
          const empId = typeof row.employeeId === 'object' ? row.employeeId._id : row.employeeId;
          return (
            <div className="flex items-center justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleGenerateClick(empId)}
                disabled={!row.hasSalaryConfig || !isAfterEndDay}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 h-8 rounded-xl border transition-all",
                  (row.hasSalaryConfig && isAfterEndDay)
                    ? "border-primary/20 hover:bg-primary/5 text-primary cursor-pointer" 
                    : "border-border text-foreground-tertiary/40 bg-muted/20 cursor-not-allowed"
                )}
                title={!isAfterEndDay ? "Generation is locked for this period" : row.hasSalaryConfig ? "Generate salary for this employee" : "Please set a Salary Config for this employee first"}
              >
                Generate
              </Button>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleDownloadPayslip(row)}
              disabled={downloadingIds[row._id]}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm border border-primary/10",
                downloadingIds[row._id] 
                  ? "bg-primary/5 text-primary/40 cursor-wait" 
                  : "bg-primary/5 hover:bg-primary/20 text-primary hover:text-indigo-600 cursor-pointer"
              )}
              title="Generate Payslip"
            >
              {downloadingIds[row._id] ? (
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
            {canManage && (
              <>
                {row.status === 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus(row, 'FINALIZED')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-success/10 hover:text-success text-foreground-secondary transition-all"
                    title="Finalize Payslip"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedPayslip(row);
                    setIsDetailsModalOpen(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary text-foreground-secondary transition-all"
                  title="View Details"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const displayColumns = canManage ? columns : columns.filter((col) => col._id !== "actions");

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Accessing Remuneration Log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in mt-6 fade-in duration-700 max-w-7xl mx-auto px-4 lg:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter">Monthly Salary</h1>
          <p className="text-foreground-tertiary mt-2 flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Track, generate and manage monthly employee remuneration records.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {!isAfterEndDay && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[1.25rem] bg-amber-500/5 border border-amber-500/10 text-amber-600 text-xs font-black uppercase tracking-wider shadow-sm animate-in fade-in duration-500">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Generation unlocks after {format(getPayrollCycleInterval(new Date(selectedYear, selectedMonth - 1, 15), cycleSettings).endDate, "dd MMM yyyy")}</span>
              </div>
            )}
            <Button 
              onClick={handlePublishAllPayslips} 
              disabled={!hasDrafts || isPublishing}
              isLoading={isPublishing}
              variant="outline"
              startIcon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="border-primary/20 hover:bg-primary/5 text-primary"
            >
              Generate Payslip
            </Button>
            <Button 
              onClick={handleBulkGenerate} 
              disabled={isGenerateDisabled || isBulkGenerating}
              isLoading={isBulkGenerating}
              startIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              Generate Salary
            </Button>
            <Button 
              onClick={handleExportExcel} 
              disabled={isExporting || filteredPayslips.length === 0}
              isLoading={isExporting}
              variant="outline"
              startIcon={<FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="border-green-500/20 hover:bg-green-500/5 text-green-600"
            >
              Export Excel
            </Button>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-center p-4 rounded-[2rem] border border-border/50 bg-surface/50 backdrop-blur-md shadow-sm">
        <div className="flex-1 w-full text-foreground-tertiary font-bold text-sm px-4 flex items-center gap-3">
           <Receipt className="w-5 h-5 opacity-40 text-primary" />
           Historical Disbursement Matrix
        </div>

        <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
          <FilterDropdown
            value={String(selectedMonth)}
            onChange={handleMonthFilterChange}
            className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full sm:w-[150px]"
            options={[
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
            ]}
          />

          <FilterDropdown
            value={String(selectedYear)}
            onChange={handleYearFilterChange}
            className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full sm:w-[120px]"
            options={[
              { value: "2024", label: "2024" },
              { value: "2025", label: "2025" },
              { value: "2026", label: "2026" },
              { value: "2027", label: "2027" },
              { value: "2028", label: "2028" },
            ]}
          />

          <FilterDropdown
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="h-[42px] rounded-2xl border-border/50 font-black text-xs uppercase tracking-widest w-full sm:w-[180px]"
            options={[
              { value: "all", label: "All Status" },
              { value: "DRAFT", label: "Drafts Only" },
              { value: "FINALIZED", label: "Finalized Only" },
              { value: "CANCELLED", label: "Cancelled Only" },
              { value: "UNPREPARED", label: "Unprepared Only" },
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
          rows={displayPayslips}
          className="border-none"
          emptyState={
            <EmptyState
              title="Negative Remuneration Flux"
              description="No disbursement records found for the period."
              className="py-24"
              icon={<Clock className="w-12 h-12 text-foreground-tertiary/20" />}
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
        title="Generate Monthly Payslip"
        maxWidth="md"
      >
        <GeneratePayslipForm
          defaultEmployeeId={selectedGenerateEmployeeId}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
          onSubmit={handleGenerateSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isFormLoading}
          error={formError}
        />
      </Modal>

      {selectedPayslip && isDetailsModalOpen && (
        <PayslipDetailsView
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          payslip={selectedPayslip}
        />
      )}

      {ConfirmationDialog}
    </div>
  );
};

export default PayslipList;
