import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Lang = "en" | "hi" | "hg";

const DICT: Record<string, { en: string; hi: string; hg: string }> = {
  // Generic
  home: { en: "Home", hi: "होम", hg: "Home" },
  wall: { en: "Wall", hi: "दीवार", hg: "Wall" },
  chat: { en: "Chat", hi: "चैट", hg: "Chat" },
  friends: { en: "Friends", hi: "दोस्त", hg: "Friends" },
  profile: { en: "Profile", hi: "प्रोफाइल", hg: "Profile" },
  settings: { en: "Settings", hi: "सेटिंग्स", hg: "Settings" },
  save: { en: "Save", hi: "सेव", hg: "Save karo" },
  cancel: { en: "Cancel", hi: "रद्द करें", hg: "Cancel" },
  language: { en: "Language", hi: "भाषा", hg: "Language" },

  // Dashboard — per spec
  your_streak: { en: "Your Streak", hi: "आपकी स्ट्रीक", hg: "Tera Streak" },
  daily_checkin: { en: "Daily Check-in", hi: "आज का चेक-इन", hg: "Aaj ka Check-in" },
  todays_task: { en: "Today's Task", hi: "आज का काम", hg: "Aaj ka Task" },
  learning_resources: { en: "Learning Resources", hi: "सीखने के साधन", hg: "Learning ke Resources" },
  your_goalmate: { en: "Your GoalCircle Mate", hi: "आपका गोलसर्कल साथी", hg: "Tera GoalCircle Mate" },
  progress_wall: { en: "Progress Wall", hi: "प्रगति दीवार", hg: "Progress Wall" },
  finding_mate: { en: "Finding your mate...", hi: "साथी ढूंढा जा रहा है...", hg: "Tera mate dhundha ja raha hai..." },
  check_in: { en: "Check In (+10 XP)", hi: "चेक इन करें (+10 XP)", hg: "Check In karo (+10 XP)" },
  add_proof: { en: "Add proof (optional)", hi: "प्रमाण जोड़ें (वैकल्पिक)", hg: "Proof add karo (optional)" },
  daily_suggestion: { en: "Daily Suggestion", hi: "आज का सुझाव", hg: "Aaj ka Suggestion" },
  todays_motivation: { en: "Today's Motivation", hi: "आज की प्रेरणा", hg: "Aaj ki Motivation" },

  my_goal: { en: "My Goal", hi: "मेरा लक्ष्य", hg: "Mera Goal" },
  find_new_mate: { en: "Find New Mate", hi: "नया साथी खोजें", hg: "Naya Mate dhundo" },
  keep_waiting: { en: "Keep Waiting", hi: "इंतज़ार करें", hg: "Wait karo" },
  days: { en: "days", hi: "दिन", hg: "din" },
  day: { en: "Day", hi: "दिन", hg: "Day" },
  days_left: { en: "days left", hi: "दिन बचे", hg: "din baaki" },
  complete: { en: "complete", hi: "पूरा", hg: "complete" },
  already_checked_in: { en: "Already checked in!", hi: "आज चेक-इन हो चुका है!", hg: "Aaj check-in ho gaya!" },
  see_you_tomorrow: { en: "See you tomorrow — keep the streak alive 🔥", hi: "कल मिलते हैं — स्ट्रीक बनाए रखें 🔥", hg: "Kal milte hain — streak banaye rakho 🔥" },
  checkin_placeholder: { en: "What did you do today for your goal? (min 6 words)", hi: "आज अपने लक्ष्य के लिए क्या किया? (कम से कम 6 शब्द)", hg: "Aaj goal ke liye kya kiya? (min 6 words)" },
  words_min: { en: "words minimum", hi: "शब्द ज़रूरी", hg: "words minimum" },
  please_write_6: { en: "Please write at least 6 words", hi: "कम से कम 6 शब्द लिखें", hg: "Kam se kam 6 words likho" },
  shield_available: { en: "🛡️ 1 shield available", hi: "🛡️ 1 शील्ड उपलब्ध", hg: "🛡️ 1 shield available" },
  shield_used: { en: "Shield used this week", hi: "इस हफ्ते शील्ड इस्तेमाल हुई", hg: "Is hafte shield use ho gayi" },
  shield_tooltip: { en: "🛡️ Streak Shield protects you from missing one day this week!", hi: "🛡️ स्ट्रीक शील्ड आपको हफ्ते में एक दिन छूटने से बचाती है!", hg: "🛡️ Streak Shield tujhe hafte mein ek din miss karne se bachati hai!" },
  active_today: { en: "🟢 Active today", hi: "🟢 आज सक्रिय", hg: "🟢 Aaj active" },
  not_checked_in: { en: "😴 Not checked in yet", hi: "😴 अभी चेक-इन नहीं किया", hg: "😴 Abhi check-in nahi kiya" },
  on_streak: { en: "🔥 On a streak!", hi: "🔥 स्ट्रीक पर!", hg: "🔥 Streak pe!" },

  add_friend: { en: "Add Friend", hi: "दोस्त बनाएँ", hg: "Friend banao" },
  friend_request_sent: { en: "Friend request sent", hi: "फ्रेंड रिक्वेस्ट भेजी", hg: "Friend request bhej di" },
  already_friends: { en: "✅ Friends", hi: "✅ दोस्त", hg: "✅ Friends" },
  pending: { en: "⏳ Pending", hi: "⏳ बाकी", hg: "⏳ Pending" },
  requests: { en: "Requests", hi: "रिक्वेस्ट", hg: "Requests" },
  groups: { en: "Groups", hi: "ग्रुप", hg: "Groups" },
  direct: { en: "Direct", hi: "डायरेक्ट", hg: "Direct" },
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
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("gm-lang");
    if (stored === "en" || stored === "hi" || stored === "hg") return stored;
    return "en";
  });

  // Load from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("language")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const l = data?.language;
        if (l === "en" || l === "hi" || l === "hg") {
          setLangState(l);
          localStorage.setItem("gm-lang", l);
        }
      });
  }, [user]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("gm-lang", l);
    document.documentElement.setAttribute("lang", l === "hg" ? "en" : l);
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
