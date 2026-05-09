import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

interface AuthContextType {
  user: User | null;
  profile: Tables<"profiles"> | null;
  loading: boolean;
  signingIn: boolean;
  signingUp: boolean;
  session: Session | null;
  signUp: (email: string, password: string, meta: {
    name: string;
    goalCategory: string;
    goalLabel: string;
    goalEmoji: string;
    deadline: string | null;
    isCustom: boolean;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(() => {
    try {
      const cached = localStorage.getItem("gm-profile-cache");
      const cacheData = cached ? JSON.parse(cached) : null;
      // Check if cache is less than 24 hours old
      if (cacheData && cacheData.timestamp && Date.now() - cacheData.timestamp < 24 * 60 * 60 * 1000) {
        return cacheData.profile;
      }
      return null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' && retryCount < 3) {
          // Profile not found, wait a bit and retry (for new signups)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchProfile(userId, retryCount + 1);
        }
        throw error;
      }

      if (data) {
        setProfile(data);
        try {
          localStorage.setItem("gm-profile-cache", JSON.stringify({
            profile: data,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn("Failed to cache profile", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      if (retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchProfile(userId, retryCount + 1);
      }
      // Re-throw after final retry failure so callers know fetch failed
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      // If refresh fails, sign out
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Small delay to ensure profile is created after signup
          setTimeout(() => fetchProfile(session.user.id), event === 'SIGNED_IN' ? 500 : 0);
        } else {
          setProfile(null);
          try {
            localStorage.removeItem("gm-profile-cache");
          } catch (error) {
            console.warn("Failed to remove profile cache", error);
          }
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Failed to get session:", error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session) return;

    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const expiresIn = expiresAt * 1000 - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (expiresIn <= 0) {
      // Session already expired, refresh immediately
      refreshSession();
      return;
    }

    if (expiresIn <= refreshBuffer) {
      // Session expires within buffer, refresh immediately
      refreshSession();
      return;
    }

    // Schedule refresh for later
    const timeoutId = setTimeout(refreshSession, expiresIn - refreshBuffer);
    return () => clearTimeout(timeoutId);
  }, [session, refreshSession]);

  const signUp = async (
    email: string,
    password: string,
    meta: {
      name: string;
      goalCategory: string;
      goalLabel: string;
      goalEmoji: string;
      deadline: string | null;
      isCustom: boolean;
    }
  ) => {
    setSigningUp(true);
    try {
      // First try to sign in (existing user)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInData?.user) {
        await fetchProfile(signInData.user.id);
        return { error: null };
      }

      // Check for specific error conditions
      if (signInError) {
        // Status 400/422 typically means invalid credentials or validation error
        // Check error code or status to determine the issue
        const isInvalidCredentials = 
          signInError.status === 400 || 
          signInError.status === 401 ||
          signInError.message?.includes("Invalid login credentials") ||
          signInError.code === "invalid_credentials";
        
        if (!isInvalidCredentials) {
          // Some other error (network, validation, etc)
          return { error: signInError.message || "Sign in failed" };
        }
        // Invalid credentials - will try signup below
      }

      // Try signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: meta.name,
            goal_category: meta.goalCategory,
          }
        }
      });

      if (error) {
        // Check for user already exists errors
        const userExists = 
          error.status === 400 || 
          error.message?.includes("already registered") ||
          error.message?.includes("user already exists") ||
          error.code === "user_already_exists";
        
        if (userExists) {
          return { error: "Account exists but password is incorrect. Try a different password." };
        }
        return { error: error.message || "Signup failed" };
      }

      if (!data.user) return { error: "Signup failed" };

      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: data.user.id,
        name: meta.name,
        goal_category: meta.goalCategory,
        goal_label: meta.goalLabel,
        goal_emoji: meta.goalEmoji,
        deadline: meta.deadline,
        is_custom: meta.isCustom,
      }, { onConflict: "user_id" });

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        return { error: "Account created but profile setup failed. Please try logging in." };
      }

      await fetchProfile(data.user.id);
      return { error: null };
    } catch (error) {
      console.error("Signup error:", error);
      return { error: "Network error. Please check your connection and try again." };
    } finally {
      setSigningUp(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: "Network error. Please check your connection and try again." };
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      try {
        localStorage.removeItem("gm-profile-cache");
      } catch (error) {
        console.warn("Failed to remove profile cache", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signingIn,
      signingUp,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
