import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <p className="eyebrow text-accent">{eyebrow}</p> : null}
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-[2.15rem]">{title}</h2>
        {subtitle ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
