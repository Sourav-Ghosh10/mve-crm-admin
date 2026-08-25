import React from "react";
import { BarChart3, History } from "lucide-react";
import { Link } from "react-router-dom";

const ComingSoonReport: React.FC = () => {
    return (
        <div className="p-12 text-center bg-surface rounded-[3rem] border border-border/40 shadow-xl shadow-black/[0.02] flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6">
                <BarChart3 className="w-10 h-10 text-primary opacity-40" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-3">Analytics View Pending</h2>
            <p className="text-sm font-bold text-foreground-tertiary lowercase tracking-tight max-w-sm mx-auto mb-8">
                This specific report segment is currently being optimized for real-time data streaming.
            </p>
            <Link
                to="/reports"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
                Return to Hub
                <History className="w-4 h-4" />
            </Link>
        </div>
    );
};

export default ComingSoonReport;
