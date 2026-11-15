import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Users,
  History,
  Activity,
  LogOut,
  ExternalLink,
  PlusCircle,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AdminNavbar() {
  const { user, isSuperAdmin, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Stories", href: "/admin/articles", icon: FileText },
    { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    ...(isSuperAdmin
      ? [
          { label: "Staff & Roles", href: "/admin/users", icon: Users },
          { label: "System Usage", href: "/admin/system", icon: Activity },
          { label: "Audit Log", href: "/admin/audit", icon: History },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="font-display text-xl font-black tracking-tight text-foreground">
              24<span className="text-primary">HOUR</span>NEWS
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              Newsroom
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-bold border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side shortcuts & User controls */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/articles/new"
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 sm:inline-flex"
          >
            <PlusCircle className="h-4 w-4" />
            Write Story
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View reader site in new tab"
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex"
          >
            Live Site <ExternalLink className="h-3 w-3" />
          </a>

          {/* User & Role Badge */}
          <div className="hidden items-center gap-2.5 border-l border-border pl-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {user?.fullName || "Staff Member"}
              </p>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider ${
                  isSuperAdmin ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isSuperAdmin ? "Super Admin" : "Editor"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign out of newsroom"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="font-display text-lg font-black">
                  24<span className="text-primary">HOUR</span>NEWS
                </SheetTitle>
                <p className="text-xs text-muted-foreground">Editorial Newsroom</p>
              </SheetHeader>

              <div className="mb-4 flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="text-xs font-semibold">{user?.fullName}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                <Link
                  to="/admin/articles/new"
                  onClick={() => setMobileOpen(false)}
                  className="mb-2 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <PlusCircle className="h-4 w-4" /> Write New Story
                </Link>

                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-primary/10 text-primary font-bold border border-primary/20"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}

                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" /> Visit Live Site
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
