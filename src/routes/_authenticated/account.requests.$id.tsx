import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyServiceRequest } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/requests/$id")({
  head: () => ({
    meta: [
      { title: "Service request details — AD Security Camera Solution" },
      { name: "description", content: "Details and status of your booked service job." },
      { property: "og:title", content: "Service request details" },
      { property: "og:description", content: "Details and status of your service job." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const fetchRequest = useServerFn(getMyServiceRequest);
  const query = useQuery({ queryKey: ["my-request", id], queryFn: () => fetchRequest({ data: { id } }) });
  const request = query.data?.request;

  if (query.isLoading) {
    return (
      <AccountLayout title="Service request">
        <Skeleton className="h-64 w-full" />
      </AccountLayout>
    );
  }

  if (!request) {
    return (
      <AccountLayout title="Service request">
        <EmptyState
          title="Request not found"
          description="This request may have been removed."
          action={
            <Button asChild variant="outline">
              <Link to="/account/requests">Back to requests</Link>
            </Button>
          }
        />
      </AccountLayout>
    );
  }

  const rows: Array<[string, string | null | undefined]> = [
    ["Request number", request.request_number],
    ["Service", request.service_type],
    ["Contact name", request.full_name],
    ["Phone", request.phone],
    ["Email", request.email],
    ["Location", request.location],
    ["Property type", request.property_type],
    ["Preferred date", request.preferred_date],
    ["Preferred time", request.preferred_time],
    ["Devices needed", request.device_count == null ? null : String(request.device_count)],
    ["Existing system", request.current_system],
    ["Scheduled for", request.scheduled_at ? new Date(request.scheduled_at).toLocaleString() : null],
  ];

  return (
    <AccountLayout
      title={request.service_type}
      subtitle={`Submitted ${new Date(request.created_at).toLocaleString()}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Current status:</span>
        <StatusBadge status={request.status} />
      </div>

      <dl className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="bg-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
      </dl>

      {request.description ? (
        <div className="mt-6 border border-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide">What you described</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{request.description}</p>
        </div>
      ) : null}

      {request.additional_notes ? (
        <div className="mt-4 border border-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide">Additional notes</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{request.additional_notes}</p>
        </div>
      ) : null}

      <Button asChild variant="outline" className="mt-6">
        <Link to="/account/requests">Back to requests</Link>
      </Button>
    </AccountLayout>
  );
}
