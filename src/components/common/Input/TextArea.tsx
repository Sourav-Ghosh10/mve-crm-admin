import { forwardRef } from "react";
import { cn } from "../../../lib/utils";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: boolean;
    helperText?: string;
    compact?: boolean;
    required?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    (
        {
            label,
            error,
            helperText,
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
                    <label
                        htmlFor={inputId}
                        className={cn(
                            "block text-[10px] sm:text-[11px] font-black text-foreground-tertiary mb-1.5 uppercase tracking-widest px-1 cursor-pointer",
                            compact && "mb-1 text-[9px]"
                        )}
                    >
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <textarea
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full px-3 sm:px-5 py-2.5 sm:py-3.5 border rounded-xl sm:rounded-[1.25rem] bg-surface/50 backdrop-blur-md transition-all duration-300 outline-none resize-none min-h-[120px]",
                            compact && "py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs min-h-[80px]",
                            "focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 focus:border-primary focus:shadow-lg sm:focus:shadow-xl",
                            "placeholder:text-foreground-tertiary/50",
                            error
                                ? "border-error focus:ring-error"
                                : "border-border hover:border-primary/40",
                            className,
                        )}
                        {...props}
                    />
                    {props.maxLength && (
                        <div className={cn(
                            "absolute bottom-2 right-4 text-[9px] font-black uppercase tracking-tighter transition-colors",
                            (String(props.value || "").length >= props.maxLength) ? "text-error" : "text-foreground-tertiary/50"
                        )}>
                            {String(props.value || "").length} / {props.maxLength}
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

TextArea.displayName = "TextArea";

export default TextArea;
