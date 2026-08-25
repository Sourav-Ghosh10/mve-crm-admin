import React, { useState, useEffect } from "react";
import { Search, Save, Calendar, User as UserIcon, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "../../../components/common/Button";

import { cn } from "../../../lib/utils";
import payrollService from "../../../services/payrollService";
import { userService } from "../../../services/userService";

interface BulkRow {
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  monthlyCTC: number;
  effectiveFrom: string;
  hasExisting: boolean;
  configId?: string;
  isModified: boolean;
}

interface BulkSalarySetupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BulkSalarySetupModal: React.FC<BulkSalarySetupModalProps> = ({ onClose, onSuccess }) => {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [masters, setMasters] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all active employees, active salary configs, and payroll masters
        const [empRes, configRes, masterRes] = await Promise.all([
          userService.getAll({ limit: 100, isActive: true }),
          payrollService.getSalaryConfigs({ limit: 100, isActive: true }),
          payrollService.getMasters({ isActive: true, limit: 100 })
        ]);

        setMasters(masterRes.data);

        const configsMap = new Map<string, any>();
        configRes.data.forEach(c => {
          const empId = typeof c.employeeId === 'object' ? (c.employeeId as any)?._id : c.employeeId;
          if (empId) {
            configsMap.set(empId.toString(), c);
          }
        });

        // Set default effective date to the first of the current month
        const today = new Date();
        const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];

        const combined: BulkRow[] = empRes.users.map(u => {
          const existingConfig = configsMap.get(u._id.toString());
          return {
            employeeId: u._id,
            name: `${u.personalInfo.firstName} ${u.personalInfo.lastName}`,
            email: u.personalInfo.email,
            department: u.employment?.department,
            designation: u.employment?.designation,
            monthlyCTC: existingConfig ? existingConfig.monthlyCTC : 0,
            effectiveFrom: existingConfig 
              ? new Date(existingConfig.effectiveFrom).toISOString().split("T")[0] 
              : firstOfCurrentMonth,
            hasExisting: !!existingConfig,
            configId: existingConfig?._id,
            isModified: false
          };
        });

        // Sort by name
        combined.sort((a, b) => a.name.localeCompare(b.name));
        setRows(combined);
      } catch (err) {
        console.error("Failed to load bulk setup data:", err);
        setError("Unable to retrieve salary configuration matrix. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCTCChange = (index: number, val: string) => {
    const num = val === "" ? 0 : parseFloat(val);
    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        monthlyCTC: isNaN(num) ? 0 : num,
        isModified: true
      };
      return updated;
    });
  };

  const handleDateChange = (index: number, val: string) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        effectiveFrom: val,
        isModified: true
      };
      return updated;
    });
  };

  const handleSaveAll = async () => {
    const modified = rows.filter(r => r.isModified && r.monthlyCTC >= 0);
    if (modified.length === 0) {
      onClose();
      return;
    }

    try {
      setSaving(true);
      setError(null);


      // Generate default master configuration items list for newly created structures
      const defaultItems = masters.map(m => ({
        masterId: m._id,
        overrideValue: null,
        isActive: false
      }));

      for (let i = 0; i < modified.length; i++) {
        const row = modified[i];
        const payload: any = {
          monthlyCTC: row.monthlyCTC,
          effectiveFrom: new Date(row.effectiveFrom),
          isActive: true
        };

        if (row.hasExisting && row.configId) {
          // Update existing
          await payrollService.updateSalaryConfig(row.configId, payload);
        } else {
          // Create new config
          await payrollService.createSalaryConfig({
            employeeId: row.employeeId,
            items: defaultItems,
            ...payload
          });
        }


      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to save some salary configs:", err);
      setError("An error occurred while saving the salary configurations. Please verify parameters and try again.");
    } finally {
      setSaving(false);

    }
  };

  const filteredRows = rows.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.email.toLowerCase().includes(search.toLowerCase()) || 
    r.department?.toLowerCase().includes(search.toLowerCase())
  );

  const modifiedCount = rows.filter(r => r.isModified).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground-tertiary">Compiling Salary Matrix...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20 shadow-xl shadow-success/10">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Salaries Synced Successfully</h3>
          <p className="text-xs text-foreground-tertiary mt-2 font-medium">Reloading structural configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3 text-error">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs font-bold leading-relaxed">{error}</div>
        </div>
      )}

      {/* Roster Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
          <input
            type="text"
            className="w-full h-11 pl-12 pr-4 bg-muted/40 border border-border/40 rounded-2xl text-sm placeholder-foreground-tertiary focus:outline-none focus:border-primary/50 transition-all font-semibold"
            placeholder="Search employee by name, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {modifiedCount > 0 && (
          <div className="text-xs font-bold text-primary uppercase bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl animate-in slide-in-from-right-4">
            {modifiedCount} Pending Changes
          </div>
        )}
      </div>

      {/* Salary Input Matrix */}
      <div className="border border-border/40 rounded-2xl overflow-hidden bg-surface max-h-[60vh] overflow-y-auto custom-scrollbar shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border/40 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
              <th className="px-6 py-4">Employee Details</th>
              <th className="px-6 py-4">Config Status</th>
              <th className="px-6 py-4">Monthly CTC (₹)</th>
              <th className="px-6 py-4">Effective Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-foreground-tertiary uppercase">
                  No matching employees found in current sector
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                // Find actual index in state array to write changes back correctly
                const actualIndex = rows.findIndex(r => r.employeeId === row.employeeId);

                return (
                  <tr 
                    key={row.employeeId} 
                    className={cn(
                      "hover:bg-muted/10 transition-colors",
                      row.isModified && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-foreground tracking-tight">{row.name}</div>
                          <div className="text-[10px] text-foreground-tertiary mt-0.5 font-medium">
                            {row.designation || "No Designation"} • {row.department || "No Department"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                        row.hasExisting 
                          ? "bg-success/5 text-success border-success/10" 
                          : "bg-amber/5 text-amber-600 border-amber/10"
                      )}>
                        {row.hasExisting ? "Active Structure" : "Not Configured"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-40">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
                        <input
                          type="number"
                          className="w-full h-10 pl-10 pr-3 bg-muted/20 border border-border/40 focus:border-primary/40 rounded-xl text-sm font-black text-foreground outline-none transition-all"
                          placeholder="e.g. 50000"
                          value={row.monthlyCTC || ""}
                          onChange={(e) => handleCTCChange(actualIndex, e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-44">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary pointer-events-none" />
                        <input
                          type="date"
                          className="w-full h-10 pl-10 pr-3 bg-muted/20 border border-border/40 focus:border-primary/40 rounded-xl text-sm font-bold text-foreground outline-none transition-all"
                          value={row.effectiveFrom}
                          onChange={(e) => handleDateChange(actualIndex, e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="text-xs text-foreground-tertiary font-bold">
          {rows.length} Total Employees • Showing {filteredRows.length}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAll} 
            isLoading={saving} 

            startIcon={<Save className="w-4 h-4" />}
            disabled={modifiedCount === 0 || saving}
          >
            Save All Salaries
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkSalarySetupModal;
