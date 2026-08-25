import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format date values
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "time" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "long":
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
      }).format(d);
    case "time":
      return new Intl.DateTimeFormat("en-US", {
        timeStyle: "short",
      }).format(d);
    default:
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
      }).format(d);
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
