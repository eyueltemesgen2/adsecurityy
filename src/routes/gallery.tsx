import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listGallery } from "@/lib/public.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { MediaImage } from "@/components/site/Media";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";

const galleryQuery = queryOptions({ queryKey: ["gallery"], queryFn: () => listGallery() });

export const Route = createFileRoute("/gallery")({
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
  head: () => ({
    meta: [
      { title: "Project Gallery — AD Security Camera Solution" },
      {
        name: "description",
        content: "Photos from real CCTV, access control and networking installations completed by our team.",
      },
      { property: "og:title", content: "Project Gallery" },
      { property: "og:description", content: "See our completed security installations." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { data } = useSuspenseQuery(galleryQuery);
  const [filter, setFilter] = useState<string>("all");
  const categories = Array.from(new Set(data.items.map((item) => item.category).filter(Boolean))) as string[];
  const items = filter === "all" ? data.items : data.items.filter((item) => item.category === filter);

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Our work"
        title="Installation gallery"
        subtitle="A look at systems we have designed, installed and commissioned for homes, offices and industrial sites."
      />
      <div className="container-page py-12">
        {categories.length ? (
          <div className="mb-8 flex flex-wrap gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        ) : null}

        {items.length === 0 ? (
          <EmptyState title="No gallery items yet" description="Project photos will appear here soon." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <figure key={item.id} className="group overflow-hidden border border-border bg-card">
                <MediaImage
                  src={item.image_url}
                  alt={item.title}
                  className="aspect-[4/3] w-full"
                  imgClassName="transition-transform duration-300 group-hover:scale-105"
                />
                <figcaption className="p-4">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
