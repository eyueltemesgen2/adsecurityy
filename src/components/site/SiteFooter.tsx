import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useSite } from "@/lib/site-context";

type FooterLink = { label: string; url: string };

export function SiteFooter() {
  const { branding, contact, footerSections, footerSettings, socialLinks } = useSite();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t-2 border-accent bg-surface text-surface-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.company_name} className="h-9 w-auto max-w-[170px]" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-accent-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
            )}
            <span className="font-display text-base font-extrabold uppercase tracking-tight">
              {branding.company_name}
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-surface-foreground/70">
            {footerSettings.description || branding.description}
          </p>
          {socialLinks.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-sm border border-surface-foreground/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent hover:text-accent"
                >
                  {link.platform}
                  {link.username ? <span className="opacity-60"> {link.username}</span> : null}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {footerSections.map((section) => (
          <div key={section.id}>
            <h3 className="eyebrow text-accent">{section.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {((section.links ?? []) as FooterLink[]).map((link) => (
                <li key={`${section.id}-${link.url}`}>
                  <a
                    href={link.url}
                    className="text-sm text-surface-foreground/75 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="eyebrow text-accent">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-surface-foreground/75">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${contact.email}`} className="break-all hover:text-accent">
                {contact.email}
              </a>
            </li>
            {contact.phone ? (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <a href={`tel:${contact.phone}`} className="hover:text-accent">
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{contact.address}</span>
              </li>
            ) : null}
            {contact.working_hours ? (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{contact.working_hours}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-surface-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-surface-foreground/60 sm:flex-row">
          <p>
            &copy; {year} {footerSettings.copyright || `${branding.company_name}. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            <Link to="/faq" className="hover:text-accent">
              FAQ
            </Link>
            <Link to="/contact" className="hover:text-accent">
              Contact
            </Link>
            <Link to="/request-service" className="hover:text-accent">
              Request Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
