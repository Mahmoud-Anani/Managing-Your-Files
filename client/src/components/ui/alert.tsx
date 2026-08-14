import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info" | "warning";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

const config: Record<
  AlertVariant,
  { icon: React.ElementType; className: string; iconClass: string }
> = {
  error: {
    icon: AlertCircle,
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    iconClass: "text-destructive",
  },
  success: {
    icon: CheckCircle2,
    className: "border-success/40 bg-success/10 text-success",
    iconClass: "text-success",
  },
  info: {
    icon: Info,
    className: "border-ring/40 bg-accent text-accent-foreground",
    iconClass: "text-ring",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    iconClass: "text-yellow-500",
  },
};

export function Alert({
  variant = "info",
  title,
  className,
  children,
}: AlertProps) {
  const { icon: Icon, className: alertClass, iconClass } = config[variant];
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-md border p-3 text-sm",
        alertClass,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="mt-0.5 opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
