export type AppRole = "super_admin" | "editor";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  login: (
    email: string,
    password?: string,
    requestedRole?: AppRole,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}
