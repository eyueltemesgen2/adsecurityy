import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listFaqs } from "@/lib/public.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqQuery = queryOptions({ queryKey: ["faqs"], queryFn: () => listFaqs() });

export const Route = createFileRoute("/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(faqQuery),
  head: () => ({
    meta: [
      { title: "FAQ — AD Security Camera Solution" },
      {
        name: "description",
        content: "Answers about pricing, installation timelines, warranty, maintenance and remote viewing.",
      },
      { property: "og:title", content: "Frequently Asked Questions" },
      { property: "og:description", content: "Common questions about our security products and services." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { data } = useSuspenseQuery(faqQuery);
  const groups = data.faqs.reduce<Record<string, typeof data.faqs>>((acc, faq) => {
    const key = faq.category || "General";
    acc[key] = [...(acc[key] ?? []), faq];
    return acc;
  }, {});

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Support"
        title="Frequently asked questions"
        subtitle="Everything you need to know about buying equipment, installation and ongoing support."
      />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_300px]">
        <div>
          {data.faqs.length === 0 ? (
            <EmptyState title="No FAQs published yet" />
          ) : (
            Object.entries(groups).map(([category, faqs]) => (
              <section key={category} className="mb-10">
                <h2 className="eyebrow text-accent">{category}</h2>
                <Accordion type="single" collapsible className="mt-3 border-t border-border">
                  {faqs.map((faq) => (
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
              </section>
            ))
          )}
        </div>
        <aside className="h-fit border border-border bg-card p-6">
          <h2 className="text-base font-bold">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team is happy to advise on the right system for your site.
          </p>
          <Button asChild className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/contact">Contact us</Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/request-service">Request a survey</Link>
          </Button>
        </aside>
      </div>
    </PublicLayout>
  );
}
