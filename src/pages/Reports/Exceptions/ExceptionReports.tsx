import React, { useState } from "react";
import { Download, AlertCircle, Calendar } from "lucide-react";
import { reportService } from "../../../services/reportService";
import Button from "../../../components/common/Button";
import { Link } from "react-router-dom";

const ExceptionReports: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const handleDownload = async (format: 'pdf' | 'csv') => {
        try {
            setLoading(true);
            await reportService.generateReport({
                type: 'exception',
                format,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Exceptions</span>
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Attendance Exceptions</h1>
                <p className="text-sm font-bold text-foreground-tertiary mt-2 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Late Arrivals, Early Exits, and Missed Punches
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface rounded-[2.5rem] border border-border/40 p-8 shadow-2xl shadow-black/[0.02]">
                    <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        Select Date Coverage
                    </h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary ml-2">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full h-14 bg-muted/30 border border-border/30 rounded-2xl px-5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary ml-2">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full h-14 bg-muted/30 border border-border/30 rounded-2xl px-5 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/10 flex flex-col gap-3">
                            <Button
                                onClick={() => handleDownload('pdf')}
                                disabled={loading}
                                className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 group"
                            >
                                {loading ? "Generating Engine..." : "Download PDF Report"}
                                <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleDownload('csv')}
                                disabled={loading}
                                className="h-14 rounded-2xl border-border/40 font-black uppercase tracking-widest text-foreground-tertiary hover:bg-muted/50"
                            >
                                Export Raw CSV Data
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                            <AlertCircle className="w-64 h-64 text-primary" />
                        </div>
                        <h4 className="text-xl font-black text-primary mb-4">Audit Transparency</h4>
                        <p className="text-sm font-medium text-primary/70 leading-relaxed italic">
                            "Exception reports help identify systemic issues in workforce punctuality and shift adherence. Use this data to provide constructive feedback and optimize schedule compliance."
                        </p>
                        <div className="mt-8 flex gap-4">
                            <div className="h-12 px-6 rounded-xl bg-white/50 backdrop-blur-sm border border-primary/20 flex items-center text-[10px] font-black text-primary uppercase tracking-widest">
                                Real-time sync
                            </div>
                            <div className="h-12 px-6 rounded-xl bg-white/50 backdrop-blur-sm border border-primary/20 flex items-center text-[10px] font-black text-primary uppercase tracking-widest">
                                Regulatory Ready
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExceptionReports;
