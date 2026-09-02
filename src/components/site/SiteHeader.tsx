import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Menu, Search, ShoppingCart, User2, X } from "lucide-react";
import { Logo } from "./Logo";
import { useSite } from "@/lib/site-context";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { navigation, announcement } = useSite();
  const { user } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [term, setTerm] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setMobileOpen(false), [pathname]);

  const notifications = useQuery({
    queryKey: ["header-notifications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      return unread ?? 0;
    },
  });

  const adminRole = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/products", search: { search: term || undefined } });
    setMobileOpen(false);
  }

  const items = navigation.length
    ? navigation
    : [
        { id: "1", label: "Home", url: "/" },
        { id: "2", label: "Products", url: "/products" },
        { id: "3", label: "Services", url: "/services" },
        { id: "4", label: "About", url: "/about" },
        { id: "5", label: "Gallery", url: "/gallery" },
        { id: "6", label: "Contact", url: "/contact" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      {announcement ? (
        <div className="bg-surface text-surface-foreground">
          <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-xs sm:text-sm">
            <span className="font-semibold">{announcement.title}</span>
            <span className="opacity-80">{announcement.message}</span>
            {announcement.cta_url && announcement.cta_label ? (
              <a href={announcement.cta_url} className="font-semibold text-accent underline-offset-4 hover:underline">
                {announcement.cta_label}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                className={`rounded-sm px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary ${
                  pathname === item.url ? "text-accent" : "text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <form onSubmit={submitSearch} className="hidden xl:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-9 w-48 pl-8"
              />
            </div>
          </form>

          <Button asChild variant="ghost" size="icon" aria-label="Cart" className="relative">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          </Button>

          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative hidden sm:inline-flex">
                <Link to="/account/notifications">
                  <Bell className="h-5 w-5" />
                  {(notifications.data ?? 0) > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-foreground">
                      {notifications.data}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <User2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders">My orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/requests">Service requests</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/profile">Profile</Link>
                  </DropdownMenuItem>
                  {adminRole.data ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Admin dashboard</Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void handleSignOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Login</Link>
            </Button>
          )}

          <Button asChild className="hidden bg-accent text-accent-foreground hover:bg-accent/90 md:inline-flex">
            <Link to="/request-service">Request Service</Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <SheetTitle className="text-sm font-bold uppercase tracking-wide">Menu</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-6 overflow-y-auto px-4 py-5">
                <form onSubmit={submitSearch}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Search products"
                      className="h-11 pl-8"
                    />
                  </div>
                </form>
                <nav className="flex flex-col">
                  {items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      className="border-b border-border py-3 text-base font-semibold"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                <div className="flex flex-col gap-2">
                  <Button asChild className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/request-service">Request Service</Link>
                  </Button>
                  {user ? (
                    <>
                      <Button asChild variant="outline" className="h-11">
                        <Link to="/account">My account</Link>
                      </Button>
                      {adminRole.data ? (
                        <Button asChild variant="outline" className="h-11">
                          <Link to="/admin">Admin dashboard</Link>
                        </Button>
                      ) : null}
                      <Button variant="ghost" className="h-11" onClick={() => void handleSignOut()}>
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="h-11">
                        <Link to="/auth">Login</Link>
                      </Button>
                      <Button asChild variant="ghost" className="h-11">
                        <Link to="/auth" search={{ mode: "register" }}>
                          Create account
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
