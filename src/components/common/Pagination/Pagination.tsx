import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import Button from "../Button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}) => {
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Generate exactly 3 page numbers that shift dynamically
    const getPageNumbers = () => {
        const pages: number[] = [];

        if (totalPages <= 3) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start: number;

            if (currentPage <= 2) {
                // Near start: [1] 2 3 or 1 [2] 3
                start = 1;
            } else if (currentPage >= totalPages - 1) {
                // Near end: 98 [99] 100 or 98 99 [100]
                start = totalPages - 2;
            } else {
                // Middle: 49 [50] 51
                start = currentPage - 1;
            }

            for (let i = 0; i < 3; i++) {
                pages.push(start + i);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="
                    w-10 h-10 sm:w-12 sm:h-12
                    rounded-2xl
                    bg-surface
                    border-border/50
                    text-foreground-tertiary
                    hover:bg-muted
                    hover:text-foreground-tertiary
                    shadow-sm
                    disabled:opacity-30
                    disabled:cursor-not-allowed
                    transition-all
                    active:scale-95
                "
            >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>


            <div className="flex gap-1.5 sm:gap-2">
                {pageNumbers.map((pageNum) => {
                    const isActive = currentPage === pageNum;

                    return (
                        <Button
                            key={pageNum}
                            variant={isActive ? "default" : "outline"}
                            onClick={() => onPageChange(pageNum)}
                            className={cn(
                                "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-black transition-all border text-sm sm:text-base p-0 active:scale-95",
                                isActive
                                    ? "shadow-lg shadow-primary/30 z-10 bg-gradient-to-r from-primary to-primary-dark text-white border-0 scale-105"
                                    : "bg-surface text-foreground-tertiary border-border/50 hover:bg-muted hover:text-foreground-tertiary"
                            )}
                        >
                            {pageNum}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="
                    w-10 h-10 sm:w-12 sm:h-12
                    rounded-2xl
                    bg-surface
                    border-border/50
                    text-foreground-tertiary
                    hover:bg-muted
                    hover:text-foreground-tertiary
                    shadow-sm
                    disabled:opacity-30
                    disabled:cursor-not-allowed
                    transition-all
                    active:scale-95
                "
            >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
        </div>
    );
};

export default Pagination;
