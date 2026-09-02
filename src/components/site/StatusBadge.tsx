import { statusLabel } from "@/lib/db-types";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  submitted: "bg-warning/15 text-warning-foreground border-warning/40",
  under_review: "bg-warning/15 text-warning-foreground border-warning/40",
  confirmed: "bg-primary/10 text-primary border-primary/25",
  contacted: "bg-primary/10 text-primary border-primary/25",
  processing: "bg-primary/10 text-primary border-primary/25",
  scheduled: "bg-primary/10 text-primary border-primary/25",
  in_progress: "bg-accent/15 text-accent border-accent/35",
  ready: "bg-accent/15 text-accent border-accent/35",
  out_for_delivery: "bg-accent/15 text-accent border-accent/35",
  completed: "bg-success/15 text-success border-success/35",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide",
        TONES[status] ?? "bg-secondary text-secondary-foreground border-border",
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
