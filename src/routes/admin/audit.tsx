import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RequireSuperAdmin } from "@/lib/auth/guard";
import { getAuditLogs, type AuditEvent } from "@/lib/news/admin-api";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  User,
  Shield,
  Trash2,
  Send,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPageWithGuard,
});

function AuditPageWithGuard() {
  return (
    <RequireSuperAdmin>
      <AuditLogsPage />
    </RequireSuperAdmin>
  );
}

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityTitle?.toLowerCase().includes(search.toLowerCase());

    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("publish")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
          <Send className="h-3 w-3" /> Published
        </span>
      );
    }
    if (action.includes("create")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
          <FileText className="h-3 w-3" /> Created
        </span>
      );
    }
    if (action.includes("delete")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
          <Trash2 className="h-3 w-3" /> Deleted
        </span>
      );
    }
    if (action.includes("role") || action.includes("user")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
          <Shield className="h-3 w-3" /> Staff Access
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
        {action.replace(".", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Audit History & Editorial Trail
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Complete, tamper-evident log of story publications, editorial modifications, and staff
          role assignments.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by staff name, action, or headline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
          >
            <option value="all">All Event Types</option>
            <option value="article">Stories & Articles</option>
            <option value="user">Staff & Roles</option>
            <option value="media">Media Uploads</option>
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground">No audit logs found</p>
            <p className="text-xs mt-1">
              Actions taken by newsroom staff will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border text-xs">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-3 p-4 transition hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-foreground">
                    {log.actorName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{log.actorName}</span>
                      <span className="text-muted-foreground">({log.actorEmail})</span>
                      {getActionBadge(log.action)}
                    </div>

                    {log.entityTitle && (
                      <p className="font-display text-sm font-bold text-foreground/90 mt-1">
                        “{log.entityTitle}”
                      </p>
                    )}

                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-muted-foreground shrink-0 flex items-center gap-1.5 sm:flex-col sm:items-end">
                  <span className="font-medium text-foreground">
                    {new Date(log.timestamp).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
