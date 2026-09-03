import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { getService } from "@/lib/public.functions";
import { PublicLayout } from "@/components/site/PublicLayout";
import { MediaImage } from "@/components/site/Media";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/db-types";

const serviceQuery = (slug: string) =>
  queryOptions({ queryKey: ["service", slug], queryFn: () => getService({ data: { slug } }) });

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(serviceQuery(params.slug));
    if (!data.service) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.service) {
      return { meta: [{ title: "Service unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const service = loaderData.service;
    const title = service.seo_title || `${service.name} — AD Security Camera Solution`;
    const description =
      service.seo_description || service.short_description || `Professional ${service.name} services.`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ];
    if (service.image_url?.startsWith("https://")) {
      meta.push({ property: "og:image", content: service.image_url });
      meta.push({ name: "twitter:image", content: service.image_url });
    }
    return { meta };
  },
  component: ServiceDetail,
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(serviceQuery(slug));
  const service = data.service!;
  const features = Array.isArray(service.features) ? (service.features as string[]) : [];

  return (
    <PublicLayout>
      <section className="border-b border-border bg-surface text-surface-foreground">
        <div className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <nav className="text-xs text-surface-foreground/60">
              <Link to="/services" className="hover:text-accent">
                Services
              </Link>
              <span className="px-1.5">/</span>
              <span>{service.name}</span>
            </nav>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{service.name}</h1>
            {service.short_description ? (
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-surface-foreground/80">
                {service.short_description}
              </p>
            ) : null}
            {service.starting_price ? (
              <p className="mt-5 text-sm font-semibold text-accent">
                Starting from ETB {formatPrice(service.starting_price)}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/request-service" search={{ service: service.slug }}>
                  Request this service
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-surface-foreground/30 bg-transparent text-surface-foreground hover:bg-surface-foreground/10"
              >
                <Link to="/contact">Ask a question</Link>
              </Button>
            </div>
          </div>
          <MediaImage src={service.image_url} alt={service.name} className="aspect-[4/3] w-full rounded-sm" />
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="max-w-3xl whitespace-pre-line text-[0.95rem] leading-relaxed text-muted-foreground">
            {service.description || service.short_description}
          </div>
          {features.length ? (
            <div className="mt-10">
              <h2 className="text-lg font-bold">What's included</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2 border border-border bg-card p-4 text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="h-fit border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide">Other services</h2>
          <ul className="mt-4 space-y-3">
            {data.others.map((other) => (
              <li key={other.id}>
                <Link
                  to="/services/$slug"
                  params={{ slug: other.slug }}
                  className="text-sm font-medium hover:text-accent"
                >
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/request-service">Book a survey</Link>
          </Button>
        </aside>
      </div>
    </PublicLayout>
  );
}
