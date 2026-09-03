import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Wrench } from "lucide-react";
import { listServices } from "@/lib/public.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { MediaImage } from "@/components/site/Media";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/db-types";

const servicesQuery = queryOptions({ queryKey: ["services"], queryFn: () => listServices() });

export const Route = createFileRoute("/services/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQuery),
  head: () => ({
    meta: [
      { title: "Security & IT Services — AD Security Camera Solution" },
      {
        name: "description",
        content:
          "CCTV installation, maintenance, networking, access control, time attendance, video intercom and IT/web solutions by certified engineers.",
      },
      { property: "og:title", content: "Security & IT Services" },
      {
        property: "og:description",
        content: "Installation, maintenance, networking, access control and IT solutions for homes and businesses.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data } = useSuspenseQuery(servicesQuery);

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Services"
        title="Engineering-led security and technology services"
        subtitle="From site survey and system design to installation, maintenance and support — delivered by our own certified team."
      >
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/request-service">Request a service</Link>
        </Button>
      </PageHeader>

      <div className="container-page py-12">
        {data.services.length === 0 ? (
          <EmptyState title="No services published yet" description="Please check back shortly." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.services.map((service) => (
              <article key={service.id} className="flex flex-col border border-border bg-card sm:flex-row">
                <MediaImage
                  src={service.image_url}
                  alt={service.name}
                  className="aspect-[4/3] w-full sm:aspect-auto sm:w-44 sm:shrink-0"
                />
                <div className="flex flex-1 flex-col p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-secondary text-accent">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <h2 className="mt-3 text-lg font-semibold">{service.name}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {service.short_description}
                  </p>
                  {service.starting_price ? (
                    <p className="mt-3 text-sm font-semibold">
                      From ETB {formatPrice(service.starting_price)}
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/services/$slug" params={{ slug: service.slug }}>
                        Details <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link to="/request-service" search={{ service: service.slug }}>
                        Request
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
