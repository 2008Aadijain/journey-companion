// Client-side content moderation for all chat surfaces.
// Returns { ok: true } when the message is allowed, otherwise { ok: false, error }.

export type ModerationResult = { ok: true } | { ok: false, error: string };

// ---------- 1. PHONE NUMBERS ----------
const NUM_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  oh: "0", o: "0",
};
const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

const PHONE_ERROR = "📵 Phone numbers cannot be shared for safety reasons.";

const containsPhoneNumber = (text: string): boolean => {
  const stripped = text.replace(/[\s\-().]/g, "");
  // +91 prefix or 10+ consecutive digits
  if (/(\+?\d{10,15})/.test(stripped)) return true;
  // Words → digits
  const lower = " " + text.toLowerCase().replace(/[^a-z\s]/g, " ") + " ";
  let digitRun = 0;
  let maxRun = 0;
  for (const word of lower.split(/\s+/)) {
    if (NUM_WORDS[word] !== undefined || ROMAN[word] !== undefined) {
      digitRun++;
      maxRun = Math.max(maxRun, digitRun);
    } else {
      digitRun = 0;
    }
  }
  return maxRun >= 5;
};

// ---------- 2. SOCIAL MEDIA ----------
const SOCIAL_ERROR = "🚫 Social media IDs cannot be shared. Connect through GoalCircle only!";
const SOCIAL_PATTERNS: RegExp[] = [
  /\binstagram\.com\b/i, /\binsta\b/i, /\big\b\s*[:=-]/i,
  /\bwhatsapp\b/i, /\bwa\.me\b/i,
  /\bsnapchat\b/i, /\bsnap\s*chat\b/i,
  /\bfacebook\.com\b/i, /\bfb\.com\b/i, /\bfb\b/i,
  /\btwitter\.com\b/i, /\bx\.com\b/i,
  /\bt\.me\b/i, /\btelegram\b/i,
  /\byoutube\.com\/(channel|c|user|@)/i,
  /\btiktok\.com\b/i, /\bdiscord\.gg\b/i,
  /(^|[\s])@[a-z0-9._]{3,}/i, // @username
];
const containsSocial = (text: string): boolean =>
  SOCIAL_PATTERNS.some(re => re.test(text));

// ---------- 3. ILLEGAL / SCAM ----------
const ILLEGAL_ERROR = "⚠️ This message violates GoalCircle community guidelines.";
const ILLEGAL_KEYWORDS = [
  // scam / financial
  "send money", "send cash", "bank account", "account number", "ifsc",
  "upi id", "upi:", "paytm", "gpay", "google pay", "phonepe",
  "transfer money", "western union", "bitcoin address", "crypto wallet",
  // drugs / weapons / violence
  "cocaine", "heroin", "weed dealer", "buy drugs", "sell drugs",
  "gun for sale", "pistol", "ak47", "ammo", "kill you", "i'll kill",
  // adult
  "porn", "xxx ", "nude pics", "sex chat", "sexting",
  // hate
  "kill all", "go die", "lynch",
];
const containsIllegal = (text: string): boolean => {
  const t = text.toLowerCase();
  return ILLEGAL_KEYWORDS.some(k => t.includes(k));
};

// ---------- 4. BAD WORDS (English + Hindi/Hinglish) ----------
const BADWORD_ERROR = "🙏 Please keep conversations respectful and positive!";
const BAD_WORDS = [
  // English
  "fuck", "fck", "f*ck", "shit", "bitch", "bastard", "asshole", "dick",
  "pussy", "cunt", "slut", "whore", "motherfucker", "mf", "stfu",
  // Hindi / Hinglish (transliterated)
  "bhosdi", "bhosdike", "bhosdk", "madarchod", "mc ", " mc", "bc ", " bc",
  "behenchod", "chutiya", "chutiye", "chutiyaa", "gandu", "gaand",
  "lund", "land ", "lauda", "laude", "randi", "raand",
  "harami", "kutta sala", "saala kutta", "kamina", "kamine",
];
const containsBadWord = (text: string): boolean => {
  const t = " " + text.toLowerCase().replace(/[^a-z\s]/g, " ") + " ";
  return BAD_WORDS.some(w => t.includes(w));
};

// ---------- 5. EXTERNAL LINKS ----------
const LINK_ERROR = "🔗 External links cannot be shared for your safety.";
const LINK_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /www\./i,
  /\b[a-z0-9-]+\.(com|in|org|net|io|co|me|app|info|biz|dev|xyz|gg|ly|to)\b/i,
  /\bbit\.ly\b/i, /\btinyurl\b/i, /\bt\.co\b/i, /\bgoo\.gl\b/i,
];
const containsLink = (text: string): boolean =>
  LINK_PATTERNS.some(re => re.test(text));

// ---------- MAIN ----------
export const moderateMessage = (text: string): ModerationResult => {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true };

  if (containsLink(trimmed)) return { ok: false, error: LINK_ERROR };
  if (containsPhoneNumber(trimmed)) return { ok: false, error: PHONE_ERROR };
  if (containsSocial(trimmed)) return { ok: false, error: SOCIAL_ERROR };
  if (containsIllegal(trimmed)) return { ok: false, error: ILLEGAL_ERROR };
  if (containsBadWord(trimmed)) return { ok: false, error: BADWORD_ERROR };
  return { ok: true };
};

// ---------- VIOLATION TRACKING ----------
// Persistent across reloads via localStorage, resets after 24h.
// 1st violation: warning. 2nd: stronger warning. 3rd: 1-hour mute.

const VIOL_KEY = "gm-mod-violations";
const MUTE_KEY = "gm-mod-muted-until";
const RESET_MS = 24 * 60 * 60 * 1000;
const MUTE_MS = 60 * 60 * 1000;

interface ViolState { count: number; firstAt: number; }

const readState = (): ViolState => {
  try {
    const raw = localStorage.getItem(VIOL_KEY);
    if (!raw) return { count: 0, firstAt: 0 };
    const s = JSON.parse(raw) as ViolState;
    if (Date.now() - s.firstAt > RESET_MS) return { count: 0, firstAt: 0 };
    return s;
  } catch { return { count: 0, firstAt: 0 }; }
};

export const isMuted = (): { muted: boolean; minutesLeft: number } => {
  const until = Number(localStorage.getItem(MUTE_KEY) || 0);
  if (until > Date.now()) {
    return { muted: true, minutesLeft: Math.ceil((until - Date.now()) / 60000) };
  }
  return { muted: false, minutesLeft: 0 };
};

// Records a violation, returns the message to show the user.
export const recordViolation = (baseError: string): string => {
  const now = Date.now();
  const state = readState();
  const next: ViolState = {
    count: state.count + 1,
    firstAt: state.count === 0 ? now : state.firstAt,
  };
  localStorage.setItem(VIOL_KEY, JSON.stringify(next));

  if (next.count >= 3) {
    localStorage.setItem(MUTE_KEY, String(now + MUTE_MS));
    return "🚫 You have been temporarily restricted from sending messages for 1 hour.";
  }
  if (next.count === 2) {
    return "⚠️ Second warning! Please follow community guidelines.\n" + baseError;
  }
  return baseError;
};

// Convenience: check moderation + mute, return null if allowed, else error string.
export const checkBeforeSend = (text: string): string | null => {
  const m = isMuted();
  if (m.muted) return `🚫 You're muted for ${m.minutesLeft} more minute${m.minutesLeft === 1 ? "" : "s"}.`;
  const result = moderateMessage(text);
  if (result.ok) return null;
  return recordViolation(result.error);
};
