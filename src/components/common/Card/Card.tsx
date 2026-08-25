import React, { forwardRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  variant?: "default" | "bordered" | "elevated";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      subtitle,
      children,
      action,
      variant = "default",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground rounded-xl flex flex-col h-fit overflow-hidden",
          {
            "shadow-md hover:shadow-lg transition-all duration-300":
              variant === "default",
            "border border-border": variant === "bordered",
            "shadow-lg": variant === "elevated",
          },
          className,
        )}
        {...props}
      >
        {(title || action) && (
          <div className="p-4 pb-0 flex justify-between items-start">
            <div>
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {subtitle && (
                <p className="text-sm text-foreground-secondary">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="flex-grow">{children}</div>
      </div>
    );
  },
);

Card.displayName = "Card";

// Additional Card sub-components for more flexibility
const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-foreground-secondary", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export default Card;
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
