import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Cctv,
  KeyRound,
  Mail,
  MapPin,
  MonitorSmartphone,
  Network,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { getHomepage } from "@/lib/public.functions";
import { PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ProductCard, type ProductWithCategory } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSite } from "@/lib/site-context";

const homeQuery = queryOptions({ queryKey: ["homepage"], queryFn: () => getHomepage() });

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "AD Security — Command Center for CCTV & Access Control" },
      {
        name: "description",
        content:
          "AD Security Camera Solution designs, installsand monitors enterprise surveillance, access controland network infrastructure. Live monitoring, certified engineers, 24/7 coverage.",
      },
      { property: "og:title", content: "AD Security — Command Center for CCTV & Access Control" },
      {
        property: "og:description",
        content:
          "Enterprise-grade surveillance, access controland remote monitoring platform. Live camera feeds, device health, alerts — designed, installedand supported by certified engineers.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

type SectionRow = {
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  cta2_label: string | null;
  cta2_link: string | null;
  items: unknown;
};

type Item = { title?: string; description?: string; value?: string; label?: string };

const LIVE_FEEDS = [
  { name: "Front Gate", location: "Entrance", status: "live", image: "https://images.unsplash.com/photo-1549109926-58f039549485?auto=format&fit=crop&w=800&q=80" },
  { name: "Car Park", location: "Level B1", status: "live", image: "https://images.unsplash.com/photo-1563920443079-783e5c786b83?auto=format&fit=crop&w=800&q=80" },
  { name: "Lobby", location: "Main hall", status: "live", image: "https://images.unsplash.com/photo-1528312635006-8ea0bc49ec63?auto=format&fit=crop&w=800&q=80" },
  { name: "Server Room", location: "East wing", status: "offline", image: "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=800&q=80" },
];

const DEVICES = [
  { name: "Front Gate — 4K Bullet", status: "online" },
  { name: "Lobby — Dome", status: "online" },
  { name: "Car Park — PTZ", status: "online" },
  { name: "Server Room — Audio", status: "offline" },
];

const ALERTS = [
  { label: "Motion detected", detail: "Front Gate · 22:14" },
  { label: "Access granted", detail: "Admin door · 21:58" },
];

const CUSTOMER_LOGOS = [
  "Sterling Hotels",
  "Meridian Offices",
  "Kensington Retail",
  "BlueOak Logistics",
  "Metro Plaza",
  "Crestline Schools",
];

const SERVICE_AREAS = [
  "City center",
  "Residential estates",
  "Business districts",
  "Industrial parks",
  "Retail corridors",
  "Warehouse zones",
];

const SOCIALS = [
  { platform: "TikTok", handle: "@adsecurtycamera", url: "https://tiktok.com/@adsecurtycamera" },
  { platform: "Instagram", handle: "@adsecurtycamera", url: "https://instagram.com/adsecurtycamera" },
  { platform: "Telegram", handle: "@adsecurtycamera", url: "https://t.me/adsecurtycamera" },
];

const FALLBACK_HERO_STATS: Item[] = [
  { value: "2,400+", label: "Active Cameras" },
  { value: "500+", label: "Installations Completed" },
  { value: "24/7", label: "Monitoring Coverage" },
  { value: "98%", label: "Client Satisfaction" },
];

const FALLBACK_SERVICES: { name: string; short_description: string; icon: typeof ShieldCheck }[] = [
  { name: "Surveillance Systems", short_description: "CCTV design, supply, installation and commissioning for sites of every scale.", icon: Cctv },
  { name: "Access Management", short_description: "Keypad, card and intercom access control with full audit trails.", icon: KeyRound },
  { name: "Network Infrastructure", short_description: "Structured cabling, PoE switches, NVRs and secure network design.", icon: Network },
  { name: "Remote Monitoring", short_description: "24/7 live viewing, cloud retention and instant alerting from any screen.", icon: MonitorSmartphone },
  { name: "Maintenance", short_description: "Preventive service plans, firmware updates, spare parts and rapid repairs.", icon: Wrench },
  { name: "Security Consulting", short_description: "Site risk assessment, system design, compliance guidance and phased rollouts.", icon: ShieldCheck },
];

const FALLBACK_ABOUT_ITEMS: Item[] = [
  { value: "15+", label: "Years in business" },
  { value: "12", label: "Certified technicians" },
  { value: "<48h", label: "Response time" },
  { value: "6", label: "Coverage areas" },
];

const FALLBACK_FAQ: { question: string; answer: string }[] = [
  { question: "How do I choose the right camera system?", answer: "We start with a free site survey, map your coverage requirements, then recommend the right camera types, resolution, storage and network design for your budget." },
  { question: "Can I view cameras live from my phone?", answer: "Yes. All our systems include secure remote viewing on mobile, tablet or desktop, with role-based access for your team." },
  { question: "Do you support businesses with many sites?", answer: "Absolutely. We design multi-site deployments with central monitoring, per-site access control and consolidated alerting." },
  { question: "What does a maintenance plan include?", answer: "Preventive inspections, camera cleaning, firmware updates, storage health checks and priority support, with agreed response times." },
  { question: "How fast can you respond to a fault?", answer: "Planned maintenance visits are scheduled, while urgent faults are prioritized — typical response is within 48 hours, often faster." },
  { question: "How do I get a quote?", answer: "Request a free survey through the site or contact us directly. You'll get a clear, itemized proposal — no obligation." },
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { contact } = useSite();
  const sections = (data.sections ?? []) as unknown as SectionRow[];
  const find = (key: string) => sections.find((s) => s.key === key);
  const items = (section?: SectionRow): Item[] =>
    Array.isArray(section?.items) ? (section!.items as Item[]) : [];

  const hero = find("hero");
  const servicesSection = find("services") ?? find("capabilities");
  const productsSection = find("featured_products") ?? find("products");
  const about = find("installation") ?? find("about") ?? find("credentials");
  const faqSection = find("faq");
  const cta = find("cta") ?? find("final_cta");

  const heroStats = items(hero).length ? items(hero) : FALLBACK_HERO_STATS;
  const services = (data.services.length ? data.services : FALLBACK_SERVICES) as { name: string; short_description: string; icon?: typeof ShieldCheck; slug?: string }[];
  const aboutItems = items(about).length ? items(about) : FALLBACK_ABOUT_ITEMS;
  const faqs = data.faqs.length ? data.faqs : FALLBACK_FAQ;

  const iconFor = (name: string): typeof ShieldCheck => {
    const n = name.toLowerCase();
    if (n.includes("access") || n.includes("door")) return KeyRound;
    if (n.includes("network") || n.includes("cabling") || n.includes("poe")) return Network;
    if (n.includes("remote") || n.includes("monitor")) return MonitorSmartphone;
    if (n.includes("maintain") || n.includes("repair")) return Wrench;
    if (n.includes("consult") || n.includes("assess") || n.includes("design")) return ShieldCheck;
    return Cctv;
  };

  return (
    <PublicLayout>
      {/* ============ HERO ============ */}
      <section aria-label="Overview" className="border-b border-border bg-background">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {hero?.subtitle ?? "All systems operational"}
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              {hero?.title ?? "Security infrastructure, delivered as a platform"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {hero?.body ??
                "Design, installation, live monitoring and maintenance for CCTV, access controland network infrastructure — run like a product, not a project."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 bg-primary px-7 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link to="/request-service">{hero?.cta_label ?? "Get a Free Quote"}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-border px-7 text-foreground shadow-sm hover:bg-muted hover:text-foreground"
              >
                <Link to="/services">{hero?.cta2_label ?? "Explore Capabilities"}</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-8 sm:grid-cols-4">
              {heroStats.map((stat, index) => (
                <div key={index} className="min-w-0">
                  <dt className="text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</dt>
                  <dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label ?? stat.title}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <div className="overflow-hidden rounded-xl border border-border bg-slate-900 shadow-card" role="img" aria-label="Live security monitoring dashboard">
              {/* window chrome */}
              <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                </div>
                <div className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-slate-400 sm:flex">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  app.adsecurity.io/command
                </div>
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>

              {/* body */}
              <div className="grid grid-cols-5 gap-o">
                {/* feed grid */}
                <div className="col-span-3 grid grid-cols-2 gap-o border-r border-white/10">
                  {LIVE_FEEDS.map((feed) => (
                    <div
                      key={feed.name}
                      className={feed.status === "offline" ? "relative aspect-[4/3] opacity-50" : "relative aspect-[4/3]"}
                    >
                      <img
                        src={feed.image}
                        alt={`${feed.name} live feed`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-slate-950/70 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                        {feed.status === "live" ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-red-500" aria-hidden="true" />
                            LIVE
                          </>
                        ) : (
                          <span className="text-slate-300">OFFLINE</span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/70 px-2 py-1 text-[0.62rem] font-medium text-white">
                        {feed.name} <span className="text-slate-400">· {feed.location}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* side panel */}
                <div className="col-span-2 flex flex-col gap-o border-l border-white/10 bg-slate-950/40">
                  <div className="border-b border-white/10 px-3.5 py-2.5">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Devices</p>
                    <ul className="mt-2 space-y-1.5">
                      {DEVICES.map((device) => (
                        <li key={device.name} className="flex items-center justify-between gap-2 text-[0.68rem] text-slate-200">
                          <span className="truncate">{device.name}</span>
                          <span
                            className={
                              device.status === "online"
                                ? "inline-flex shrink-0 items-center gap-1 text-emerald-400"
                                : "inline-flex shrink-0 items-center gap-1 text-slate-500"
                            }
                          >
                            <span
                              className={
                                device.status === "online"
                                  ? "h-1 w-1 rounded-full bg-emerald-400"
                                  : "h-1 w-1 rounded-full bg-slate-500"
                              }
                            />
                            {device.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 px-3.5 py-2.5">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">Alerts</p>
                    <ul className="mt-2 space-y-2">
                      {ALERTS.map((alert) => (
                        <li key={alert.label} className="flex items-start gap-2 text-[0.68rem] text-slate-200">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-amber-400/80" aria-hidden="true" />
                          <span>
                            <span className="font-semibold text-slate-100">{alert.label}</span>
                            <span className="block text-slate-400">{alert.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* footer stats */}
              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-slate-950/60">
                {[
                  ["Uptime", "99.98%"],
                  ["Active feeds", "24"],
                  ["Recording", "24/7"],
                ].map(([label, value]) => (
                  <div key={label} className="px-3 py-2 text-center">
                    <p className="text-[0.8rem] font-bold text-white">{value}</p>
                    <p className="text-[0.6rem] font-medium uppercase tracking-wider text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CAPABILITIES ============ */}
      {services.length ? (
        <section id="services" aria-label="Capabilities" className="border-b border-border bg-surface">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow={servicesSection?.subtitle ?? "Capabilities"}
              title={servicesSection?.title ?? "What the platform covers"}
              subtitle={servicesSection?.body ?? "Six integrated disciplines, delivered by one accountable team."}
              action={
                <Button asChild variant="outline" className="border-border shadow-sm">
                  <Link to="/services">
                    All capabilities <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-12 overflow-hidden rounded-xl border border-border bg-background shadow-card">
              {services.map((service, index) => {
                const Icon = "icon" in service ? (service as { icon?: typeof ShieldCheck }).icon ?? Cctv : iconFor(service.name ?? "");
                const slug = "slug" in service ? (service as { slug?: string }).slug : undefined;
                const row = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-foreground">{service.name}</h3>
                      {service.short_description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {service.short_description}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </>
                );
                return slug ? (
                  <Link
                    key={`${index}-${slug}`}
                    to="/services/$slug"
                    params={{ slug }}
                    className={`group flex items-start gap-4 px-5 py-5 transition-colors duration-300 hover:bg-muted/60 sm:px-7 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    {row}
                  </Link>
                ) : (
                  <div
                    key={`${index}-row`}
                    className={`group flex items-start gap-4 px-5 py-5 transition-colors duration-300 hover:bg-muted/60 sm:px-7 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    {row}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ TRUST ============ */}
      <section aria-label="Trusted deployments" className="border-b border-border bg-slate-900 text-white">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow text-sky-400">Trusted deployments</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for sites that can't afford downtime
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-slate-300">
              Hotels, offices, logistics yards, retail corridors and campuses — monitoring the moments that matter, around the clock.

            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-10 sm:grid-cols-4">
            {[
              ["2,400+", "Cameras under management"],
              ["500+", "Installations completed"],
              ["12", "Service engineers"],
              ["98%", "Client satisfaction"],
            ].map(([value, label]) => (
              <div key={label} className="min-w-0">
                <dt className="text-2xl font-extrabold tracking-tight text-white">{value}</dt>
                <dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Serving teams at</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
              {CUSTOMER_LOGOS.map((name) => (
                <span key={name} className="text-sm font-bold tracking-tight text-slate-500">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2">
            {SERVICE_AREAS.map((area) => (
              <span
                key={area}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CREDENTIALS / ABOUT ============ */}
      <section id="about" aria-label="Company credentials" className="border-b border-border bg-background">
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-card">
              <img
                src="https://images.unsplash.com/photo-1495714096525-285e85481946?auto=format&fit=crop&w=1100&q=80"
                alt="Completed access control installation"
                loading="lazy"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="eyebrow text-primary">{about?.subtitle ?? "Credentials"}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {about?.title ?? "A team you can hand the keys to"}
            </h2>
            <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
              {about?.body ??
                "AD Security Camera Solution is a certified security integrator with engineers who design, install, configure and maintain enterprise systems as a single accountable partner."}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-8">
              {aboutItems.map((item, index) => (
                <div key={index} className="min-w-0">
                  <dt className="text-2xl font-extrabold tracking-tight text-primary">{item.value ?? item.title}</dt>
                  <dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label ?? item.description}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-primary px-6 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link to="/request-service">Book Installation</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 border-border shadow-sm">
                <Link to="/about">More About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      {data.products.length ? (
        <section aria-label="Featured products" className="border-b border-border bg-surface">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow={productsSection?.subtitle ?? "Equipment"}
              title={productsSection?.title ?? "Featured products"}
              subtitle={productsSection?.body ?? "The hardware we install, sell and support — current generation, warrantiedand backed by our team."}
              action={
                <Button asChild variant="outline" className="border-border shadow-sm">
                  <Link to="/products">
                    View all <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(data.products as unknown as ProductWithCategory[]).slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ CONTACT ============ */}
      <section id="contact" aria-label="Contact" className="border-b border-border bg-surface">
        <div className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow text-primary">Contact</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Talk to an engineer, not a call center
            </h2>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
              Whether it's a survey, a quote or a fault, you'll reach someone who can actually fix it.

            </p>
            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Mail className="h-4 w-4 text-primary" />
                {contact.email}
              </a>
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  {contact.phone}
                </a>
              ) : null}
              {contact.address ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {contact.address}
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="eyebrow text-primary">Social</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Follow the installs</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex flex-col gap-1 rounded-lg border border-border bg-background px-4 py-4 transition-colors duration-300 hover:border-primary hover:shadow-card"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{social.platform}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </span>
                  <span className="text-sm text-muted-foreground">{social.handle}</span>
                </a>
              ))}
            </div>
            <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Planning an installation?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book a free site survey — we'll map coverage, storage and access control, then quote.

                </p>
              </div>
              <Button asChild size="lg" className="h-12 shrink-0 bg-primary px-6 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link to="/request-service">Book Installation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      {faqs.length ? (
        <section id="faq" aria-label="FAQ" className="bg-background">
          <div className="container-page pb-16 sm:pb-24">
            <SectionHeading
              eyebrow={faqSection?.subtitle ?? "Support"}
              title={faqSection?.title ?? "Frequently asked questions"}
              subtitle={faqSection?.body ?? "Straight answers about equipment, coverage, service plans and quotes."}
              align="center"
            />
            <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl divide-y divide-border rounded-xl border border-border bg-card shadow-card">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={String(index)} className="px-6">
                  <AccordionTrigger className="text-left text-[0.95rem] font-semibold text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      ) : null}

      {/* ============ FINAL CTA ============ */}
      <section aria-label="Get started" className="bg-primary">
        <div className="container-page flex flex-col items-start justify-between gap-8 py-16 sm:py-20 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {cta?.title ?? "Ready to improve your security?"}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-white/85">
              {cta?.body ?? "Get a free site survey, a clear itemized quote, and a system your team can trust."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 bg-white px-7 text-primary shadow-sm hover:bg-white/90">
              <Link to="/request-service">{cta?.cta_label ?? "Get a Free Quote"}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}