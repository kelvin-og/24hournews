import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppRole, AuthContextType, UserProfile } from "./types";
import { adminSupabase } from "./client";

const AUTH_STORAGE_KEY = "24hournews_admin_user";

// Default seed profiles for clean fallback & demo access
export const DEMO_USERS = {
  superadmin: {
    id: "user-superadmin-01",
    email: "superadmin@24hournews.com.gh",
    fullName: "Super Admin",
    role: "super_admin" as AppRole,
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  editor: {
    id: "user-editor-01",
    email: "editor@24hournews.com.gh",
    fullName: "Ama Osei",
    role: "editor" as AppRole,
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    isActive: true,
    createdAt: "2026-02-15T00:00:00Z",
  },
} as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from Supabase or localStorage on boot
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. If Supabase is ready, check active session
        if (adminSupabase) {
          const {
            data: { session },
          } = await adminSupabase.auth.getSession();
          if (session?.user && mounted) {
            const role = (session.user.user_metadata?.["role"] as AppRole) ?? "editor";
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email ?? "staff@24hournews.com.gh",
              fullName:
                session.user.user_metadata?.["full_name"] ??
                session.user.email?.split("@")[0] ??
                "Staff Member",
              role,
              isActive: true,
              createdAt: session.user.created_at,
            };
            setUser(profile);
            setIsLoading(false);
            return;
          }
        }

        // 2. Fall back to local storage session
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored && mounted) {
          const parsed = JSON.parse(stored) as UserProfile;
          setUser(parsed);
        }
      } catch (err) {
        console.warn("[auth] Session restore failed:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth state change if available
    let subscription: { unsubscribe: () => void } | null = null;
    if (adminSupabase) {
      const { data } = adminSupabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const role = (session.user.user_metadata?.["role"] as AppRole) ?? "editor";
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email ?? "",
            fullName:
              session.user.user_metadata?.["full_name"] ??
              session.user.email?.split("@")[0] ??
              "Staff Member",
            role,
            isActive: true,
            createdAt: session.user.created_at,
          };
          setUser(profile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        } else if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
          setUser(null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password?: string,
    requestedRole?: AppRole,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // 1. Try real Supabase auth if credentials are provided
      if (adminSupabase && password) {
        const { data, error } = await adminSupabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const role = (data.user.user_metadata?.["role"] as AppRole) ?? requestedRole ?? "editor";
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email ?? email,
            fullName: data.user.user_metadata?.["full_name"] ?? email.split("@")[0],
            role,
            isActive: true,
            createdAt: data.user.created_at,
            lastLoginAt: new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        }
      }

      // 2. Friendly fallback / quick staff login for development & demo
      const cleanEmail = email.trim().toLowerCase();
      let matched: UserProfile;

      if (cleanEmail.includes("superadmin") || requestedRole === "super_admin") {
        const adminDemo = DEMO_USERS["superadmin"];
        matched = {
          id: adminDemo.id,
          fullName: adminDemo.fullName,
          role: "super_admin",
          isActive: true,
          createdAt: adminDemo.createdAt,
          email: cleanEmail || adminDemo.email,
          lastLoginAt: new Date().toISOString(),
        };
      } else {
        const editorDemo = DEMO_USERS["editor"];
        matched = {
          id: editorDemo.id,
          role: requestedRole ?? "editor",
          isActive: true,
          createdAt: editorDemo.createdAt,
          email: cleanEmail || editorDemo.email,
          fullName: cleanEmail
            ? (cleanEmail.split("@")[0] ?? "Staff").replace(".", " ")
            : editorDemo.fullName,
          lastLoginAt: new Date().toISOString(),
        };
      }

      setUser(matched);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: (err as Error).message };
    }
  };

  const logout = async () => {
    try {
      if (adminSupabase) {
        await adminSupabase.auth.signOut();
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const role = user?.role ?? null;
  const isSuperAdmin = role === "super_admin";
  const isEditor = role === "editor";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin,
        isEditor,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
