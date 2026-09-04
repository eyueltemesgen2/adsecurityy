import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createUploadUrl, submitServiceRequest } from "@/lib/customer.functions";
import { listServices } from "@/lib/public.functions";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RequestSearch = { service?: string };

export const Route = createFileRoute("/_authenticated/request-service")({
  validateSearch: (search: Record<string, unknown>): RequestSearch => ({
    service: typeof search.service === "string" && search.service ? search.service : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Request a Service — AD Security Camera Solution" },
      {
        name: "description",
        content: "Book a site survey, installation, maintenance or networking job with our engineers.",
      },
      { property: "og:title", content: "Request a Service" },
      { property: "og:description", content: "Book installation, maintenance or a site survey." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestServicePage,
});

const PROPERTY_TYPES = ["Home / Villa", "Apartment", "Shop / Retail", "Office", "Warehouse", "Factory", "Other"];
const TIMES = ["Morning (8am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–7pm)", "Any time"];

const schema = z.object({
  service_type: z.string().min(2, "Choose the service you need"),
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().min(6, "Enter a reachable phone number").max(40),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  location: z.string().trim().min(3, "Where is the site located?").max(400),
  property_type: z.string().optional(),
  preferred_date: z.string().optional(),
  preferred_time: z.string().optional(),
  device_count: z.number().int().min(0).max(10000).nullable().optional(),
  current_system: z.string().trim().max(1000).optional(),
  description: z.string().trim().max(3000).optional(),
  additional_notes: z.string().trim().max(2000).optional(),
});

type UploadedFile = { name: string; path: string; type?: string };

function RequestServicePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const submit = useServerFn(submitServiceRequest);
  const prepareUpload = useServerFn(createUploadUrl);
  const [serviceSlug, setServiceSlug] = useState(search.service ?? "");
  const [propertyType, setPropertyType] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const services = useQuery({ queryKey: ["services"], queryFn: () => listServices() });
  const selected = services.data?.services.find((service) => service.slug === serviceSlug);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      submit({ data: { ...values, service_id: selected?.id ?? null, files } }),
    onSuccess: (result) => {
      toast.success(`Request ${result.requestNumber} submitted`);
      navigate({ to: "/account/requests/$id", params: { id: result.id } });
    },
    onError: (error: Error) => toast.error(error.message || "Request could not be submitted"),
  });

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(event.target.files ?? []);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list.slice(0, 5)) {
        const prepared = await prepareUpload({
          data: { filename: file.name, contentType: file.type || "application/octet-stream", size: file.size },
        });
        const { error } = await supabase.storage
          .from("media")
          .uploadToSignedUrl(prepared.path, prepared.token, file);
        if (error) throw new Error(error.message);
        setFiles((prev) => [...prev, { name: file.name, path: prepared.path, type: file.type }]);
      }
      toast.success("File(s) attached");
    } catch (error) {
      toast.error((error as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const deviceCountRaw = String(form.get("device_count") ?? "");
    const parsed = schema.safeParse({
      service_type: selected?.name ?? String(form.get("service_type") ?? ""),
      full_name: String(form.get("full_name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      location: String(form.get("location") ?? ""),
      property_type: propertyType,
      preferred_date: String(form.get("preferred_date") ?? ""),
      preferred_time: preferredTime,
      device_count: deviceCountRaw ? Number(deviceCountRaw) : null,
      current_system: String(form.get("current_system") ?? ""),
      description: String(form.get("description") ?? ""),
      additional_notes: String(form.get("additional_notes") ?? ""),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Service request"
        title="Book a survey, installation or support visit"
        subtitle="Tell us about your site and our engineers will confirm the scope, timing and pricing."
      />
      <div className="container-page py-12">
        <form onSubmit={onSubmit} className="grid max-w-3xl gap-5 border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
          <div className="sm:col-span-2">
            <Label>Service needed *</Label>
            <Select value={serviceSlug} onValueChange={setServiceSlug}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {(services.data?.services ?? []).map((service) => (
                  <SelectItem key={service.id} value={service.slug}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_type ? <p className="mt-1 text-xs text-destructive">{errors.service_type}</p> : null}
          </div>

          <div>
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" name="full_name" className="mt-2 h-11" required />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" className="mt-2 h-11" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" className="mt-2 h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="location">Site location *</Label>
            <Input id="location" name="location" placeholder="Area, street, building" className="mt-2 h-11" required />
            {errors.location ? <p className="mt-1 text-xs text-destructive">{errors.location}</p> : null}
          </div>

          <div>
            <Label>Property type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="device_count">Number of devices / cameras</Label>
            <Input id="device_count" name="device_count" type="number" min={0} className="mt-2 h-11" />
          </div>
          <div>
            <Label htmlFor="preferred_date">Preferred date</Label>
            <Input id="preferred_date" name="preferred_date" type="date" className="mt-2 h-11" />
          </div>
          <div>
            <Label>Preferred time</Label>
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {TIMES.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="current_system">Existing system (if any)</Label>
            <Input id="current_system" name="current_system" className="mt-2 h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">What do you need?</Label>
            <Textarea id="description" name="description" rows={5} className="mt-2" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="additional_notes">Additional notes</Label>
            <Textarea id="additional_notes" name="additional_notes" rows={3} className="mt-2" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="files">Photos or documents (optional)</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                id="files"
                type="file"
                multiple
                accept="image/*,application/pdf,text/plain"
                onChange={(event) => void handleFiles(event)}
                disabled={uploading}
                className="h-11"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Images, PDF or text up to 20 MB each. {uploading ? "Uploading…" : ""}
            </p>
            {files.length ? (
              <ul className="mt-3 space-y-2">
                {files.map((file) => (
                  <li
                    key={file.path}
                    className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Paperclip className="h-3.5 w-3.5 text-accent" /> {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((item) => item.path !== file.path))}
                      aria-label={`Remove ${file.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={mutation.isPending || uploading}
            >
              {mutation.isPending ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </div>
    </PublicLayout>
  );
}
