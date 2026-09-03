import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { getPageContent } from "@/lib/public.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { MediaImage } from "@/components/site/Media";
import { Button } from "@/components/ui/button";
import { useSite } from "@/lib/site-context";

const aboutQuery = queryOptions({
  queryKey: ["page", "about"],
  queryFn: () => getPageContent({ data: { slug: "about" } }),
});

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(aboutQuery),
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    const title = page?.seo_title || "About Us — AD Security Camera Solution";
    const description =
      page?.seo_description ||
      "Who we are: a professional security and technology company delivering equipment, installation and IT solutions.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: AboutPage,
});

type Block = { title?: string; body?: string; image_url?: string; items?: { title?: string; description?: string }[] };

function AboutPage() {
  const { data } = useSuspenseQuery(aboutQuery);
  const { branding } = useSite();
  const page = data.page;
  const content = (page?.content ?? {}) as { blocks?: Block[]; sections?: Block[] };
  const blocks = content.blocks ?? content.sections ?? [];

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="About us"
        title={page?.title ?? `About ${branding.company_name}`}
        subtitle={page?.subtitle ?? branding.description ?? null}
      />
      {page?.hero_image_url ? (
        <div className="container-page -mt-0 pt-10">
          <MediaImage src={page.hero_image_url} alt={page.title} className="aspect-[16/7] w-full rounded-sm" />
        </div>
      ) : null}

      <div className="container-page space-y-14 py-12">
        {blocks.length === 0 ? (
          <p className="max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground">
            {branding.description ??
              "We supply, install and maintain security and technology systems — CCTV, access control, time attendance, video intercom, networking and IT solutions — for homes, offices and industrial sites."}
          </p>
        ) : (
          blocks.map((block, index) => (
            <section key={index} className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <h2 className="text-2xl font-bold">{block.title}</h2>
                {block.body ? (
                  <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-muted-foreground">
                    {block.body}
                  </p>
                ) : null}
                {block.items?.length ? (
                  <ul className="mt-5 space-y-2.5">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-2 text-sm">
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
              </div>
              {block.image_url ? (
                <MediaImage
                  src={block.image_url}
                  alt={block.title ?? ""}
                  className={`aspect-[4/3] w-full rounded-sm ${index % 2 === 1 ? "lg:order-1" : ""}`}
                />
              ) : null}
            </section>
          ))
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-10">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/request-service">Request a service</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Contact our team</Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
