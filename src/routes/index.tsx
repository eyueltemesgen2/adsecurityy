import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Headphones,
  Quote,
  ShieldCheck,
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
      { title: "AD Security Camera Solution — CCTV, Access Control & IT Services" },
      {
        name: "description",
        content:
          "Security camera sales, professional installation, access control, time attendance, networking and IT solutions. Request a survey today.",
      },
      { property: "og:title", content: "AD Security Camera Solution — Security & Technology Experts" },
      {
        property: "og:description",
        content: "Buy security equipment and book expert installation, maintenance and networking services.",
      },
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
};

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

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface text-surface-foreground">
        <div className="absolute inset-0 opacity-25">
          <MediaImage src={hero?.image_url} alt="" className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/95 to-transparent" />
        <div className="relative container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 animate-slide-up">
            <p className="eyebrow text-accent">{hero?.subtitle ?? "Security & Technology Solutions"}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              {hero?.title ?? "Protect what matters with professionally installed security systems"}
            </h1>
            {hero?.body ? (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-surface-foreground/80">{hero.body}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-transform hover:scale-[1.02]">
                <Link to="/request-service">{hero?.cta_label ?? "Request a free survey"}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-surface-foreground/30 bg-transparent text-surface-foreground hover:bg-surface-foreground/10"
              >
                <Link to="/products">{hero?.cta2_label ?? "Shop equipment"}</Link>
              </Button>
            </div>
          </div>
          {items(hero).length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
              {items(hero)
                .slice(0, 4)
                .map((item, index) => (
                  <div
                    key={index}
                    className="rounded-sm border border-surface-foreground/15 bg-surface-foreground/5 p-4"
                  >
                    <p className="font-display text-2xl font-bold text-accent">{item.value ?? item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-surface-foreground/70">
                      {item.label ?? item.description}
                    </p>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Trust points */}
      {items(trust).length ? (
        <section className="border-b border-border bg-card">
          <div className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {items(trust).map((item, index) => {
              const Icon = ICONS[item.icon ?? ""] ?? BadgeCheck;
              return (
                <div key={index} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Services */}
      {data.services.length ? (
        <section className="container-page py-16 sm:py-20">
          <SectionHeading
            eyebrow={servicesSection?.subtitle ?? "What we do"}
            title={servicesSection?.title ?? "Our services"}
            subtitle={servicesSection?.body}
            action={
              <Button asChild variant="outline">
                <Link to="/services">
                  All services <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((service) => (
              <Link
                key={service.id}
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="group flex flex-col border border-border bg-card p-6 transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary text-accent transition-transform duration-300 group-hover:scale-110">
                  <Wrench className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{service.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{service.short_description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-accent">
                  Learn more <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured products */}
      {data.products.length ? (
        <section className="bg-secondary/50 py-16 sm:py-20">
          <div className="container-page">
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
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(data.products as unknown as ProductWithCategory[]).slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Installation */}
      {installation ? (
        <section className="container-page grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <MediaImage
            src={installation.image_url}
            alt={installation.title ?? "Installation"}
            className="aspect-[4/3] w-full rounded-sm"
          />
          <div>
            <p className="eyebrow text-accent">{installation.subtitle ?? "Installation"}</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{installation.title}</h2>
            {installation.body ? (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">{installation.body}</p>
            ) : null}
            {items(installation).length ? (
              <ul className="mt-6 space-y-3">
                {items(installation).map((item, index) => (
                  <li key={index} className="flex gap-2.5 text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>
                      <span className="font-semibold">{item.title}</span>
                      {item.description ? (
                        <span className="text-muted-foreground"> — {item.description}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/request-service">{installation.cta_label ?? "Book an installation"}</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* Why us */}
      {items(why).length ? (
        <section className="bg-surface py-16 text-surface-foreground sm:py-20">
          <div className="container-page">
            <SectionHeading
              eyebrow={why?.subtitle ?? "Why choose us"}
              title={why?.title ?? "Built on expertise and accountability"}
              subtitle={why?.body}
              align="center"
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items(why).map((item, index) => (
                <div key={index} className="rounded-sm border border-surface-foreground/15 bg-surface-foreground/5 p-6">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-surface-foreground/75">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Process */}
      {items(process).length ? (
        <section className="container-page py-16 sm:py-20">
          <SectionHeading
            eyebrow={process?.subtitle ?? "Process"}
            title={process?.title ?? "How it works"}
            subtitle={process?.body}
          />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items(process).map((item, index) => (
              <li key={index} className="border-t-2 border-accent pt-4">
                <span className="font-display text-sm font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Testimonials */}
      {data.testimonials.length ? (
        <section className="bg-secondary/50 py-16 sm:py-20">
          <div className="container-page">
            <SectionHeading eyebrow="Clients" title="What our customers say" align="center" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.testimonials.map((t) => (
                <figure key={t.id} className="flex flex-col border border-border bg-card p-6">
                  <Quote className="h-5 w-5 text-accent" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t.content}
                  </blockquote>
                  <div className="mt-4 flex items-center gap-1 text-accent">
                    {Array.from({ length: t.rating }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <figcaption className="mt-2 text-sm font-semibold">
                    {t.customer_name}
                    {t.company ? <span className="text-muted-foreground"> · {t.company}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      {data.gallery.length ? (
        <section className="container-page py-16 sm:py-20">
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
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.gallery.map((item) => (
              <figure key={item.id} className="group overflow-hidden border border-border bg-card">
                <MediaImage
                  src={item.image_url}
                  alt={item.title}
                  className="aspect-[4/3] w-full"
                  imgClassName="transition-transform duration-300 group-hover:scale-105"
                />
                <figcaption className="p-4 text-sm font-semibold">{item.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {data.faqs.length ? (
        <section className="container-page pb-16 sm:pb-20">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
          <Accordion type="single" collapsible className="mt-8 border-t border-border">
            {data.faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left text-[0.95rem] font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/faq">See all FAQs</Link>
          </Button>
        </section>
      ) : null}

      {/* Final CTA */}
      <section className="bg-accent text-accent-foreground">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{cta?.title ?? "Ready to secure your property?"}</h2>
            <p className="mt-2 max-w-2xl text-sm text-accent-foreground/85">
              {cta?.body ?? "Tell us about your site and our engineers will design the right system for you."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/request-service">{cta?.cta_label ?? "Request service"}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-accent-foreground/40 bg-transparent text-accent-foreground hover:bg-accent-foreground/10"
            >
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
