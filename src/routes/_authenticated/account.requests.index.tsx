import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wrench } from "lucide-react";
import { listMyServiceRequests } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/requests/")({
  head: () => ({
    meta: [
      { title: "My Service Requests — AD Security Camera Solution" },
      { name: "description", content: "Installation, maintenance and repair jobs you have booked." },
      { property: "og:title", content: "My Service Requests" },
      { property: "og:description", content: "Track your booked service jobs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const fetchRequests = useServerFn(listMyServiceRequests);
  const query = useQuery({ queryKey: ["my-requests"], queryFn: () => fetchRequests() });

  return (
    <AccountLayout title="Service requests" subtitle="Every job you have booked with our engineers.">
      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (query.data?.requests.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Wrench className="h-5 w-5" />}
          title="No service requests yet"
          description="Book an installation, maintenance visit or site survey and track it here."
          action={
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/request-service">Request a service</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {query.data!.requests.map((request) => (
            <li key={request.id} className="border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold">{request.service_type}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.request_number} · {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{request.location}</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/account/requests/$id" params={{ id: request.id }}>
                    View details
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
