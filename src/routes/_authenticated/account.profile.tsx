import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, getMyAccount, saveAddress, updateMyProfile } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — AD Security Camera Solution" },
      { name: "description", content: "Update your contact details and saved delivery addresses." },
      { property: "og:title", content: "My Profile" },
      { property: "og:description", content: "Manage your details and addresses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchAccount = useServerFn(getMyAccount);
  const saveProfile = useServerFn(updateMyProfile);
  const upsertAddress = useServerFn(saveAddress);
  const removeAddress = useServerFn(deleteAddress);
  const queryClient = useQueryClient();
  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({ label: "", address_line: "", city: "", phone: "" });

  useEffect(() => {
    if (account.data?.profile) {
      setFullName(account.data.profile.full_name ?? "");
      setPhone(account.data.profile.phone ?? "");
    }
  }, [account.data?.profile]);

  const profileMutation = useMutation({
    mutationFn: () => saveProfile({ data: { full_name: fullName.trim(), phone: phone.trim() } }),
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update your profile"),
  });

  const addressMutation = useMutation({
    mutationFn: () =>
      upsertAddress({
        data: {
          label: address.label.trim(),
          address_line: address.address_line.trim(),
          city: address.city.trim(),
          phone: address.phone.trim(),
          full_name: fullName.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Address saved");
      setAddress({ label: "", address_line: "", city: "", phone: "" });
      void queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the address"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeAddress({ data: { id } }),
    onSuccess: () => {
      toast.success("Address removed");
      void queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });

  return (
    <AccountLayout title="My profile" subtitle="Keep your contact details up to date.">
      {account.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-8">
          <form
            className="border border-border bg-card p-6"
            onSubmit={(event) => {
              event.preventDefault();
              profileMutation.mutate();
            }}
          >
            <h2 className="text-base font-bold">Contact details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  minLength={2}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input value={account.data?.profile?.email ?? ""} disabled className="mt-1.5" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={profileMutation.isPending}
              className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {profileMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <section className="border border-border bg-card p-6">
            <h2 className="text-base font-bold">Saved addresses</h2>
            {(account.data?.addresses.length ?? 0) > 0 ? (
              <ul className="mt-4 divide-y divide-border border border-border">
                {account.data!.addresses.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-semibold">{item.label ?? "Address"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.address_line}
                        {item.city ? `, ${item.city}` : ""}
                      </p>
                      {item.phone ? (
                        <p className="text-sm text-muted-foreground">{item.phone}</p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove address"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No saved addresses yet.</p>
            )}

            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                addressMutation.mutate();
              }}
            >
              <div>
                <Label htmlFor="addr_label">Label</Label>
                <Input
                  id="addr_label"
                  placeholder="Home, Office…"
                  value={address.label}
                  onChange={(event) => setAddress({ ...address, label: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="addr_phone">Phone</Label>
                <Input
                  id="addr_phone"
                  value={address.phone}
                  onChange={(event) => setAddress({ ...address, phone: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="addr_line">Address</Label>
                <Input
                  id="addr_line"
                  required
                  minLength={5}
                  value={address.address_line}
                  onChange={(event) => setAddress({ ...address, address_line: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="addr_city">City</Label>
                <Input
                  id="addr_city"
                  value={address.city}
                  onChange={(event) => setAddress({ ...address, city: event.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" disabled={addressMutation.isPending}>
                  {addressMutation.isPending ? "Saving…" : "Add address"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AccountLayout>
  );
}
