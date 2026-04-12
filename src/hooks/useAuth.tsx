import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

interface AuthContextType {
  user: User | null;
  profile: Tables<"profiles"> | null;
  loading: boolean;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    // First try to sign in (existing user)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInData?.user) {
      await fetchProfile(signInData.user.id);
      return { error: null };
    }

    // If wrong password for existing user
    if (signInError && signInError.message !== "Invalid login credentials") {
      return { error: signInError.message };
    }

    // Try signup
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Account exists but password is incorrect. Try a different password." };
      }
      return { error: error.message };
    }
    if (!data.user) return { error: "Signup failed" };

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      name: meta.name,
      goal_category: meta.goalCategory,
      goal_label: meta.goalLabel,
      goal_emoji: meta.goalEmoji,
      deadline: meta.deadline,
      is_custom: meta.isCustom,
    });

    if (profileError) return { error: profileError.message };
    await fetchProfile(data.user.id);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
