import React from "react";
import { UserMinus, Plus, XCircle, CheckCircle2 } from "lucide-react";
import Button from "../../components/common/Button";

interface BulkActionsToolbarProps {
    selectedCount: number;
    onBulkAssign: () => void;
    onBulkMarkOff: () => void;
    onClearSelection: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
    selectedCount,
    onBulkAssign,
    onBulkMarkOff,
    onClearSelection,
}) => {
    return (
        <div className="sticky top-4 z-[40] flex flex-col sm:flex-row items-center gap-4 p-4 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-[2rem] shadow-2xl shadow-primary/10 animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
            <div className="flex items-center gap-4 border-r border-primary/10 pr-6 mr-2">
                <div className="relative">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/30 rotate-3">
                        {selectedCount}
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center shadow-lg ring-2 ring-white">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-tight leading-none mb-1">
                        Active Selection
                    </h3>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none">
                        {selectedCount} Employee{selectedCount > 1 ? 's' : ''} Selected
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:flex-1">
                <Button
                    size="sm"
                    className="h-11 px-5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10"
                    startIcon={<Plus className="w-4 h-4" />}
                    onClick={onBulkAssign}
                >
                    Assign New Shift
                </Button>

                {/* <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 px-5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest border border-primary/20 bg-white/50 hover:bg-white text-primary"
                    startIcon={<Edit3 className="w-4 h-4" />}
                    onClick={onBulkEdit}
                >
                    Apply Changes
                </Button> */}

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 px-5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest border border-red-500/10 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 transition-all duration-300"
                    startIcon={<UserMinus className="w-4 h-4" />}
                    onClick={onBulkMarkOff}
                >
                    Mark Off Duty
                </Button>
            </div>

            <button
                onClick={onClearSelection}
                className="flex items-center gap-2 pl-4 ml-auto border-l border-primary/10 text-primary/40 hover:text-red-500 transition-colors group"
                title="Clear Selection"
            >
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Dismiss Selection</span>
                <XCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
        </div>
    );
};

export default BulkActionsToolbar;

