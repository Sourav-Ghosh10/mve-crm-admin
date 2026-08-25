import React, { useState, useCallback, useEffect } from "react";
import { Download, Calendar } from "lucide-react";
import { holidayService } from "../../../services/holidayService";
import type { Holiday } from "../../../types/organization.types";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import { SearchInput } from "../../../components/common/Search/SearchInput";
import Pagination from "../../../components/common/Pagination";
import { Link } from "react-router-dom";
import { reportService } from "../../../services/reportService";

const HolidayListReport: React.FC = () => {
    const [records, setRecords] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const resp = await holidayService.getAll({
                page,
                limit: 10,
                search: searchTerm.trim() || undefined
            });
            setRecords(resp.data || []);
            setTotal(resp.total || 0);
            setTotalPages(resp.totalPages || 1);
        } catch (err) {
            console.error("Failed to fetch holidays:", err);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleExport = async (format: 'pdf' | 'csv') => {
        try {
            await reportService.generateReport({
                type: 'holiday',
                format,
                year: new Date().getFullYear()
            });
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const columns: { _id: string; label: string; format: (value: unknown) => React.ReactNode }[] = [
        {
            _id: "name",
            label: "Holiday Name",
            format: (val: unknown) => <span className="font-bold text-sm text-foreground">{String(val)}</span>
        },
        {
            _id: "date",
            label: "Date",
            format: (val: unknown) => (
                <div className="flex items-center gap-2 text-xs font-bold text-foreground-secondary">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {new Date(String(val)).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            )
        },
        {
            _id: "type",
            label: "Type",
            format: (val: unknown) => (
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-muted border border-border/50 text-foreground-tertiary">
                    {String(val) || "Public"}
                </span>
            )
        },
        {
            _id: "isActive",
            label: "Status",
            format: (val: unknown) => (
                <span className={`text-[10px] font-black uppercase tracking-widest ${val ? 'text-success' : 'text-error'}`}>
                    {val ? 'Active' : 'Inactive'}
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Holidays</span>
                    </div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Public Holiday Schedule</h1>
                    <p className="text-xs font-bold text-foreground-tertiary mt-1 uppercase tracking-wider">Official organization-wide holiday calendar</p>
                </div>
                <Button
                    variant="outline"
                    startIcon={<Download className="w-4 h-4" />}
                    className="rounded-xl"
                    onClick={() => handleExport('pdf')}
                >
                    Export Calendar
                </Button>
            </div>

            <div className="bg-surface rounded-3xl border border-border/40 overflow-hidden relative min-h-[400px]">
                {loading && <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center font-black text-primary">SYNCING...</div>}
                <div className="p-4 border-b border-border/30">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="holiday-report"
                        placeholder="Filter holiday name..."
                    />
                </div>
                <Table columns={columns} rows={records} className="border-none" />
            </div>

            <div className="flex justify-between items-center px-4">
                <p className="text-xs font-bold text-foreground-tertiary">Total Holidays: {total}</p>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </div>
    );
};

export default HolidayListReport;
