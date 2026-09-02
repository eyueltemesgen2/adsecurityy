import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AppearanceStyles } from "./AppearanceStyles";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppearanceStyles />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-surface text-surface-foreground">
      <div className="container-page py-12 sm:py-16">
        {eyebrow ? <p className="eyebrow text-accent">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl lg:text-[2.75rem]">{title}</h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-surface-foreground/75">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
