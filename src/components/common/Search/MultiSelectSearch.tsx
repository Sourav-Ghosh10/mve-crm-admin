import React, { useState, useRef, useEffect } from "react";
import { Search, X, Clock, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useRecentSearches } from "../../../hooks/useRecentSearches";
import { useDebounce } from "../../../hooks/useDebounce";

interface Option {
    value: string;
    label: string;
}

interface MultiSelectSearchProps {
    label?: string;
    options: Option[];
    selectedValues: string[];
    onSelectionChange: (selectedValues: string[]) => void;
    placeholder?: string;
    className?: string;
    allowAll?: boolean;
    isLoading?: boolean;
    allowSearch?: boolean;
    searchKey?: string;
    error?: boolean;
    helperText?: string;
    id?: string;
    required?: boolean;
}

const MultiSelectSearch: React.FC<MultiSelectSearchProps> = ({
    label,
    options,
    selectedValues,
    onSelectionChange,
    placeholder = "Select...",
    className,
    allowAll = true,
    allowSearch,
    isLoading = false,
    searchKey,
    error,
    helperText,
    id,
    required,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches(searchKey || 'multi-select-search');
    const debouncedSearchTerm = useDebounce(searchTerm, 2000);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    useEffect(() => {
        if (debouncedSearchTerm.trim().length >= 2) {
            addSearch(debouncedSearchTerm.trim());
        }
    }, [debouncedSearchTerm, addSearch]);

    const isAllSelected = selectedValues.includes('all');

    const filteredOptions = options.filter((option) => {
        const label = option.label.toLowerCase();
        const isSelected = selectedValues.includes(option.value);
        return (
            label.includes(searchTerm.toLowerCase()) &&
            !isSelected &&
            option.value !== 'all'
        );
    });

    const handleSelect = (value: string) => {
        if (value === 'all') {
            onSelectionChange(['all']);
        } else {
            const newValues = [...selectedValues.filter(v => v !== 'all')];
            if (!newValues.includes(value)) {
                newValues.push(value);
            }
            onSelectionChange(newValues);
        }
        setSearchTerm("");
        setIsOpen(false);
    };

    const handleRemove = (value: string) => {
        let newValues = selectedValues.filter((v) => v !== value);
        if (newValues.length === 0 && allowAll) {
            newValues = ['all'];
        }
        onSelectionChange(newValues);
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

    const selectedObjects = isAllSelected
        ? [{ value: 'all', label: 'All' }]
        : options.filter((opt) => selectedValues.includes(opt.value));

    return (
        <div className={cn("relative group w-full mb-3 sm:mb-4", className, isOpen && "z-[100]")} ref={containerRef}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[10px] sm:text-[11px] font-black text-foreground-tertiary mb-1.5 uppercase tracking-widest px-1 cursor-pointer"
                >
                    {label}
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}
            <div
                className={cn(
                    "flex flex-wrap gap-2 items-center min-h-[40px] sm:min-h-[52px] px-3 sm:px-5 py-2 bg-surface/50 backdrop-blur-md border rounded-xl sm:rounded-[1.25rem] transition-all cursor-text shadow-sm",
                    isOpen ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-primary/40",
                    error && "border-error focus-within:ring-error focus-within:border-error"
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {selectedObjects.map((opt) => (
                    <span
                        key={opt.value}
                        className="flex items-center gap-1.5 px-3 py-1 bg-muted/90 text-foreground text-[11px] font-bold rounded-xl border border-border/50 group/chip hover:bg-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {opt.label}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(opt.value);
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
                        id={inputId}
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
                        placeholder={selectedValues.length === 0 ? placeholder : ""}
                        className="w-full bg-transparent border-none outline-none text-sm font-bold placeholder:text-foreground-tertiary focus:ring-0 px-1"
                    />
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-border/30">
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    ) : (
                        allowSearch && <Search className="w-4 h-4 text-foreground-tertiary group-focus-within:text-primary transition-colors" />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border/40 rounded-2xl shadow-2xl z-[100] max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl custom-scrollbar">
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
                        {allowAll && !isAllSelected && "all".includes(searchTerm.toLowerCase()) && (
                            <button
                                onClick={() => handleSelect('all')}
                                className="w-full px-4 py-3 text-left hover:bg-primary/10 rounded-xl transition-all group/item flex items-center justify-between"
                            >
                                <div className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">
                                    All
                                </div>
                                <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest opacity-0 group-hover/item:opacity-100 transition-opacity text-primary">
                                    Select
                                </div>
                            </button>
                        )}
                        {searchTerm || filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className="w-full px-4 py-3 text-left hover:bg-primary/10 rounded-xl transition-all group/item flex items-center justify-between"
                                >
                                    <div className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">
                                        {opt.label}
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-foreground-tertiary tracking-widest opacity-0 group-hover/item:opacity-100 transition-opacity text-primary">
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
            {helperText && (
                <p className={cn("mt-2 text-xs font-bold px-1", error ? "text-error" : "text-foreground-tertiary")}>
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default MultiSelectSearch;
