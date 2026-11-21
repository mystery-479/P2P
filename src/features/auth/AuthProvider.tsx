import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../../lib/supabase";

export type AppRole = "citizen" | "official" | "admin";

type AuthContextValue = {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  configured: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signOut(): Promise<void>;
  refreshRole(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isAppRole(value: unknown): value is AppRole {
  return value === "citizen" || value === "official" || value === "admin";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  const loadRole = useCallback(async (sessionUser: User | null) => {
    if (!supabase || !sessionUser) {
      setRole(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", sessionUser.id)
      .maybeSingle();

    if (error || !data || !isAppRole(data.role)) {
      setRole(null);
      return;
    }
    setRole(data.role);
  }, []);

  const handleSession = useCallback(
    async (session: Session | null) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      await loadRole(sessionUser);
      setLoading(false);
    },
    [loadRole],
  );

  useEffect(() => {
    if (!supabase) return;

    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) void handleSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) void handleSession(session);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      configured: supabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshRole: () => loadRole(user),
    }),
    [user, role, loading, signIn, signUp, signOut, loadRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
