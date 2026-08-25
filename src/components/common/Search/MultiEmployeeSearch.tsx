import React, { useState, useRef, useEffect } from "react";
import { Search, X, Clock, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useRecentSearches } from "../../../hooks/useRecentSearches";
import { useDebounce } from "../../../hooks/useDebounce";

interface Employee {
    _id: string;
    personalInfo: {
        firstName: string;
        lastName: string;
    };
}

interface MultiEmployeeSearchProps {
    options: Employee[];
    selectedEmployees: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    placeholder?: string;
    className?: string;
    searchKey?: string;
}

const MultiEmployeeSearch: React.FC<MultiEmployeeSearchProps> = ({
    options,
    selectedEmployees,
    onSelectionChange,
    placeholder = "Search employees...",
    className,
    searchKey,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches(searchKey || 'employee-multi-search');
    const debouncedSearchTerm = useDebounce(searchTerm, 2000);

    useEffect(() => {
        if (debouncedSearchTerm.trim().length >= 2) {
            addSearch(debouncedSearchTerm.trim());
        }
    }, [debouncedSearchTerm, addSearch]);

    const filteredOptions = options.filter((employee) => {
        const fullName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`.toLowerCase();
        return (
            fullName.includes(searchTerm.toLowerCase()) &&
            !selectedEmployees.includes(employee._id)
        );
    });

    const handleSelect = (employeeId: string) => {
        onSelectionChange([...selectedEmployees, employeeId]);
        setSearchTerm("");
        setIsOpen(false);
    };

    const handleRemove = (employeeId: string) => {
        onSelectionChange(selectedEmployees.filter((id) => id !== employeeId));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedEmployeeObjects = options.filter((emp) => selectedEmployees.includes(emp._id));

    return (
        <div className={cn("relative group w-full", className, isOpen && "z-[100]")} ref={containerRef}>
            <div
                className={cn(
                    "flex flex-wrap gap-2 items-center min-h-[42px] px-3 py-1.5 bg-surface border border-border/50 rounded-2xl focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all cursor-text shadow-sm hover:border-primary/50",
                    isOpen && "border-primary ring-2 ring-primary"
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {selectedEmployeeObjects.map((employee) => (
                    <span
                        key={employee._id}
                        className="flex items-center gap-1.5 px-3 py-1 bg-muted/90 text-foreground text-[11px] font-bold rounded-xl border border-border/50 group/chip hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(employee._id);
                            }}
                            className="text-foreground-tertiary hover:text-error transition-colors ml-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </span>
                ))}

                <div className="flex-1 flex items-center min-w-[80px]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => {
                            setIsOpen(true);
                            setIsFocused(true);
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                if (!containerRef.current?.contains(document.activeElement)) {
                                    setIsFocused(false);
                                }
                            }, 200);
                        }}
                        placeholder={selectedEmployees.length === 0 ? placeholder : ""}
                        className="w-full bg-transparent border-none outline-none text-sm font-bold placeholder:text-foreground-tertiary focus:ring-0 px-1"
                    />
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-border/30">
                    <Search className="w-4 h-4 text-foreground-tertiary group-focus-within:text-primary transition-colors" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border/40 rounded-2xl shadow-2xl z-[100] max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl custom-scrollbar">
                    {/* Recent Searches */}
                    {isFocused && !searchTerm && recentSearches.length > 0 && (
                        <div className="border-b border-border/30">
                            <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">Recent Searches</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearSearches();
                                    }}
                                    className="text-[10px] font-bold text-primary hover:text-primary-dark"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="p-1">
                                {recentSearches.map((term, index) => (
                                    <div
                                        key={`${term}-${index}`}
                                        className="group/recent flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer rounded-xl transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchTerm(term);
                                        }}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Clock className="w-3.5 h-3.5 text-foreground-tertiary group-hover/recent:text-primary" />
                                            <span className="text-sm text-foreground-secondary group-hover/recent:text-foreground truncate">{term}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSearch(term);
                                            }}
                                            className="p-1 opacity-0 group-hover/recent:opacity-100 hover:bg-error/10 hover:text-error rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-2 space-y-1">
                        {searchTerm || filteredOptions.length > 0 ? (
                            filteredOptions.map((employee) => (
                                <button
                                    key={employee._id}
                                    onClick={() => handleSelect(employee._id)}
                                    className="w-full px-4 py-3 text-left hover:bg-primary/10 rounded-xl transition-all group/item flex items-center justify-between"
                                >
                                    <div className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">
                                        {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        Select
                                    </div>
                                </button>
                            ))
                        ) : !searchTerm && !recentSearches.length ? (
                            <div className="p-8 text-xs font-bold text-foreground-tertiary text-center flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 opacity-10" />
                                Start typing to search...
                            </div>
                        ) : searchTerm && filteredOptions.length === 0 ? (
                            <div className="p-8 text-xs font-bold text-foreground-tertiary text-center flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 opacity-10" />
                                No results found for "{searchTerm}"
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiEmployeeSearch;
