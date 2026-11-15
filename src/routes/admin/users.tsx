import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RequireSuperAdmin } from "@/lib/auth/guard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getStoredStaff,
  inviteStaffMember,
  updateStaffRole,
  toggleStaffActive,
  type StaffUser,
} from "@/lib/news/admin-api";
import type { AppRole } from "@/lib/auth/types";
import {
  UserPlus,
  ShieldCheck,
  Newspaper,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  User,
  Shield,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersPageWithGuard,
});

function UsersPageWithGuard() {
  return (
    <RequireSuperAdmin>
      <StaffManagementPage />
    </RequireSuperAdmin>
  );
}

function StaffManagementPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("editor");
  const [inviting, setInviting] = useState(false);

  const reload = () => {
    setStaff(getStoredStaff());
  };

  useEffect(() => {
    reload();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error("Please enter both name and email");
      return;
    }

    setInviting(true);
    try {
      await inviteStaffMember(
        { email, fullName, role },
        user
          ? { id: user.id, name: user.fullName, email: user.email }
          : { id: "admin", name: "Super Admin", email: "admin@24hournews.com.gh" },
      );
      toast.success(`Invitation sent to ${email}`);
      setInviteModalOpen(false);
      setFullName("");
      setEmail("");
      setRole("editor");
      reload();
    } catch {
      toast.error("Failed to invite staff member");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleToggle = async (targetUser: StaffUser) => {
    if (targetUser.id === user?.id) {
      toast.error("You cannot change your own Super Admin role");
      return;
    }
    const newRole: AppRole = targetUser.role === "super_admin" ? "editor" : "super_admin";
    if (confirm(`Change ${targetUser.fullName}'s role to ${newRole.replace("_", " ")}?`)) {
      await updateStaffRole(targetUser.id, newRole, {
        id: user!.id,
        name: user!.fullName,
        email: user!.email,
      });
      toast.success(`Role updated to ${newRole.replace("_", " ")}`);
      reload();
    }
  };

  const handleStatusToggle = async (targetUser: StaffUser) => {
    if (targetUser.id === user?.id) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    const nextState = !targetUser.isActive;
    const actionText = nextState ? "activate" : "deactivate";
    if (confirm(`Are you sure you want to ${actionText} ${targetUser.fullName}'s account?`)) {
      await toggleStaffActive(targetUser.id, nextState, {
        id: user!.id,
        name: user!.fullName,
        email: user!.email,
      });
      toast.success(`Staff account ${nextState ? "activated" : "deactivated"}`);
      reload();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Staff & Role Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure newsroom staff accounts, assign publishing roles, and control access
            permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Invite Staff Member
        </button>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="py-3 pl-4 pr-3">Staff Member</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Last Active</th>
              <th className="py-3 pl-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((member) => {
              const isCurrentUser = member.id === user?.id;
              return (
                <tr key={member.id} className="transition hover:bg-muted/20">
                  <td className="py-3.5 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground text-xs">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          {member.fullName}
                          {isCurrentUser && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3.5">
                    {member.role === "super_admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <ShieldCheck className="h-3 w-3" /> Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                        <Newspaper className="h-3 w-3" /> Editor
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3.5">
                    {member.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" /> Suspended
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3.5 text-muted-foreground">
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Never"}
                  </td>

                  <td className="py-3.5 pl-3 pr-4 text-right">
                    {!isCurrentUser && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(member)}
                          className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                        >
                          Switch to {member.role === "super_admin" ? "Editor" : "Super Admin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(member)}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                            member.isActive
                              ? "text-destructive hover:bg-destructive/10"
                              : "text-emerald-600 hover:bg-emerald-500/10"
                          }`}
                        >
                          {member.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-bold text-foreground">
            Newsroom Role Privileges
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <ShieldCheck className="h-4 w-4" /> Super Admin
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Full control across the entire newsroom. Can write, edit, schedule, publish, and
              delete any story; invite or deactivate staff members; change roles; access full audit
              history.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Newspaper className="h-4 w-4 text-muted-foreground" /> Admin / Editor
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Can create, edit, preview, schedule, publish, and unpublish news stories across all
              desks. Cannot access staff accounts, change user roles, or view administrative audit
              settings.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Invite Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a journalist, desk editor, or newsroom administrator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

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
                  placeholder="kwame@24hournews.com.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="text-xs font-semibold text-foreground">
                Role Assignment
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as AppRole)}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="editor">Editor (Create, edit, schedule & publish stories)</option>
                  <option value="super_admin">Super Admin (Full newsroom & staff control)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {inviting ? "Sending invite..." : "Send Newsroom Invitation"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
