import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { getMyAccount, markNotificationsRead } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — AD Security Camera Solution" },
      { name: "description", content: "Updates about your orders and service requests." },
      { property: "og:title", content: "Notifications" },
      { property: "og:description", content: "Updates about your orders and requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const markRead = useServerFn(markNotificationsRead);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });

  const mutation = useMutation({
    mutationFn: () => markRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      void queryClient.invalidateQueries();
    },
  });

  const notifications = query.data?.notifications ?? [];
  const unread = notifications.filter((notification) => !notification.read_at).length;

  return (
    <AccountLayout title="Notifications" subtitle={`${unread} unread`}>
      {unread > 0 ? (
        <Button className="mb-4" variant="outline" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Mark all as read
        </Button>
      ) : null}

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications yet"
          description="Order and service updates will show up here."
        />
      ) : (
        <ul className="divide-y divide-border border border-border bg-card">
          {notifications.map((notification) => (
            <li key={notification.id} className={`p-4 ${notification.read_at ? "" : "bg-accent/5"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  {notification.body ? (
                    <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  ) : null}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read_at ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
