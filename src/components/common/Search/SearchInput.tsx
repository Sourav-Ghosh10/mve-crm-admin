import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Trash2, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useRecentSearches } from '../../../hooks/useRecentSearches';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    searchKey?: string;
    wrapperClassName?: string;
    inputClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    searchKey,
    className,
    wrapperClassName,
    inputClassName,
    placeholder = 'Search...',
    onFocus,
    onBlur,
    maxLength = 50,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches(searchKey || 'global');

    // Use the containerRef's click-away logic to handle blur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        if (isFocused) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFocused]);

    const handleSelectRecent = (term: string) => {
        onChange(term);
        setIsFocused(false);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // We rely on handleClickOutside for close-on-click-away
        // A very small delay helps ensure on-click handlers on items fire before the DOM element is hidden
        setTimeout(() => {
            if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
                setIsFocused(false);
            }
        }, 150);
        onBlur?.(e);
    };

    const filteredRecentSearches = value.trim() 
        ? recentSearches.filter(s => s.toLowerCase().includes(value.toLowerCase()))
        : recentSearches;

    const showDropdown = isFocused && filteredRecentSearches.length > 0;

    return (
        <div
            ref={containerRef}
            className={cn("relative group w-full", className, wrapperClassName, showDropdown && "z-10")}
        >
            <div className={cn(
                "relative flex items-center bg-surface border border-border/50 rounded-2xl focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary transition-all h-[42px]",
                showDropdown && "rounded-b-none border-b-transparent border-primary ring-4 ring-primary/5"
            )}>
                <Search className={cn(
                    "absolute left-4 w-4 h-4 transition-colors z-10",
                    isFocused ? "text-primary" : "text-foreground-secondary"
                )} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (value.trim().length >= 2) {
                                addSearch(value.trim());
                            }
                            setIsFocused(false);
                            (e.target as HTMLInputElement).blur();
                        } else if (e.key === 'Escape') {
                            setIsFocused(false);
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                    maxLength={maxLength}
                    className={cn(
                        "w-full pl-12 pr-10 py-3 bg-transparent border-none focus:outline-none focus:ring-0 transition-all text-sm font-bold h-full",
                        inputClassName
                    )}
                    {...props}
                />
                {value && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onChange('');
                        }}
                        className="absolute right-3 p-1 hover:bg-muted rounded-full transition-colors text-foreground-secondary hover:text-foreground z-20"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {showDropdown && (
                <div className="absolute top-full left-[-1px] right-[-1px] bg-surface border border-primary border-t-0 rounded-b-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-muted/20">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-tertiary">
                            {value.trim() ? 'Matching Searches' : 'Recent Searches'}
                        </span>
                        <button
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                clearSearches();
                            }}
                            className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {filteredRecentSearches.map((term, index) => (
                            <div
                                key={`${term}-${index}`}
                                className="group/item flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input from blurring before we process the selection
                                    handleSelectRecent(term);
                                }}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Clock className="w-3.5 h-3.5 text-foreground-tertiary group-hover/item:text-primary transition-colors flex-shrink-0" />
                                    <span className="text-sm text-foreground-secondary group-hover/item:text-foreground font-medium truncate">{term}</span>
                                </div>
                                <button
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        removeSearch(term);
                                    }}
                                    className="p-1.5 opacity-0 group-hover/item:opacity-100 hover:bg-error/10 hover:text-error rounded-lg transition-all text-foreground-tertiary"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
