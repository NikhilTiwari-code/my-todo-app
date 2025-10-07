import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "secondary";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      success: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      danger: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      secondary: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
