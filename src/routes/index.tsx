import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Cctv,
  Clock,
  Headphones,
  KeyRound,
  Network,
  ShieldCheck,
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
          "AD Security Camera Solution provides professional CCTV installation, surveillance, access control, networking, maintenance, and remote monitoring for homes and businesses.",
      },
      { property: "og:title", content: "AD Security Camera Solution | Professional CCTV & Security Systems" },
      {
        property: "og:description",
        content:
          "Professional CCTV installation, surveillance, access control, networking, maintenance, and remote monitoring solutions for homes and businesses.",
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
  camera: Camera,
  network: Network,
  key: KeyRound,
};

const IMG_HERO = "https://images.unsplash.com/photo-1589935447067-5531094415d1?auto=format&fit=crop&w=1400&q=80";
const IMG_ABOUT = "https://images.unsplash.com/photo-1496368077930-c1e31b4e5b44?auto=format&fit=crop&w=1200&q=80";
const IMG_PROJECTS = [
  { title: "CCTV Installation", image: "https://images.unsplash.com/photo-1549109926-58f039549485?auto=format&fit=crop&w=1000&q=80" },
  { title: "Access Control Systems", image: "https://images.unsplash.com/photo-1495714096525-285e85481946?auto=format&fit=crop&w=1000&q=80" },
  { title: "Monitoring Room", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1000&q=80" },
  { title: "Commercial Projects", image: "https://images.unsplash.com/photo-1618482914248-29272d021005?auto=format&fit=crop&w=1000&q=80" },
  { title: "Dome Surveillance", image: "https://images.unsplash.com/photo-1563920443079-783e5c786b83?auto=format&fit=crop&w=1000&q=80" },
  { title: "Site Hardening", image: "https://images.unsplash.com/photo-1528312635006-8ea0bc49ec63?auto=format&fit=crop&w=1000&q=80" },
];

const FALLBACK_HERO_ITEMS: Item[] = [
  { value: "500+", label: "Installations" },
  { value: "24/7", label: "Monitoring" },
  { value: "15+", label: "Years Experience" },
  { value: "98%", label: "Client Satisfaction" },
];

const FALLBACK_SERVICES: { name: string; short_description: string; icon: typeof ShieldCheck }[] = [
  { name: "CCTV Installation", short_description: "Professional installation and configuration of surveillance cameras for homes, offices,and commercial properties.", icon: Cctv },
  { name: "Security Camera Systems", short_description: "Modern surveillance solutions designed around your premises and monitoring needs.", icon: Camera },
  { name: "Access Control", short_description: "Secure entry systems designed to control and monitor who gets in — and who doesn't.", icon: KeyRound },
  { name: "Networking Solutions", short_description: "Reliable networking infrastructure for security systems, cameras,and connected devices.", icon: Network },
  { name: "Maintenance & Support", short_description: "Preventive maintenance, troubleshooting, upgrades,and ongoing technical support.", icon: Wrench },
  { name: "Remote Monitoring", short_description: "24/7 remote viewing and monitoring solutions that keep your property covered.", icon: Headphones },
];

const FALLBACK_ABOUT: { title: string; description: string }[] = [
  { title: "15+ Years Experience", description: "Established security integrator with a proven track record" },
  { title: "Certified Engineers", description: "Factory-trained technicians who install systems correctly" },
  { title: "Quality Equipment", description: "Dependable, current-generation cameras,and recording hardware" },
  { title: "Ongoing Support", description: "Maintenance contracts,and responsive help after installation" },
];

const FALLBACK_FAQ: { question: string; answer: string }[] = [
  { question: "What type of CCTV system do I need?", answer: "It depends on your property, coverage goals, and budget. We assess the site and recommend the right cameras, resolution,and recording setup." },
  { question: "Do you install security cameras?", answer: "Yes. We professionally install,and configure CCTV,and security systems for homes, offices, shops,and commercial premises." },
  { question: "Can I monitor my cameras remotely?", answer: "Where supported, yes. Most modern systems offer secure remote viewing from your phone or tablet, anywhere in the world." },
  { question: "Can you install systems for businesses?", answer: "Absolutely. We provide surveillance, access control, networking,and maintenance solutions tailored to commercial sites." },
  { question: "Do you provide maintenance,and technical support?", answer: "Yes. We offer preventive maintenance, troubleshooting, upgrades,and ongoing support to keep your system working." },
  { question: "Can you upgrade an existing CCTV system?", answer: "Often yes. We can extend, replace, or modernize an existing system — contact us for an assessment." },
  { question: "How can I request a quote?", answer: "Use the “Get a Free Quote” button anywhere on the site or head to the contact page and we'll get back to you." },
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const sections = (data.sections ?? []) as unknown as SectionRow[];
  const find = (key: string) => sections.find((s) => s.key === key);

  const items = (section?: SectionRow): Item[] =>
    Array.isArray(section?.items) ? (section!.items as Item[]) : [];

  const hero = find("hero");
  const about = find("installation") ?? find("about");
  const servicesSection = find("services");
  const productsSection = find("featured_products") ?? find("products");
  const projects = find("projects") ?? find("gallery");
  const faqSection = find("faq");
  const cta = find("cta") ?? find("final_cta");

  const heroStats = items(hero).length ? items(hero) : FALLBACK_HERO_ITEMS;

  const services = data.services.length ? data.services : FALLBACK_SERVICES;

  const aboutPoints = items(about).length ? items(about) : FALLBACK_ABOUT;

const galleryItems = data.gallery.length ? data.gallery : null;
  const faqs = data.faqs.length ? data.faqs : FALLBACK_FAQ;

  return (
    <PublicLayout>
      {/* ============ HERO ============ */}
      <section className="border-b border-border bg-background">
        <div className="container-page grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              {hero?.subtitle ?? "Professional Security Solutions"}
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              {hero?.title ?? "Complete Security Solutions for Your Home & Business"}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {hero?.body ??
                "We design, install,and service enterprise-grade CCTV, access control,and remote monitoring systems — delivered by certified technicians with 15+ years of hands-on experience."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-primary px-7 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link to="/request-service">{hero?.cta_label ?? "Get a Free Quote"}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border px-7 text-foreground shadow-sm hover:bg-muted hover:text-foreground"
              >
                <Link to="/services">{hero?.cta2_label ?? "Explore Our Services"}</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4">
              {heroStats.map((stat, index) => (
                <div key={index}>
                  <dt className="order-first text-2xl font-extrabold tracking-tight text-primary">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label ?? stat.title}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative overflow-hidden rounded-xl border border-border shadow-card">
              <MediaImage
                src={hero?.image_url ?? IMG_HERO}
                alt="Professional security camera installation"
                className="aspect-[4/3] w-full"
                imgClassName="transition-transform duration-700 hover:scale-105"
                loading="eager"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/70 to-transparent px-6 pb-6 pt-16">
                <p className="text-base font-semibold text-white">24/7 Enterprise Monitoring</p>
                <p className="mt-0.5 text-sm text-white/70">Live feeds, cloud storage,and instant alerts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      {services.length ? (
        <section id="services" className="bg-surface">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow={servicesSection?.subtitle ?? "What We Do"}
              title={servicesSection?.title ?? "Our Security Solutions"}
              subtitle={servicesSection?.body ?? "End-to-end security services designed around your property, risks,and budget."}
              action={
                <Button asChild variant="outline" className="border-border shadow-sm">
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
                const content = (
                  <>
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-foreground">{service.name}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {service.short_description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </>
                );
                return slug ? (
                  <Link
                    key={index}
                    to="/services/$slug"
                    params={{ slug }}
                    className="group flex flex-col rounded-xl border border-border bg-background p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={index}
                    className="group flex flex-col rounded-xl border border-border bg-background p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ ABOUT ============ */}
      <section id="about" className="border-b border-border bg-background">
        <div className="container-page grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl border border-border shadow-card">
              <MediaImage
                src={about?.image_url ?? IMG_ABOUT}
                alt={about?.title ?? "Professional security installation team"}
                className="aspect-[4/3] w-full"
                imgClassName="transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow text-primary">{about?.subtitle ?? "About AD Security"}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {about?.title ?? "Security You Can Count On"}
            </h2>
            <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
              {about?.body ??
                "AD Security Camera Solution provides professional security camera installation, surveillance, access control, networking,and remote monitoring — customized for homes,businesses,and long-term peace of mind."}
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {aboutPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{point.title}</p>
                    {point.description ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="bg-primary px-6 text-primary-foreground shadow-sm hover:bg-primary/90">
                <Link to="/request-service">Request a Free Survey</Link>
              </Button>
              <Button asChild variant="outline" className="border-border shadow-sm">
                <Link to="/about">More About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROJECTS ============ */}
      <section id="projects" className="bg-surface">
        <div className="container-page py-16 sm:py-24">
          <SectionHeading
            eyebrow={projects?.subtitle ?? "Our Work"}
            title={projects?.title ?? "Recent Security Projects"}
            subtitle={projects?.body ?? "CCTV installations, access control systems,and monitoring rooms delivered for homes,and commercial clients."}
            action={
              <Button asChild variant="outline" className="border-border shadow-sm">
                <Link to="/gallery">
                  View full gallery <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(galleryItems ?? IMG_PROJECTS).map((item, index) => {
              const image = "image_url" in item && item.image_url ? item.image_url : item.image;
              const title = "title" in item ? item.title : "";
              return (
                <figure key={index} className="group overflow-hidden rounded-xl border border-border bg-background shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      {data.products.length ? (
        <section className="border-b border-border bg-background">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading
              eyebrow={productsSection?.subtitle ?? "Equipment"}
              title={productsSection?.title ?? "Featured Products"}
              subtitle={productsSection?.body ?? "Browse the security hardware we install,sell,and support."}
              action={
                <Button asChild variant="outline" className="border-border shadow-sm">
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
          </div>
        </section>
      ) : null}

      {/* ============ FAQ ============ */}
      {faqs.length ? (
        <section id="faq" className="bg-background">
          <div className="container-page pb-16 sm:pb-24">
            <SectionHeading
              eyebrow={faqSection?.subtitle ?? "Support"}
              title={faqSection?.title ?? "Frequently Asked Questions"}
              subtitle={faqSection?.body ?? "Answers to the questions we hear most often."}
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
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" className="border-border shadow-sm">
                <Link to="/faq">See All FAQs</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ FINAL CTA ============ */}
      <section className="bg-primary">
        <div className="container-page flex flex-col items-start justify-between gap-8 py-16 sm:py-20 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {cta?.title ?? "Ready to Improve Your Security?"}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-white/85">
              {cta?.body ?? "Let's find the right security solution for your home or business. Get a free site survey and a clear, itemized quote."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-white px-7 text-primary shadow-sm hover:bg-white/90">
              <Link to="/request-service">{cta?.cta_label ?? "Get a Free Quote"}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
