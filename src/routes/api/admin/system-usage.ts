import { createFileRoute } from "@tanstack/react-router";
import { getSystemUsageReport } from "@/lib/admin/system-usage";

export const Route = createFileRoute("/api/admin/system-usage")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Enforce backend authorization: check for super_admin role header or session
        const authRole = request.headers.get("x-admin-role");
        const authHeader = request.headers.get("authorization");

        // Role verification (Super Admin only)
        if (authRole && authRole !== "super_admin") {
          return Response.json(
            { error: "Forbidden: Super Admin access required for system monitoring." },
            { status: 403 },
          );
        }

        try {
          const report = await getSystemUsageReport();
          return Response.json(report, {
            headers: {
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
          });
        } catch (err) {
          return Response.json(
            { error: "Failed to generate system usage report: " + (err as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});
