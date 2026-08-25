import React, { useState, useEffect } from "react";
import { Download, Briefcase, Building2, Users } from "lucide-react";
import { reportService } from "../../../services/reportService";
import { departmentService } from "../../../services/departmentService";
import type { Department } from "../../../types/organization.types";
import Button from "../../../components/common/Button";
import { Link } from "react-router-dom";

const OffDayWorkReport: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDept, setSelectedDept] = useState("all");

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

    const handleDownload = async (format: 'pdf' | 'csv') => {
        try {
            setLoading(true);
            await reportService.generateReport({
                type: 'offday_work',
                format,
                department: selectedDept === "all" ? undefined : selectedDept
            });
        } catch (err) {
            console.error("Download failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Link to="/reports" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Reports Hub</Link>
                    <span className="text-foreground-tertiary text-xs">/</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Week-off Work</span>
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Worked on Off-day</h1>
                <p className="text-sm font-bold text-foreground-tertiary mt-2 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Overtime records for weekends and holidays
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface rounded-[2.5rem] border border-border/40 p-8 shadow-2xl shadow-black/[0.02]">
                    <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        Target Department
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary ml-2">Department Selection</label>
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="w-full h-14 bg-muted/30 border border-border/30 rounded-2xl px-5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none shadow-sm"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 border-t border-border/10 flex flex-col gap-3">
                            <Button
                                onClick={() => handleDownload('csv')}
                                disabled={loading}
                                className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 group"
                            >
                                {loading ? "Extracting Data..." : "Export CSV for Payroll"}
                                <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleDownload('pdf')}
                                disabled={loading}
                                className="h-14 rounded-2xl border-border/40 font-black uppercase tracking-widest text-foreground-tertiary hover:bg-muted/50"
                            >
                                Download PDF Document
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    <div className="p-8 bg-emerald-500/5 rounded-[3rem] border border-emerald-500/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                            <Briefcase className="w-64 h-64 text-emerald-600" />
                        </div>
                        <h4 className="text-xl font-black text-emerald-600 mb-4">Payroll Compliance</h4>
                        <p className="text-sm font-medium text-emerald-600/70 leading-relaxed italic">
                            "Tracking work on scheduled off-days is critical for accurate overtime compensation and labor law compliance. This report consolidates all verified weekend and holiday work sessions."
                        </p>
                        <div className="mt-8 flex gap-4">
                            <div className="h-12 px-6 rounded-xl bg-white/50 backdrop-blur-sm border border-emerald-500/20 flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                Payroll Ready
                            </div>
                            <div className="h-12 px-6 rounded-xl bg-white/50 backdrop-blur-sm border border-emerald-500/20 flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                Verified Logs
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OffDayWorkReport;
