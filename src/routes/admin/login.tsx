import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth, DEMO_USERS } from "@/lib/auth/AuthContext";
import { Lock, Mail, ArrowRight, ShieldCheck, Newspaper } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/admin" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your staff email address");
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success("Welcome back to the newsroom!");
      navigate({ to: "/admin" });
    } else {
      toast.error(result.error || "Invalid login credentials");
    }
  };

  const handleQuickLogin = async (type: "superadmin" | "editor") => {
    setSubmitting(true);
    const target = DEMO_USERS[type];
    const res = await login(target.email, "demo123", target.role);
    setSubmitting(false);
    if (res.success) {
      toast.success(`Signed in as ${target.fullName} (${target.role.replace("_", " ")})`);
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-block font-display text-3xl font-black tracking-tight text-foreground"
          >
            24<span className="text-primary">HOUR</span>NEWS
          </Link>
          <p className="text-sm text-muted-foreground font-medium">
            Staff & Editorial Newsroom Login
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@24hournews.com.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign in to Newsroom"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-center text-xs font-semibold text-muted-foreground mb-3">
              Fast Demo Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("superadmin")}
                disabled={submitting}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/50 p-2.5 text-center transition hover:bg-secondary hover:border-primary/40"
              >
                <ShieldCheck className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs font-bold text-foreground">Super Admin</span>
                <span className="text-[10px] text-muted-foreground">Full system access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("editor")}
                disabled={submitting}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/50 p-2.5 text-center transition hover:bg-secondary hover:border-primary/40"
              >
                <Newspaper className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs font-bold text-foreground">Admin / Editor</span>
                <span className="text-[10px] text-muted-foreground">Content management</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            ← Back to public 24hournews website
          </Link>
        </div>
      </div>
    </div>
  );
}
