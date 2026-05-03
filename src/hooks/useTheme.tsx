import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ThemeContextType {
  theme: "dark" | "light";
  accentColor: string;
  fontSize: string;
  setTheme: (t: "dark" | "light") => void;
  setAccentColor: (c: string) => void;
  setFontSize: (s: string) => void;
}

const ACCENT_HSL: Record<string, string> = {
  purple: "258 100% 62%",
  blue: "220 100% 55%",
  green: "145 70% 45%",
  orange: "25 100% 55%",
  pink: "330 90% 60%",
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  accentColor: "purple",
  fontSize: "medium",
  setTheme: () => {},
  setAccentColor: () => {},
  setFontSize: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("gm-theme") as "dark" | "light") || "dark";
  });
  const [accentColor, setAccentState] = useState(() => {
    return localStorage.getItem("gm-accent") || "purple";
  });
  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem("gm-font-size") || "medium";
  });

  // Load from DB on user login
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("theme, accent_color, font_size")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.theme) { setThemeState(data.theme as "dark" | "light"); localStorage.setItem("gm-theme", data.theme); }
          if (data.accent_color) { setAccentState(data.accent_color); localStorage.setItem("gm-accent", data.accent_color); }
          if (data.font_size) { setFontSizeState(data.font_size); localStorage.setItem("gm-font-size", data.font_size); }
        }
      });
  }, [user]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      // Pure white + soft purple light mode
      root.style.setProperty("--background", "240 100% 98.5%"); // #F5F5FF-ish
      root.style.setProperty("--foreground", "240 30% 14%"); // #1A1A2E
      root.style.setProperty("--card", "0 0% 100%"); // pure white
      root.style.setProperty("--card-foreground", "240 30% 14%");
      root.style.setProperty("--popover", "0 0% 100%");
      root.style.setProperty("--popover-foreground", "240 30% 14%");
      root.style.setProperty("--muted", "245 60% 97%");
      root.style.setProperty("--muted-foreground", "240 15% 38%"); // #4A4A6A
      root.style.setProperty("--border", "245 80% 95%"); // #E8E8FF
      root.style.setProperty("--input", "245 60% 95%");
      root.classList.add("light-mode");
      root.classList.remove("dark-mode");
    } else {
      root.style.setProperty("--background", "270 100% 2%");
      root.style.setProperty("--foreground", "0 0% 98%");
      root.style.setProperty("--card", "270 30% 8%");
      root.style.setProperty("--card-foreground", "0 0% 98%");
      root.style.setProperty("--popover", "270 30% 8%");
      root.style.setProperty("--popover-foreground", "0 0% 98%");
      root.style.setProperty("--muted", "270 20% 15%");
      root.style.setProperty("--muted-foreground", "270 10% 55%");
      root.style.setProperty("--border", "270 20% 18%");
      root.style.setProperty("--input", "270 20% 18%");
      root.classList.add("dark-mode");
      root.classList.remove("light-mode");
    }
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    const hsl = ACCENT_HSL[accentColor] || ACCENT_HSL.purple;
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--accent", hsl.replace(/62%|55%|45%|60%/, "50%"));
    root.style.setProperty("--ring", hsl);
  }, [accentColor]);

  // Apply font size
  useEffect(() => {
    const sizes: Record<string, string> = { small: "14px", medium: "16px", large: "18px" };
    document.documentElement.style.fontSize = sizes[fontSize] || "16px";
  }, [fontSize]);

  const setTheme = (t: "dark" | "light") => {
    setThemeState(t);
    localStorage.setItem("gm-theme", t);
    if (user) {
      supabase.from("user_preferences").upsert({ user_id: user.id, theme: t }, { onConflict: "user_id" });
    }
  };

  const setAccentColor = (c: string) => {
    setAccentState(c);
    localStorage.setItem("gm-accent", c);
    if (user) {
      supabase.from("user_preferences").upsert({ user_id: user.id, accent_color: c }, { onConflict: "user_id" });
    }
  };

  const setFontSize = (s: string) => {
    setFontSizeState(s);
    localStorage.setItem("gm-font-size", s);
    if (user) {
      supabase.from("user_preferences").upsert({ user_id: user.id, font_size: s }, { onConflict: "user_id" });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, fontSize, setTheme, setAccentColor, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
