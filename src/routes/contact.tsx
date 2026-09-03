import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { submitContactMessage } from "@/lib/public.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSite } from "@/lib/site-context";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — AD Security Camera Solution" },
      {
        name: "description",
        content: "Call, email or send us a message for quotes, site surveys and technical support.",
      },
      { property: "og:title", content: "Contact AD Security Camera Solution" },
      { property: "og:description", content: "Get in touch for quotes, surveys and support." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(3000),
});

function ContactPage() {
  const { contact, socialLinks } = useSite();
  const send = useServerFn(submitContactMessage);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => send({ data: values }),
    onSuccess: () => {
      setSent(true);
      toast.success("Message sent. We'll get back to you shortly.");
    },
    onError: (error: Error) => toast.error(error.message || "Could not send your message"),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
    event.currentTarget.reset();
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Contact"
        title="Talk to our security team"
        subtitle="Send us your requirements and we'll respond with advice, pricing or a survey appointment."
      />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_340px]">
        <div className="border border-border bg-card p-6 sm:p-8">
          {sent ? (
            <div className="py-8 text-center">
              <h2 className="text-xl font-bold">Thank you — your message is with us</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Our team typically replies within one business day.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" name="name" className="mt-2 h-11" required />
                {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name}</p> : null}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" className="mt-2 h-11" required />
                {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email}</p> : null}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" className="mt-2 h-11" />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" className="mt-2 h-11" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" name="message" rows={6} className="mt-2" required />
                {errors.message ? <p className="mt-1 text-xs text-destructive">{errors.message}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Sending…" : "Send message"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border border-border bg-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide">Contact details</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-accent">
                  {contact.email}
                </a>
              </li>
              {contact.phone ? (
                <li className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <a href={`tel:${contact.phone}`} className="hover:text-accent">
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.address ? (
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {contact.address}
                </li>
              ) : null}
              {contact.working_hours ? (
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {contact.working_hours}
                </li>
              ) : null}
            </ul>
          </div>
          {socialLinks.length ? (
            <div className="border border-border bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide">Follow us</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-sm border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </PublicLayout>
  );
}
