import { Link } from "@tanstack/react-router";
import { useSite } from "@/lib/site-context";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string; invert?: boolean }) {
  const { branding } = useSite();
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label={branding.company_name}>
      {branding.logo_url ? (
        <img src={branding.logo_url} alt={branding.company_name} className="h-9 w-auto max-w-[160px]" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/10 shadow-sm">
          <img
            src="/images/ad-logo-mark.png"
            alt=""
            aria-hidden="true"
            className="h-9 w-9 scale-125 object-contain"
          />
        </span>
      )}
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-extrabold uppercase tracking-tight sm:text-base">
          {branding.company_name}
        </span>
        {branding.tagline ? (
          <span className="mt-0.5 hidden text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground sm:block">
            {branding.tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
