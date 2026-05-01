// Client-side Gemini helper. User's own API key (stored in localStorage).
// Key never leaves the user's device.

const MODEL = "gemini-2.0-flash";

interface GenerateOptions {
  prompt: string;
  json?: boolean;
}

export const getGeminiKey = (): string | null => {
  return localStorage.getItem("gm-gemini-key");
};

export const isAiActive = (): boolean => {
  return !!getGeminiKey() && localStorage.getItem("gm-ai-activated") === "true";
};

export async function callGemini({ prompt, json }: GenerateOptions): Promise<string> {
  const key = getGeminiKey();
  if (!key) throw new Error("No Gemini API key");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (json) {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ??
    "";
  return text.trim();
}

export interface AiVideo {
  title: string;
  searchQuery: string;
}

interface CachedTask { day: number; date: string; task: string; }
interface CachedVideos { day: number; date: string; videos: AiVideo[]; taskKey: string; }

const todayKey = () => new Date().toISOString().slice(0, 10);

export async function getAiDailyTask(goalLabel: string, category: string, day: number): Promise<string> {
  // Cache PER-DAY so refresh doesn't regenerate, but midnight rollover gives new task.
  const cacheKey = `gm-ai-task-${goalLabel}-${day}-${todayKey()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed: CachedTask = JSON.parse(cached);
      if (parsed.date === todayKey() && parsed.day === day) return parsed.task;
    } catch { /* ignore */ }
  }

  const prompt = `You are a personal goal coach.
Goal: "${goalLabel}"
Category: ${category}
Day ${day} of 30.
Give ONE specific actionable task for today. Maximum 2 sentences. Be practical and motivating. Reply with ONLY the task text — no preamble, no quotes, no markdown.`;

  const task = await callGemini({ prompt });
  const clean = task.replace(/^["']|["']$/g, "").trim();
  localStorage.setItem(cacheKey, JSON.stringify({ day, date: todayKey(), task: clean } as CachedTask));
  return clean;
}

/**
 * Generate 3 YouTube search queries SPECIFIC to today's task.
 * Videos change daily because the underlying task changes daily.
 */
export async function getAiVideos(goalLabel: string, day: number, taskText: string): Promise<AiVideo[]> {
  const taskKey = (taskText || "").slice(0, 80);
  const cacheKey = `gm-ai-videos-${goalLabel}-${day}-${todayKey()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed: CachedVideos = JSON.parse(cached);
      if (parsed.date === todayKey() && parsed.day === day && parsed.taskKey === taskKey) return parsed.videos;
    } catch { /* ignore */ }
  }

  const prompt = `Today's task is "${taskText}" for goal "${goalLabel}".
Give me 3 specific YouTube search queries that would help with this task TODAY.
Return ONLY a JSON array (no markdown, no code fences) of objects with keys "title" (short label, max 60 chars) and "searchQuery" (the search text to use on YouTube).
Example: [{"title":"Figma plugins tutorial","searchQuery":"best figma plugins for designers 2024"}]`;

  const text = await callGemini({ prompt, json: true });
  let videos: AiVideo[] = [];
  try {
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      videos = parsed.slice(0, 3).map((v: { title?: string; searchQuery?: string }) => ({
        title: String(v.title || "").slice(0, 80),
        searchQuery: String(v.searchQuery || v.title || ""),
      })).filter(v => v.searchQuery);
    }
  } catch {
    return [];
  }

  localStorage.setItem(cacheKey, JSON.stringify({ day, date: todayKey(), videos, taskKey } as CachedVideos));
  return videos;
}

export const youtubeSearchUrl = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
