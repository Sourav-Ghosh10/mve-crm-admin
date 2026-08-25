import React from "react";
import {
    BarChart3,
    Clock,
    CalendarOff,
    Palmtree,
    AlertCircle,
    Timer,
    ChevronRight,
    Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { SearchInput } from "../../components/common/Search/SearchInput";

interface ReportPath {
    title: string;
    path: string;
    description: string;
}

interface ReportCategory {
    title: string;
    icon: React.ElementType;
    description: string;
    color: string;
    paths: ReportPath[];
}

const reportCategories: ReportCategory[] = [
    {
        title: "Attendance",
        icon: Clock,
        description: "Detailed attendance tracking and employee presence records.",
        color: "blue",
        paths: [
            { title: "Daily Attendance", path: "/reports/attendance/daily", description: "Punch records for the current day." },
            { title: "Monthly Attendance", path: "/reports/attendance/monthly", description: "Consolidated monthly attendance summary." },
            // { title: "Employee-wise", path: "/reports/attendance/employee", description: "Individual employee attendance history." },
        ],
    },
    {
        title: "Work Hours & Shifts",
        icon: Timer,
        description: "Overview of shifts, working hours, and overtime calculations.",
        color: "purple",
        paths: [
            { title: "Shift Summary", path: "/reports/work-hours/shifts", description: "Total hours worked per shift." },
            { title: "Overtime Report", path: "/reports/work-hours/overtime", description: "Calculation of extra hours worked." },
        ],
    },
    {
        title: "Leaves",
        icon: CalendarOff,
        description: "Tracking leave applications, history, and current status.",
        color: "orange",
        paths: [
            // { title: "Leave Summary", path: "/reports/leaves/summary", description: "Total leaves taken by employees." },
            { title: "Leave History", path: "/reports/leaves/history", description: "Full audit trail of leave requests." },
        ],
    },
    {
        title: "Holidays & Week-offs",
        icon: Palmtree,
        description: "Manage holiday schedules and worked off-days.",
        color: "green",
        paths: [
            { title: "Holiday List", path: "/reports/holidays/list", description: "Upcoming public and regional holidays." },
            // { title: "Worked on Off-day", path: "/reports/holidays/worked-off", description: "Employees who worked during holidays/off-days." },
        ],
    },
    {
        title: "Exceptions",
        icon: AlertCircle,
        description: "Identify late arrivals, early exits, and missed punches.",
        color: "red",
        paths: [
            { title: "Late Arrival", path: "/reports/exceptions/late", description: "Employees arriving after the grace period." },
            { title: "Early Exit", path: "/reports/exceptions/early", description: "Employees leaving before shift completion." },
            // { title: "Missed Punch", path: "/reports/exceptions/missed", description: "Incomplete punch-in/out records." },
        ],
    },
    // {
    //     title: "Analytics",
    //     icon: BarChart3,
    //     description: "Visual data analysis for attendance and department performance.",
    //     color: "indigo",
    //     paths: [
    //         { title: "Attendance %", path: "/reports/analytics/attendance-percent", description: "Overall attendance percentage trends." },
    //         { title: "Department Overview", path: "/reports/analytics/department", description: "Performance metrics by department." },
    //     ],
    // },
];

const ReportsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredCategories = React.useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return reportCategories;

        return reportCategories.map(category => ({
            ...category,
            paths: category.paths.filter(path =>
                path.title.toLowerCase().includes(term) ||
                path.description.toLowerCase().includes(term) ||
                category.title.toLowerCase().includes(term)
            )
        })).filter(category => category.paths.length > 0);
    }, [searchTerm]);

    return (
        <div className="space-y-10 min-h-screen pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2 py-0.5 rounded-md">Management</span>
                        <ChevronRight className="w-3 h-3 text-foreground-tertiary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-tertiary">Reports Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                        Intelligence Hub
                        <BarChart3 className="w-8 h-8 text-primary/40" />
                    </h1>
                    <p className="text-sm font-medium text-foreground-tertiary mt-2 max-w-xl leading-relaxed">
                        Comprehensive data analytics and operational insights for your workforce. Monitor performance, attendance, and compliance in real-time.
                    </p>
                </div>

                <div className="w-full md:w-80">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        searchKey="reports"
                        placeholder="Search reports..."
                        className="bg-surface border-border/40 rounded-2xl h-12"
                    />
                </div>
            </div>

            {/* Quick Stats or Overview (Optional but adds value) */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Reports", value: "12", sub: "Operational", icon: BarChart3, color: "blue" },
                    { label: "Active Monitors", value: "08", sub: "Real-time", icon: Timer, color: "purple" },
                    { label: "Scheduled Exports", value: "04", sub: "Daily/Weekly", icon: Clock, color: "orange" },
                    { label: "Data Integrity", value: "99%", sub: "Sanitized", icon: AlertCircle, color: "green" },
                ].map((stat, i) => (
                    <div key={i} className="bg-surface/50 border border-border/30 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                            stat.color === 'blue' && "bg-blue-500 shadow-blue-500/20",
                            stat.color === 'purple' && "bg-purple-500 shadow-purple-500/20",
                            stat.color === 'orange' && "bg-orange-500 shadow-orange-500/20",
                            stat.color === 'green' && "bg-emerald-500 shadow-emerald-500/20",
                        )}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-foreground">{stat.value}</span>
                                <span className="text-[9px] font-bold text-foreground-tertiary/60 uppercase">{stat.sub}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div> */}

            {/* Main Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredCategories.map((category) => (
                    <div
                        key={category.title}
                        className="group bg-surface rounded-[2.5rem] border border-border/40 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col relative"
                    >
                        {/* Abstract background icon */}
                        <category.icon className="absolute -top-10 -right-10 w-40 h-40 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />

                        <div className="p-8 pb-4 relative z-10 flex-1">
                            <div className="flex items-center gap-5 mb-8">
                                <div className={cn(
                                    "w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg shadow-black/[0.03]",
                                    category.color === 'blue' && "bg-blue-500/10 text-blue-600",
                                    category.color === 'purple' && "bg-purple-500/10 text-purple-600",
                                    category.color === 'orange' && "bg-orange-500/10 text-orange-600",
                                    category.color === 'green' && "bg-emerald-500/10 text-emerald-600",
                                    category.color === 'red' && "bg-rose-500/10 text-rose-600",
                                    category.color === 'indigo' && "bg-indigo-500/10 text-indigo-600",
                                )}>
                                    <category.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground tracking-tight leading-none mb-1">{category.title}</h2>
                                    <p className="text-[10px] font-black text-foreground-tertiary uppercase tracking-[0.15em] opacity-80">{category.paths.length} Active Modules</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {category.paths.map((report) => (
                                    <Link
                                        key={report.title}
                                        to={report.path}
                                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-all group/link border border-transparent hover:border-border/30 hover:translate-x-1"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-foreground group-hover/link:text-primary transition-colors flex items-center gap-2">
                                                {report.title}
                                                {/* Hidden Logic for 'Coming Soon' - if we want to show it explicitly */}
                                                {report.path.includes('coming-soon') && (
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-black uppercase tracking-tighter">SOON</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-foreground-tertiary font-bold truncate mt-1 opacity-60 group-hover/link:opacity-100">{report.description}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-surface border border-border/20 flex items-center justify-center opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all shadow-sm">
                                            <ChevronRight className="w-4 h-4 text-primary" />
                                        </div>
                                    </Link>
                                ))}

                                {/* Placeholder for planned reports */}
                                {(category.title === "Attendance" || category.title === "Leaves" || category.title === "Work Hours & Shifts" || category.title === "Analytics") && (
                                    <div className="opacity-40 select-none px-4 pt-2">
                                        <div className="h-px bg-border/40 mb-4" />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary mb-3">Planned Extensions</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {category.title === "Attendance" && <span className="text-[8px] font-black px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-foreground-tertiary/60 cursor-not-allowed">Employee-wise</span>}
                                            {category.title === "Leaves" && <span className="text-[8px] font-black px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-foreground-tertiary/60 cursor-not-allowed">Leave Summary</span>}
                                            {category.title === "Work Hours & Shifts" && <span className="text-[8px] font-black px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-foreground-tertiary/60 cursor-not-allowed">Break Analytics</span>}
                                            {category.title === "Analytics" && (
                                                <>
                                                    <span className="text-[8px] font-black px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-foreground-tertiary/60 cursor-not-allowed">Attendance %</span>
                                                    <span className="text-[8px] font-black px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-foreground-tertiary/60 cursor-not-allowed">Dept Performance</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-muted/20 border-t border-border/30 backdrop-blur-sm mt-auto">
                            <p className="text-[11px] text-foreground-tertiary/80 font-bold leading-relaxed line-clamp-2 italic">
                                "{category.description}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                        <Search className="w-8 h-8 text-foreground-tertiary" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">No matching reports</h3>
                    <p className="text-sm font-medium text-foreground-tertiary max-w-xs">
                        We couldn't find any report or category matching "{searchTerm}". Try another keyword.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
