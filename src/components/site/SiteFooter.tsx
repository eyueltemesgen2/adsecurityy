import { Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Music2, Phone, Send } from "lucide-react";
import { useSite } from "@/lib/site-context";
import { Logo } from "./Logo";

type FooterLink = { label: string; url: string };

const FALLBACK_SERVICES: FooterLink[] = [
  { label: "Surveillance Systems", url: "/services" },
  { label: "Access Management", url: "/services" },
  { label: "Network Infrastructure", url: "/services" },
  { label: "Remote Monitoring", url: "/services" },
  { label: "Maintenance", url: "/services" },
  { label: "Security Consulting", url: "/services" },
];

const SOCIALS = [
  { name: "TikTok", handle: "@adsecurtycamera", url: "https://tiktok.com/@adsecurtycamera", icon: Music2 },
  { name: "Instagram", handle: "@adsecurtycamera", url: "https://instagram.com/adsecurtycamera", icon: Instagram },
  { name: "Telegram", handle: "@adsecurtycamera", url: "https://t.me/adsecurtycamera", icon: Send },
];

const FALLBACK_COMPANY: FooterLink[] = [
  { label: "About Us", url: "/about" },
  { label: "Our Projects", url: "/gallery" },
  { label: "FAQ", url: "/faq" },
  { label: "Contact", url: "/contact" },
];

export function SiteFooter() {
  const { branding, contact, footerSections, footerSettings, socialLinks } = useSite();
  const year = new Date().getFullYear();
  const serviceLinks = footerSections.find((s) => /service|cctv|solution/i.test(s.title ?? ""))?.links as unknown as FooterLink[] | undefined;
  const companyLinks = footerSections.find((s) => /compan|about|quick/i.test(s.title ?? ""))?.links as unknown as FooterLink[] | undefined;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
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
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${social.name} (${social.handle})`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {social.name}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h3 className="eyebrow text-foreground">Services</h3>
          <ul className="mt-5 space-y-2.5">
            {(serviceLinks ?? FALLBACK_SERVICES).map((link, index) => (
              <li key={`svc-${index}`}>
                <a href={link.url} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="eyebrow text-foreground">Company</h3>
          <ul className="mt-5 space-y-2.5">
            {(companyLinks ?? FALLBACK_COMPANY).map((link, index) => (
              <li key={`co-${index}`}>
                <a href={link.url} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h3 className="eyebrow text-foreground">Contact</h3>
          <ul className="mt-5 space-y-3.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-primary">
                {contact.email}
              </a>
            </li>
            {contact.phone ? (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`tel:${contact.phone}`} className="transition-colors hover:text-primary">
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            ) : null}
            {contact.working_hours ? (
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{contact.working_hours}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            &copy; {year} {footerSettings.copyright || `${branding.company_name}. All rights reserved.`}
          </p>
          <div className="flex gap-5">
            <Link to="/faq" className="transition-colors hover:text-primary">
              FAQ
            </Link>
            <Link to="/contact" className="transition-colors hover:text-primary">
              Contact
            </Link>
            <Link to="/request-service" className="transition-colors hover:text-primary">
              Get Free Quote
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
