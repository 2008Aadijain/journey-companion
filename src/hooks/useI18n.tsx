import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Lang = "en" | "hi";

const DICT: Record<string, { en: string; hi: string }> = {
  // Generic
  home: { en: "Home", hi: "होम" },
  wall: { en: "Wall", hi: "दीवार" },
  chat: { en: "Chat", hi: "चैट" },
  friends: { en: "Friends", hi: "दोस्त" },
  profile: { en: "Profile", hi: "प्रोफाइल" },
  settings: { en: "Settings", hi: "सेटिंग्स" },
  save: { en: "Save", hi: "सेव" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  language: { en: "Language", hi: "भाषा" },

  // Dashboard
  daily_checkin: { en: "Daily Check-in", hi: "आज का चेक-इन" },
  your_goalmate: { en: "Your GoalCircle", hi: "आपका गोलमेट" },
  todays_task: { en: "Today's Task", hi: "आज का काम" },
  progress_wall: { en: "Progress Wall", hi: "प्रगति दीवार" },
  check_in: { en: "Check In", hi: "चेक इन करें" },
  learning_resources: { en: "Learning Resources", hi: "सीखने के साधन" },
  find_new_mate: { en: "Find New Mate", hi: "नया साथी खोजें" },
  keep_waiting: { en: "Keep Waiting", hi: "इंतज़ार करें" },
  my_goal: { en: "My Goal", hi: "मेरा लक्ष्य" },
  your_streak: { en: "Your streak", hi: "आपकी स्ट्रीक" },
  days: { en: "days", hi: "दिन" },
  day: { en: "Day", hi: "दिन" },
  days_left: { en: "days left", hi: "दिन बचे" },
  complete: { en: "complete", hi: "पूरा" },
  already_checked_in: { en: "Already checked in!", hi: "आज चेक-इन हो चुका है!" },
  see_you_tomorrow: { en: "See you tomorrow — keep the streak alive 🔥", hi: "कल मिलते हैं — स्ट्रीक बनाए रखें 🔥" },
  checkin_placeholder: { en: "What did you do today for your goal? (min 6 words)", hi: "आज अपने लक्ष्य के लिए क्या किया? (कम से कम 6 शब्द)" },
  words_min: { en: "words minimum", hi: "शब्द ज़रूरी" },
  please_write_6: { en: "Please write at least 6 words", hi: "कम से कम 6 शब्द लिखें" },
  add_proof: { en: "Add proof 📸 (optional)", hi: "फोटो जोड़ें 📸 (वैकल्पिक)" },
  shield_available: { en: "🛡️ 1 shield available", hi: "🛡️ 1 शील्ड उपलब्ध" },
  shield_used: { en: "Shield used this week", hi: "इस हफ्ते शील्ड इस्तेमाल हुई" },
  shield_tooltip: { en: "🛡️ Streak Shield protects you from missing one day this week!", hi: "🛡️ स्ट्रीक शील्ड आपको हफ्ते में एक दिन छूटने से बचाती है!" },
  active_today: { en: "🟢 Active today", hi: "🟢 आज सक्रिय" },
  not_checked_in: { en: "😴 Not checked in yet", hi: "😴 अभी चेक-इन नहीं किया" },
  on_streak: { en: "🔥 On a streak!", hi: "🔥 स्ट्रीक पर!" },

  // Friends / Chat
  add_friend: { en: "Add Friend", hi: "दोस्त बनाएँ" },
  friend_request_sent: { en: "Friend request sent", hi: "फ्रेंड रिक्वेस्ट भेजी" },
  already_friends: { en: "✅ Friends", hi: "✅ दोस्त" },
  pending: { en: "⏳ Pending", hi: "⏳ बाकी" },
  requests: { en: "Requests", hi: "रिक्वेस्ट" },
  groups: { en: "Groups", hi: "ग्रुप" },
  direct: { en: "Direct", hi: "डायरेक्ट" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT | string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k as string,
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("gm-lang") as Lang) || "en");

  // Load from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("language")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.language && (data.language === "en" || data.language === "hi")) {
          setLangState(data.language as Lang);
          localStorage.setItem("gm-lang", data.language);
        }
      });
  }, [user]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("gm-lang", l);
    document.documentElement.setAttribute("lang", l);
    if (user) {
      supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, language: l }, { onConflict: "user_id" })
        .then(() => {});
    }
  }, [user]);

  const t = useCallback((key: string) => {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[lang] || entry.en;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
