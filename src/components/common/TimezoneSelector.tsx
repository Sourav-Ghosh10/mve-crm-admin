import React, { useState, useRef, useEffect } from "react";
import { Globe, Search, Check, Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setSelectedTimezone } from "../../store/slices/uiSlice";
import { cn } from "../../lib/utils";

// Major timezones list with strict types
interface TimezoneOption {
    id: string;
    label: string;
    offset?: string;
}

const TIMEZONES: TimezoneOption[] = [
    { id: "UTC", label: "UTC (Greenwich Mean Time)", offset: "+00:00" },
    { id: "Asia/Kolkata", label: "IST (India Standard Time)", offset: "+05:30" },
    { id: "America/New_York", label: "EST (Eastern Standard Time)", offset: "-05:00" },
    { id: "America/Chicago", label: "CST (Central Standard Time)", offset: "-06:00" },
    { id: "America/Denver", label: "MST (Mountain Standard Time)", offset: "-07:00" },
    { id: "America/Los_Angeles", label: "PST (Pacific Standard Time)", offset: "-08:00" },
    { id: "Europe/London", label: "GMT/BST (London)", offset: "+00:00" },
    { id: "Europe/Paris", label: "CET (Paris/Berlin)", offset: "+01:00" },
    { id: "Asia/Dubai", label: "GST (Dubai)", offset: "+04:00" },
    { id: "Asia/Singapore", label: "SGT (Singapore)", offset: "+08:00" },
    { id: "Asia/Tokyo", label: "JST (Tokyo)", offset: "+09:00" },
    { id: "Australia/Sydney", label: "AEST (Sydney)", offset: "+10:00" },
].sort((a, b) => a.label.localeCompare(b.label));

// Optional: Fallback to dynamic supported list if browser supports it
const browserTzs = typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
    ? (Intl as unknown as { supportedValuesOf(key: string): string[] }).supportedValuesOf('timeZone').map((tz: string) => ({
        id: tz,
        label: tz.replace(/_/g, ' '),
    }))
    : [];

// Merge and deduplicate
const ALL_TIMEZONES = [...TIMEZONES];
browserTzs.forEach((btz: { id: string; label: string }) => {
    if (!ALL_TIMEZONES.find(t => t.id === btz.id)) {
        ALL_TIMEZONES.push(btz);
    }
});

const getTimezoneLabel = (id: string) => {
    return TIMEZONES.find(tz => tz.id === id)?.label.split(' (')[0] || id.split('/').pop()?.replace(/_/g, ' ') || id;
};

const TimezoneSelector: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedTimezone = useAppSelector((state) => state.ui.selectedTimezone);
    const timezoneView = useAppSelector((state) => state.ui.timezoneView);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTimezoneChange = (tzId: string) => {
        dispatch(setSelectedTimezone(tzId));
        setIsOpen(false);
    };

    const filteredTimezones = ALL_TIMEZONES.filter(tz =>
        tz.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tz.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                    timezoneView === 'admin'
                        ? "bg-surface shadow-md text-primary border border-border/50 scale-[1.02]"
                        : "text-foreground-secondary hover:text-foreground hover:bg-muted/50"
                )}
            >
                <Globe className={cn("w-3.5 h-3.5", timezoneView === 'admin' && isOpen ? "animate-spin" : timezoneView === 'admin' ? "animate-pulse" : "")} />
                {getTimezoneLabel(selectedTimezone)}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
                    <div className="p-3 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Select Timezone</h3>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-foreground-tertiary">
                                <Clock className="w-3 h-3" />
                                {new Date().toLocaleTimeString('en-US', { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search timezones..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-[11px] focus:ring-1 focus:ring-primary focus:border-transparent outline-none font-bold placeholder:font-medium uppercase tracking-tight"
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                        {filteredTimezones.length === 0 ? (
                            <div className="p-4 text-center text-[10px] font-bold text-foreground-tertiary uppercase">
                                No timezones found
                            </div>
                        ) : (
                            filteredTimezones.map((tz) => (
                                <button
                                    key={tz.id}
                                    onClick={() => handleTimezoneChange(tz.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 text-[10px] transition-colors text-left font-bold uppercase tracking-tight",
                                        selectedTimezone === tz.id
                                            ? "bg-primary/5 text-primary"
                                            : "hover:bg-muted text-foreground"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="truncate max-w-[200px]">{tz.label}</span>
                                        <span className="text-[9px] text-foreground-tertiary opacity-70">
                                            {tz.id}
                                        </span>
                                    </div>
                                    {selectedTimezone === tz.id && (
                                        <Check className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-2 border-t border-border bg-muted/50">
                        <p className="text-[9px] text-center text-foreground-tertiary font-bold uppercase tracking-widest opacity-60">
                            Backend calculation synced to this zone
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimezoneSelector;
