import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Cctv,
  Headphones,
  KeyRound,
  Network,
  Quote,
  Radar,
  ShieldCheck,
  ShoppingCart,
  Star,
  Wrench,
} from "lucide-react";
import { getHomepage } from "@/lib/public.functions";
import { PublicLayout } from "@/components/site/PublicLayout";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ProductCard, type ProductWithCategory } from "@/components/site/ProductCard";
import { MediaImage } from "@/components/site/Media";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const homeQuery = queryOptions({ queryKey: ["homepage"], queryFn: () => getHomepage() });

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "AD Security Camera Solution | Professional CCTV & Security Systems" },
      {
        name: "description",
        content:
          "AD Security Camera Solution provides professional CCTV installation, surveillance, access control, networking, maintenance, and security solutions for homes and businesses.",
      },
      { property: "og:title", content: "AD Security Camera Solution | Professional CCTV & Security Systems" },
      {
        property: "og:description",
        content:
          "Professional CCTV installation, surveillance, access control, networking, maintenance, and security solutions for homes and businesses.",
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

type Item = { title?: string; description?: string; icon?: string; value?: string; label?: string };

const ICONS: Record<string, typeof ShieldCheck> = {
  shield: ShieldCheck,
  wrench: Wrench,
  clock: Clock,
  support: Headphones,
  badge: BadgeCheck,
  cctv: Cctv,
  radar: Radar,
  network: Network,
  key: KeyRound,
};

const FALLBACK_HERO_ITEMS: Item[] = [
  { value: "Professional", label: "Installation" },
  { value: "24/7", label: "Surveillance Solutions" },
  { value: "Reliable", label: "Security Technology" },
  { value: "Fast", label: "Support" },
];

const FALLBACK_SERVICES: { name: string; short_description: string; icon: typeof ShieldCheck }[] = [
  { name: "CCTV Camera Installation", short_description: "Professional installation and configuration of surveillance cameras for homes, offices and commercial properties.", icon: Cctv },
  { name: "Security Camera Systems", short_description: "Modern surveillance solutions designed around your premises and monitoring needs.", icon: Camera },
  { name: "Access Control", short_description: "Secure entry systems designed to control and monitor who gets in — and who doesn't.", icon: KeyRound },
  { name: "Networking Solutions", short_description: "Reliable networking infrastructure for security systems and connected devices.", icon: Network },
  { name: "Maintenance & Support", short_description: "Troubleshooting, maintenance, upgrades, and ongoing technical support.", icon: Wrench },
  { name: "Remote Monitoring", short_description: "Solutions that let you keep an eye on your property remotely, where supported.", icon: Radar },
];

const FALLBACK_PROCESS: Item[] = [
  { title: "Consultation", description: "Understand your property and security requirements." },
  { title: "Site Assessment", description: "Identify coverage areas, risks, and the right equipment for the job." },
  { title: "Professional Installation", description: "Install and configure the security system correctly, first time." },
  { title: "Support & Maintenance", description: "Provide ongoing assistance and system maintenance after install." },
];

const FALLBACK_WHY: Item[] = [
  { title: "Professional Installation", description: "Certified, careful installation by security technicians." },
  { title: "Quality Equipment", description: "Dependable surveillance technology built to last." },
  { title: "Customized Solutions", description: "Systems designed around your property, risks and budget." },
  { title: "Reliable Technical Support", description: "Help when you need it, before and after the installation." },
  { title: "Modern Technology", description: "Current-generation cameras, recording,and remote access." },
  { title: "Customer-Focused Service", description: "Clear communication, honest advice,and practical solutions." },
];

const FALLBACK_FAQ: { question: string; answer: string }[] = [
  { question: "What type of CCTV system do I need?", answer: "It depends on your property, coverage goals and budget. We assess the site and recommend the right cameras, resolution and recording setup." },
  { question: "Do you install security cameras?", answer: "Yes. We professionally install and configure CCTV and security systems for homes, offices, shops and commercial premises." },
  { question: "Can I monitor my cameras remotely?", answer: "Where supported, yes. Many modern systems offer remote viewing from your phone or tablet." },
  { question: "Can you install systems for businesses?", answer: "Absolutely. We provide surveillance, access control, networking and maintenance solutions tailored to commercial sites." },
  { question: "Do you provide maintenance and technical support?", answer: "Yes. We offer troubleshooting, maintenance, upgrades and ongoing support to keep your system working." },
  { question: "Can you upgrade an existing CCTV system?", answer: "Often yes. We can extend, replace or modernize an existing system — contact us for an assessment." },
  { question: "How can I request a quote?", answer: "Use the “Request a free survey” button anywhere on the site or head to the contact page and we'll get back to you." },
];

const FALLBACK_TRUST: Item[] = [
  { icon: "badge", title: "Professional Installation", description: "Expert setup, every time" },
  { icon: "clock", title: "24/7 Surveillance Solutions", description: "Around-the-clock coverage" },
  { icon: "shield", title: "Reliable Security Technology", description: "Dependable equipment" },
  { icon: "support", title: "Customer-Focused Support", description: "We're here when you need us" },
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const sections = (data.sections ?? []) as unknown as SectionRow[];
  const find = (key: string) => sections.find((s) => s.key === key);
  const items = (section?: SectionRow): Item[] =>
    Array.isArray(section?.items) ? (section!.items as Item[]) : [];

  const hero = find("hero");
  const trust = find("trust") ?? find("trust_points");
  const servicesSection = find("services");
  const productsSection = find("featured_products") ?? find("products");
  const installation = find("installation");
  const why = find("why_us") ?? find("why_choose_us");
  const process = find("process") ?? find("how_it_works");
  const cta = find("cta") ?? find("final_cta");

  const heroStats = items(hero).length ? items(hero) : FALLBACK_HERO_ITEMS;

  const trustPoints = items(trust).length ? items(trust) : FALLBACK_TRUST;
  const services = data.services.length ? data.services : FALLBACK_SERVICES;

  const processSteps = items(process).length ? items(process) : FALLBACK_PROCESS;
  const whyPoints = items(why).length ? items(why) : FALLBACK_WHY;
  const faqs = data.faqs.length ? data.faqs : FALLBACK_FAQ;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface text-surface-foreground">
        <div className="hero-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface/95 to-background/80" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
        <div className="relative container-page grid min-h-[calc(100svh-8rem)] items-center gap-12 py-16 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-sm border border-accent/30 bg-accent/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-accent">
              <Radar className="h-3.5 w-3.5" />
              {hero?.subtitle ?? "Professional Security Solutions"}
            </div>
            <h1 className="text-shadow-hero mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[3.6rem]">
              {hero?.title ?? "Protect What Matters Most"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-surface-foreground/80">
              {hero?.body ??
                "Advanced CCTV and security solutions designed to keep your home, business,and property safe — with professional installation, surveillance, access control, networking, maintenance,and ongoing support."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="security-glow bg-accent text-accent-foreground transition-all hover:bg-accent/90 hover:-translate-y-0.5">
                <Link to="/request-service">{hero?.cta_label ?? "Get a Free Quote"}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-surface-foreground/25 bg-transparent text-surface-foreground hover:border-accent hover:bg-accent/10 hover:text-accent"
              >
                <Link to="/services">{hero?.cta2_label ?? "Explore Our Services"}</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {heroStats.map((stat, index) => (
                <div key={index} className="flex flex-col">
                  <span className="font-display text-2xl font-extrabold text-accent">{stat.value}</span>
                  <span className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-surface-foreground/60">
                    {stat.label ?? stat.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="relative mx-auto aspect-square w-full max-w-md rounded-sm border border-surface-foreground/15 bg-background/40 p-3 backdrop-blur-sm">
              <div className="hero-grid absolute inset-3 rounded-sm opacity-40" />
              <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 rounded-sm border border-accent/40 bg-gradient-to-br from-accent/15 to-transparent p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/50 bg-accent/15 p-5 text-accent">
                  <Cctv className="h-10 w-10" strokeWidth={1.25} />
                </div>
                <p className="font-display text-xl font-bold uppercase tracking-[0.12em]">Active Protection</p>
                <p className="max-w-[16rem] text-sm leading-relaxed text-surface-foreground/70">
                  Cameras, access control, networking and monitoring — one integrated security layer for your property.

                </p>
                <div className="flex gap-3">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent" />
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / stats band */}
      {trustPoints.length ? (
        <section className="border-y border-border bg-card">
          <div className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point, index) => {
              const Icon = ICONS[point.icon ?? ""] ?? BadgeCheck;
              return (
                <div key={index} className="group flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-accent/25 bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{point.title}</p>
                    {point.description ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* About / installation */}
      {installation ? (
        <section className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <MediaImage
              src={installation.image_url}
              alt={installation.title ?? "Professional security installation"}
              className="aspect-[4/3] w-full rounded-sm border border-border"
              imgClassName="transition-transform duration-500 hover:scale-[1.02]"
            />
            <div className="absolute -bottom-5 -right-5 hidden rounded-sm border border-accent/40 bg-background p-4 shadow-2xl sm:block">
              <ShieldCheck className="h-7 w-7 text-accent" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow text-accent">{installation.subtitle ?? "About AD Security"}</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {installation.title ?? "Security You Can Count On"}
            </h2>
            <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
              {installation.body ??
                "AD Security Camera Solution provides professional security camera installation, surveillance, access control, networking, maintenance,and related security technology — customized for homes,businesses,and long-term peace of mind."}
            </p>
            {items(installation).length ? (
              <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                {items(installation).slice(0, 4).map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                    <div>
                      <p className="font-semibold">{point.title}</p>
                      {point.description ? (
                        <p className="text-muted-foreground">{point.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Professional Installation", description: "Expert setup and configuration" },
                  { title: "Quality Equipment", description: "Dependable, current-generation technology" },
                  { title: "Customized Solutions", description: "Designed around your property" },
                  { title: "Ongoing Support", description: "Help after the installation, too" },
                ].map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                    <div>
                      <p className="font-semibold">{point.title}</p>
                      <p className="text-muted-foreground">{point.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/request-service">{installation.cta_label ?? "Request a free survey"}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/about">More about us</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="hero-grid flex aspect-[4/3] w-full items-center justify-center rounded-sm border border-border bg-card">
              <div className="text-center">
                <Cctv className="mx-auto h-14 w-14 text-accent" strokeWidth={1.25} />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Professional Installation
                </p>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-5 hidden rounded-sm border border-accent/40 bg-background p-4 shadow-2xl sm:block">
              <ShieldCheck className="h-7 w-7 text-accent" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow text-accent">About AD Security</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Security You Can Count On</h2>
            <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
              AD Security Camera Solution provides professional security camera installation, surveillance,
              access control, networking, maintenance,and related security technology — customized for homes
              and businesses,and built for long-term peace of mind.

            </p>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                { title: "Professional Installation", description: "Expert setup and configuration" },
                { title: "Quality Equipment", description: "Dependable, current-generation technology" },
                { title: "Customized Solutions", description: "Designed around your property and risks" },
                { title: "Ongoing Support", description: "Help after the installation, too" },
              ].map((point, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent" />
                  <div>
                    <p className="font-semibold">{point.title}</p>
                    <p className="text-muted-foreground">{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/request-service">Request a free survey</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/about">More about us</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length ? (
        <section className="bg-card">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow={servicesSection?.subtitle ?? "What we do"}
              title={servicesSection?.title ?? "Our Security Solutions"}
              subtitle={servicesSection?.body ?? "Complete security solutions designed around your needs."}
              action={
                <Button asChild variant="outline">
                  <Link to="/services">
                    All services <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => {
                const Icon = "icon" in service ? (service as { icon?: typeof ShieldCheck }).icon ?? Wrench : Wrench;
                const slug = "slug" in service ? (service as { slug?: string }).slug : undefined;
                return slug ? (
                  <Link
                    key={index}
                    to="/services/$slug"
                    params={{ slug }}
                    className="group flex flex-col border border-border bg-background p-7 transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{service.name}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {service.short_description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-accent">
                      Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ) : (
                  <div key={index} className="group flex flex-col border border-border bg-background p-7 transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{service.name}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {service.short_description}
                    </p>
                    <Button asChild variant="ghost" className="mt-5 self-start px-0 text-accent hover:bg-transparent">
                      <Link to="/request-service">
                        Enquire <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured products */}
      {data.products.length ? (
        <section className="container-page py-16 sm:py-24">
          <SectionHeading
            eyebrow={productsSection?.subtitle ?? "Equipment"}
            title={productsSection?.title ?? "Featured products"}
            subtitle={productsSection?.body}
            action={
              <Button asChild variant="outline">
                <Link to="/products">
                  Shop all <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(data.products as unknown as ProductWithCategory[]).slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Process */}
      {processSteps.length ? (
        <section className="border-y border-border bg-card">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow={process?.subtitle ?? "Process"}
              title={process?.title ?? "How We Secure Your Property"}
              subtitle={process?.body ?? "A clear, professional path from your first call to a fully operational system."}
              align="center"
            />
            <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step, index) => (
                <li key={index} className="relative border-t-2 border-accent pt-6">
                  <span className="absolute -top-3 left-0 font-display text-sm font-extrabold tracking-widest text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Why choose us */}
      {whyPoints.length ? (
        <section className="relative overflow-hidden bg-surface text-surface-foreground">
          <div className="hero-grid absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="relative container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow text-accent">{why?.subtitle ?? "Why choose us"}</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                {why?.title ?? "Why Choose AD Security Camera Solution?"}
              </h2>
              <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-surface-foreground/70">
                {why?.body ??
                  "We combine professional installation, dependable equipment, modern technology,and straightforward customer service — so your security system actually works when it matters."}
              </p>
              <div className="mt-8 hidden lg:block">
                <MediaImage
                  src={why?.image_url}
                  alt="Security technology"
                  className="aspect-[4/3] w-full max-w-md rounded-sm border border-surface-foreground/15"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
              {whyPoints.map((point, index) => {
                const Icon = ICONS[point.icon ?? ""] ?? ShieldCheck;
                return (
                  <div
                    key={index}
                    className="rounded-sm border border-surface-foreground/15 bg-background/50 p-6 backdrop-blur-sm transition-colors hover:border-accent/50"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-accent/15 text-accent">
                      <Icon className="h-5.5 w-5.5" />
                    </span>
                    <h3 className="mt-4 text-base font-bold">{point.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-surface-foreground/70">{point.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Testimonials */}
      {data.testimonials.length ? (
        <section className="container-page py-16 sm:py-24">
          <SectionHeading eyebrow="Clients" title="What Our Customers Say" align="center" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col border border-border bg-card p-7">
                <Quote className="h-5 w-5 text-accent" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t.content}
                </blockquote>
                <div className="mt-5 flex items-center gap-1 text-accent">
                  {Array.from({ length: t.rating }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <figcaption className="mt-3 text-sm font-semibold">
                  {t.customer_name}
                  {t.company ? <span className="text-muted-foreground"> · {t.company}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      {data.gallery.length ? (
        <section className="bg-card">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow="Our work"
              title="Recent installations"
              action={
                <Button asChild variant="outline">
                  <Link to="/gallery">
                    View gallery <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.gallery.map((item) => (
                <figure key={item.id} className="group overflow-hidden border border-border bg-background">
                  <MediaImage
                    src={item.image_url}
                    alt={item.title}
                    className="aspect-[4/3] w-full"
                    imgClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                  <figcaption className="p-4 text-sm font-semibold">{item.title}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {faqs.length ? (
        <section className="container-page pb-16 sm:pb-24">
          <SectionHeading eyebrow="Questions" title="Frequently Asked Questions" align="center" />
          <Accordion type="single" collapsible className="mx-auto mt-10 max-w-3xl border-t border-border">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={String(index)}>
                <AccordionTrigger className="text-left text-[0.95rem] font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/faq">See all FAQs</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-accent text-accent-foreground">
        <div className="hero-grid absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative container-page flex flex-col items-start justify-between gap-8 py-16 sm:py-20 lg:flex-row lg:items-center">
          <div>
            <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">
              {cta?.title ?? "Ready to Improve Your Security?"}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-accent-foreground/85">
              {cta?.body ?? "Let's find the right security solution for your home or business."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="shadow-lg">
              <Link to="/request-service">{cta?.cta_label ?? "Get a Free Quote"}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-accent-foreground/40 bg-transparent text-accent-foreground hover:bg-accent-foreground/10"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

