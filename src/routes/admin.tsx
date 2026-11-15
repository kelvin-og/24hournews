import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { RequireAuth } from "@/lib/auth/guard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginPage = pathname === "/admin/login";

  // Login page has its own standalone minimal layout
  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-muted/25 font-sans">
        <AdminNavbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  );
}
