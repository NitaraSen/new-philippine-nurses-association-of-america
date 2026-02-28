import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "active" | "lapsed" | "archived" | "wildapricot" | "app";

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-success/10 text-success border-success/20",
  lapsed: "bg-destructive/10 text-destructive border-destructive/20",
  archived: "bg-muted text-muted-foreground border-muted",
  wildapricot: "bg-primary/10 text-primary border-primary/20",
  app: "bg-success/10 text-success border-success/20",
};

const variantLabels: Record<StatusVariant, string> = {
  active: "Active",
  lapsed: "Lapsed",
  archived: "Archived",
  wildapricot: "Wild Apricot",
  app: "Manual",
};

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", variantStyles[variant], className)}
    >
      {label || variantLabels[variant]}
    </Badge>
  );
}
