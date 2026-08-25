import React from "react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../../lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data Found",
  description = "There are no items to display.",
  icon = <Inbox className="w-16 h-16 text-foreground-tertiary" />,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]",
        className,
      )}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground-secondary mb-6 max-w-md">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
