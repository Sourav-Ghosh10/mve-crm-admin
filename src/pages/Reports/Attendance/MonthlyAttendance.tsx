import React, { useState, useCallback, useEffect } from "react";
import { Download, ArrowLeft, ArrowRight } from "lucide-react";
import { format, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { attendanceService } from "../../../services/attendanceService";
import type { Attendance } from "../../../types/attendance.types";
import Button from "../../../components/common/Button";
// import GlobalLoader from "../../../components/common/LoadingSpinner/GlobalLoader";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { reportService } from "../../../services/reportService";
import systemSettingsService from "../../../services/systemSettingsService";
import { getPayrollCycleInterval } from "../../../utils/payrollCycleUtils";

const MonthlyAttendanceReport: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [records, setRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [cycleSettings, setCycleSettings] = useState({ startDay: 1, endDay: 31 });

    useEffect(() => {
        const fetchCycle = async () => {
            try {
                const res = await systemSettingsService.getSettingByKey("payroll_cycle_settings").catch(() => null);
                if (res && res.value) {
                    setCycleSettings({
                        startDay: Number(res.value.startDay || 1),
                        endDay: Number(res.value.endDay || 31)
                    });
                }
            } catch (err) {
                console.error("Failed to fetch payroll settings", err);
            }
        };
        fetchCycle();
    }, []);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const interval = getPayrollCycleInterval(currentMonth, cycleSettings);
            const start = interval.startDate.toISOString();
            const end = interval.endDate.toISOString();

            const resp = await attendanceService.getAll({
                startDate: start,
                endDate: end,
                limit: 1000 // Get all for the month
            });
            setRecords(resp.attendances || []);
        } catch (err) {
            console.error("Failed to fetch monthly attendance:", err);
        } finally {
            setLoading(false);
        }
    }, [currentMonth, cycleSettings]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleExport = async (format: 'pdf' | 'csv') => {
        try {
            const interval = getPayrollCycleInterval(currentMonth, cycleSettings);
            await reportService.generateReport({
                type: 'attendance',
                format,
                startDate: interval.startDate.toISOString().split('T')[0],
                endDate: interval.endDate.toISOString().split('T')[0]
            });
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    // Grouping records by employee and date
    const employeeData = React.useMemo(() => {
        const map = new Map<string, { name: string, empId: string, days: Record<string, string> }>();

        records.forEach(rec => {
            const empId = rec.employeeId?._id || "unknown";
            const firstName = rec.employeeId?.personalInfo?.firstName || "";
            const lastName = rec.employeeId?.personalInfo?.lastName || "";
            const name = rec.name || `${firstName} ${lastName}`.trim();
            const employeeId = rec.employeeId?._id || "N/A";
            const dateStr = format(new Date(rec.date), "yyyy-MM-dd");

            if (!map.has(empId)) {
                map.set(empId, { name, empId: employeeId, days: {} });
            }
            map.get(empId)!.days[dateStr] = rec.status;
        });

        return Array.from(map.values());
    }, [records]);

    const daysInMonth = React.useMemo(() => {
        const interval = getPayrollCycleInterval(currentMonth, cycleSettings);
        return eachDayOfInterval({
            start: interval.startDate,
            end: interval.endDate
        });
    }, [currentMonth, cycleSettings]);

    const getStatusIcon = (status?: string) => {
        if (!status) return <span className="text-muted-foreground/20 text-[8px]">•</span>;
        switch (status.toLowerCase()) {
            case 'present': return <div className="w-2 h-2 rounded-full bg-success opacity-80" />;
            case 'absent': return <div className="w-2 h-2 rounded-full bg-error opacity-80" />;
            case 'late': return <div className="w-2 h-2 rounded-full bg-warning opacity-80" />;
            case 'half-day': return <div className="w-2 h-2 rounded-full bg-blue-500 opacity-80" />;
            case 'on-leave': return <div className="w-2 h-2 rounded-full bg-purple-500 opacity-80" />;
            case 'holiday': return <div className="w-2 h-2 rounded-full bg-amber-500 opacity-80" />;
            case 'weekend': return <div className="w-1 h-1 rounded-full bg-slate-300 opacity-50" />;
            default: return <div className="w-2 h-2 rounded-full bg-slate-400 opacity-50" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/reports" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Reports</Link>
                        <span className="text-foreground-tertiary text-xs">/</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Monthly Summary</span>
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Organization Attendance Matrix</h1>
                    <p className="text-xs font-bold text-foreground-tertiary mt-1 uppercase tracking-wider">{format(currentMonth, "MMMM yyyy")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-surface border border-border/40 rounded-xl p-1 mr-4">
                        <button onClick={handlePrevMonth} className="p-1 px-2 hover:bg-muted rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                        <div className="px-4 font-black text-xs flex items-center">{format(currentMonth, "MMM yyyy")}</div>
                        <button onClick={handleNextMonth} className="p-1 px-2 hover:bg-muted rounded-lg transition-colors"><ArrowRight className="w-4 h-4" /></button>
                    </div>
                    <Button
                        variant="outline"
                        startIcon={<Download className="w-4 h-4" />}
                        className="rounded-xl"
                        onClick={() => handleExport('pdf')}
                    >
                        Export Matrix
                    </Button>
                </div>
            </div>

            <div className="bg-surface rounded-3xl border border-border/40 shadow-2xl shadow-black/[0.02] overflow-hidden relative">
                {loading && <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center font-black text-primary">SYNCING MATRIX...</div>}

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 bg-muted/5">
                                <th className="sticky left-0 z-20 bg-surface p-4 text-[10px] font-black uppercase tracking-widest text-foreground-tertiary border-r border-border/30 min-w-[200px]">Employee Details</th>
                                {daysInMonth.map(day => (
                                    <th key={day.toISOString()} className={cn(
                                        "p-2 text-center min-w-[32px] border-r border-border/10",
                                        (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/30"
                                    )}>
                                        <div className="text-[8px] font-black text-foreground-tertiary uppercase">{format(day, "eee")}</div>
                                        <div className="text-[10px] font-black text-foreground">{format(day, "d")}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {employeeData.map(emp => (
                                <tr key={emp.empId} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                    <td className="sticky left-0 z-20 bg-surface p-4 border-r border-border/30">
                                        <div className="font-bold text-xs text-foreground truncate">{emp.name}</div>
                                        <div className="text-[9px] font-black text-foreground-tertiary flex items-center gap-1 uppercase tracking-tight">
                                            <span className="opacity-50 text-[8px]">ID:</span> {emp.empId}
                                        </div>
                                    </td>
                                    {daysInMonth.map(day => {
                                        const dateKey = format(day, "yyyy-MM-dd");
                                        const status = emp.days[dateKey];
                                        return (
                                            <td key={dateKey} className={cn(
                                                "p-0 text-center border-r border-border/10",
                                                (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/10"
                                            )}>
                                                <div className="flex items-center justify-center h-10" title={`${emp.name} - ${dateKey}: ${status || 'No record'}`}>
                                                    {getStatusIcon(status)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-wrap gap-6 px-4 py-4 bg-surface rounded-2xl border border-border/30 border-dashed">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary">
                    <div className="w-2.5 h-2.5 rounded-full bg-success" /> Present
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary">
                    <div className="w-2.5 h-2.5 rounded-full bg-error" /> Absent
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary">
                    <div className="w-2.5 h-2.5 rounded-full bg-warning" /> Late
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Half Day
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Leave
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-foreground-tertiary">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Holiday
                </div>
            </div>
        </div>
    );
};

export default MonthlyAttendanceReport;
