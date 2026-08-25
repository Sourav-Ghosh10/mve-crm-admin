import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-br from-[#2196f3] to-[#1976d2] text-white shadow-md hover:shadow-primary hover:-translate-y-0.5",
                destructive:
                    "bg-gradient-to-br from-[#ef5350] to-[#e53935] text-white shadow-sm hover:opacity-90",
                outline:
                    "bg-white text-[#1976d2] border-2 border-[#1976d2] hover:bg-[#1976d2] hover:text-white shadow-sm hover:-translate-y-0.5",
                secondary:
                    "bg-gradient-to-br from-[#f5f7fa] to-[#e0e0e0] text-[#2c3e50] border border-[#e0e0e0] shadow-sm hover:shadow-md",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                success: "bg-gradient-to-br from-[#66bb6a] to-[#43a047] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
                warning: "bg-gradient-to-br from-[#ffa726] to-[#fb8c00] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
            },
            size: {
                default: "h-10 px-6 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-12 rounded-xl px-10 text-base",
                icon: "h-9 w-9 px-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
