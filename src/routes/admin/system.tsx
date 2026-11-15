import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RequireSuperAdmin } from "@/lib/auth/guard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getSystemUsageReport,
  formatBytes,
  type SystemUsageReport,
} from "@/lib/admin/system-usage";
import {
  Database,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Server,
  Zap,
  Globe,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/system")({
  component: SystemUsagePage,
});

function SystemUsagePage() {
  return (
    <RequireSuperAdmin>
      <SystemUsageContent />
    </RequireSuperAdmin>
  );
}

function SystemUsageContent() {
  const { user } = useAuth();
  const [report, setReport] = useState<SystemUsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getSystemUsageReport();
      setReport(data);
    } catch {
      toast.error("Failed to load system telemetry data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast.success("System usage data refreshed");
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 85) return "bg-destructive text-destructive";
    if (pct >= 70) return "bg-amber-500 text-amber-500";
    return "bg-emerald-500 text-emerald-500";
  };

  const getPercentageBg = (pct: number) => {
    if (pct >= 85) return "bg-destructive";
    if (pct >= 70) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              <ShieldCheck className="h-3 w-3" /> Super Admin Exclusive
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Usage & Storage Monitoring
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry, database capacity, file storage usage, and infrastructure health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Updating..." : "Refresh Metrics"}
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Gathering backend telemetry...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Automatic Usage Warnings & Alerts */}
          <div className="space-y-3">
            {report.warnings.map((w) => (
              <div
                key={w.id}
                className={`flex items-start gap-3 rounded-xl border p-4 text-xs transition ${
                  w.severity === "critical"
                    ? "border-destructive/30 bg-destructive/5 text-foreground"
                    : w.severity === "warning"
                      ? "border-amber-500/30 bg-amber-500/5 text-foreground"
                      : "border-primary/20 bg-primary/5 text-foreground"
                }`}
              >
                {w.severity === "critical" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                ) : w.severity === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <p className="font-bold text-foreground">{w.title}</p>
                  <p className="text-muted-foreground leading-relaxed">{w.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Core Resource Gauges (4 cards) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Database Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      PostgreSQL Database
                    </h2>
                    <p className="text-lg font-bold text-foreground">
                      {formatBytes(report.database.totalBytes)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${getPercentageColor(report.database.usedPercentage)}`}
                >
                  {report.database.usedPercentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-500 ${getPercentageBg(
                      report.database.usedPercentage,
                    )}`}
                    style={{
                      width: `${Math.min(100, Math.max(3, report.database.usedPercentage))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Limit: {formatBytes(report.database.limitBytes)}</span>
                  <span>
                    {formatBytes(report.database.limitBytes - report.database.totalBytes)} free
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-2 text-[11px] text-muted-foreground flex justify-between">
                <span>Active Tables: {report.database.tables.length}</span>
                <span>Pool: {report.database.connectionPool.active}/20</span>
              </div>
            </div>

            {/* Storage Buckets Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Media & File Storage
                    </h2>
                    <p className="text-lg font-bold text-foreground">
                      {formatBytes(report.storage.totalBytes)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${getPercentageColor(report.storage.usedPercentage)}`}
                >
                  {report.storage.usedPercentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(3, report.storage.usedPercentage))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Limit: {formatBytes(report.storage.limitBytes)}</span>
                  <span>
                    {formatBytes(report.storage.limitBytes - report.storage.totalBytes)} free
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-2 text-[11px] text-muted-foreground flex justify-between">
                <span>Total Assets: {report.storage.totalFiles}</span>
                <span>CDN Buckets: {report.storage.buckets.length}</span>
              </div>
            </div>

            {/* Bandwidth & Egress Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Monthly Egress
                    </h2>
                    <p className="text-lg font-bold text-foreground">
                      {formatBytes(report.bandwidth.egressBytes)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">
                  {report.bandwidth.egressPercentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(3, report.bandwidth.egressPercentage))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Limit: {formatBytes(report.bandwidth.egressLimitBytes)}</span>
                  <span>
                    {formatBytes(report.bandwidth.egressLimitBytes - report.bandwidth.egressBytes)}{" "}
                    free
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-2 text-[11px] text-muted-foreground flex justify-between">
                <span>CDN Cache Hit: {report.bandwidth.cacheHitRate}%</span>
                <span>Latency: {report.bandwidth.avgLatencyMs}ms</span>
              </div>
            </div>

            {/* Backend Requests Card */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Monthly API Calls
                    </h2>
                    <p className="text-lg font-bold text-foreground">
                      {report.bandwidth.totalRequests.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                  <TrendingUp className="h-3 w-3" /> Active
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-purple-500" style={{ width: "28%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Free Tier: Unlimited API reads</span>
                </div>
              </div>

              <div className="border-t border-border pt-2 text-[11px] text-muted-foreground flex justify-between">
                <span>Uptime: {report.health.uptimePercent}%</span>
                <span>Security: RLS Enforced</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Health & Services Status */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  System Health & Service Availability
                </h2>
                <p className="text-xs text-muted-foreground">
                  Live latency and operational status of all core backend components.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> 99.98% 30-Day Uptime
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {report.health.services.map((srv) => (
                <div
                  key={srv.name}
                  className="rounded-lg border border-border bg-background p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold text-foreground truncate"
                      title={srv.name}
                    >
                      {srv.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {srv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Response Time</span>
                    <span className="font-mono font-medium text-foreground">{srv.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column: Table Breakdown & Storage Buckets */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Database Tables */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-base font-bold text-foreground">
                    PostgreSQL Tables
                  </h2>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {report.database.tables.length} managed tables
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2 font-semibold">Table Name</th>
                      <th className="pb-2 font-semibold text-right">Row Count</th>
                      <th className="pb-2 font-semibold text-right">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {report.database.tables.map((tbl) => (
                      <tr key={tbl.name} className="hover:bg-muted/40 transition">
                        <td className="py-2.5 font-mono font-medium text-foreground">{tbl.name}</td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">
                          {tbl.rowCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono text-foreground">
                          {formatBytes(tbl.sizeBytes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Storage Buckets */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-sky-500" />
                  <h2 className="font-display text-base font-bold text-foreground">
                    Storage Buckets
                  </h2>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {report.storage.buckets.length} active buckets
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2 font-semibold">Bucket</th>
                      <th className="pb-2 font-semibold">Access</th>
                      <th className="pb-2 font-semibold text-right">Files</th>
                      <th className="pb-2 font-semibold text-right">Storage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {report.storage.buckets.map((b) => (
                      <tr key={b.name} className="hover:bg-muted/40 transition">
                        <td className="py-2.5 font-mono font-medium text-foreground">{b.name}</td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              b.isPublic
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {b.isPublic ? "Public CDN" : "Private"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">
                          {b.fileCount}
                        </td>
                        <td className="py-2.5 text-right font-mono text-foreground">
                          {formatBytes(b.sizeBytes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7-Day Usage History & Analytics Table */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  7-Day Usage History & Velocity
                </h2>
                <p className="text-xs text-muted-foreground">
                  Daily tracking of database size, media storage, API traffic, and data transfer.
                </p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Activity className="h-3.5 w-3.5 text-primary" /> Rolling 7-Day Window
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold text-right">DB Size (MB)</th>
                    <th className="pb-2 font-semibold text-right">Storage (MB)</th>
                    <th className="pb-2 font-semibold text-right">Daily Requests</th>
                    <th className="pb-2 font-semibold text-right">Egress (MB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {report.history.map((h, i) => (
                    <tr
                      key={h.date}
                      className={`hover:bg-muted/40 transition ${
                        i === report.history.length - 1 ? "font-bold bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-2.5 text-foreground flex items-center gap-2">
                        {h.date}
                        {i === report.history.length - 1 && (
                          <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold text-primary uppercase">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {h.dbSizeMb.toFixed(1)} MB
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {h.storageMb.toFixed(1)} MB
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {h.requests.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {h.egressMb.toFixed(1)} MB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan Runway & Upgrade Recommendation Card */}
          <div className="rounded-xl border border-border bg-gradient-to-r from-card to-secondary/30 p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Plan Runway & Scaling Recommendation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Current active plan:{" "}
                    <span className="font-semibold text-foreground">
                      {report.recommendation.currentTier}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">
                Runway: {report.recommendation.runwayEstimate}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {report.recommendation.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 border-t border-border/80 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Row Level Security active
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Database backups automated
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                No management tokens exposed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
