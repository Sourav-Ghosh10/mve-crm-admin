import { forwardRef } from "react";
import { cn } from "../../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  compact?: boolean;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startAdornment,
      endAdornment,
      compact,
      required,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="mb-3 sm:mb-4">
        {label && (
          <div className="flex justify-between items-end mb-1.5 px-1">
            <label
              htmlFor={inputId}
              className={cn(
                "block text-[10px] sm:text-[11px] font-black text-foreground-tertiary uppercase tracking-widest cursor-pointer",
                compact && "text-[9px]"
              )}
            >
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </label>
            {props.maxLength && (
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter transition-colors",
                (String(props.value || "").length >= props.maxLength) ? "text-error" : "text-foreground-tertiary/50"
              )}>
                {String(props.value || "").length} / {props.maxLength}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          {startAdornment && (
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-primary/70 z-10">
              {startAdornment}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-3 sm:px-5 py-2.5 sm:py-3.5 border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md transition-all duration-300 outline-none",
              compact && "py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs",
              "focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 focus:border-primary focus:shadow-lg sm:focus:shadow-xl",
              "placeholder:text-foreground-tertiary/50",
              error
                ? "border-error focus:ring-error"
                : "border-border hover:border-primary/40",
              startAdornment && (compact ? "pl-9 sm:pl-10" : "pl-10 sm:pl-12"),
              endAdornment && (compact ? "pr-9 sm:pr-10" : "pr-10 sm:pr-12"),
              className,
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center z-10">
              {endAdornment}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              "mt-1 sm:mt-1.5 text-[10px] sm:text-xs",
              error ? "text-error" : "text-foreground-secondary",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
