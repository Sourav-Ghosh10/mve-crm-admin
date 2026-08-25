import React from "react";
import { cn } from "../../../lib/utils";

export interface Column<T> {
  _id: keyof T | string;
  label: string | React.ReactNode; // Updated to support ReactNode for flexible labels
  minWidth?: number;
  align?: "right" | "left" | "center";
  sticky?: boolean; // New property for sticky columns
  format?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  isRowClickable?: (row: T) => boolean;
  className?: string;
  tableClassName?: string;
  emptyState?: React.ReactNode;
  rowClassName?: (row: T) => string;
}

const Table = <T,>({
  columns,
  rows = [],
  onRowClick,
  isRowClickable,
  className,
  emptyState,
  rowClassName,
  tableClassName,
  keyField = "_id",
}: TableProps<T> & { keyField?: string }) => {
  return (
    <div
      className={cn("overflow-auto bg-surface", className)}
    >
      <table className={cn("w-full border-collapse text-left", tableClassName)}>
        <thead className="">
          <tr className="border-b border-border/50">
            {columns.map((column) => (
              <th
                key={String(column._id)}
                className={cn(
                  "px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-foreground-tertiary bg-muted/20 whitespace-nowrap",
                  column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left",
                  column.sticky && "sticky left-0 z-30 bg-surface border-r border-border/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
                )}
                style={{ minWidth: column.minWidth }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr
                key={String((row as Record<string, unknown>)[keyField])}
                onClick={() => {
                  if (onRowClick && (!isRowClickable || isRowClickable(row))) {
                    onRowClick(row);
                  }
                }}
                className={cn(
                  "group transition-all duration-200 hover:bg-muted/40",
                  onRowClick && (!isRowClickable || isRowClickable(row)) && "cursor-pointer",
                  rowClassName && rowClassName(row)
                )}
              >
                {columns.map((column) => {
                  const value = (row as Record<string, unknown>)[column._id as string];
                  return (
                    <td
                      key={String(column._id)}
                      className={cn(
                        "px-6 py-4 align-middle text-sm text-foreground",
                        column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left",
                        column.sticky && "sticky left-0 z-10 bg-surface group-hover:bg-muted/40 border-r border-border/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-colors"
                      )}
                    >
                      {column.format
                        ? column.format(value, row, index)
                        : (value as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12">
                {emptyState || (
                  <div className="text-center text-foreground-tertiary font-medium">
                    No data available
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
