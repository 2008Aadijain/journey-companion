// Client-side Gemini helper. User's own API key (stored in localStorage).
// Key never leaves the user's device.

const MODEL = "gemini-2.0-flash";

export const GOALCIRCLE_SYSTEM_PROMPT = `
You are GoalCircle AI Assistant.
GoalCircle is a goal tracking app where users set goals and track daily progress with accountability partners.

Your job: Given a user's goal and current day number, provide:
1. One specific actionable daily task
2. Three YouTube search queries related to today's task

Rules:
- Tasks must be practical and completable in one day
- Tasks should progress logically (early days = basics, later days = advanced)
- YouTube queries must be specific and include "hindi" for Indian users
- Keep responses short and clear
- Never repeat the same task

Return ONLY this JSON, nothing else:
{
  "task": "Task title here",
  "taskDescription": "One sentence",
  "videos": [
    { "title": "Video title", "searchQuery": "youtube search query" },
    { "title": "Video title", "searchQuery": "youtube search query" },
    { "title": "Video title", "searchQuery": "youtube search query" }
  ]
}
`.trim();

interface GenerateOptions {
  prompt: string;
  system?: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export const getGeminiKey = (): string | null => {
  return localStorage.getItem("gm-gemini-key");
};

export const isAiActive = (): boolean => {
  return !!getGeminiKey() && localStorage.getItem("gm-ai-activated") === "true";
};

export async function callGemini({ prompt, system, json, temperature, maxTokens }: GenerateOptions): Promise<string> {
  const key = getGeminiKey();
  if (!key) throw new Error("No Gemini API key");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (system) {
    body.systemInstruction = { role: "system", parts: [{ text: system }] };
  }
  const generationConfig: Record<string, unknown> = {};
  if (json) generationConfig.responseMimeType = "application/json";
  if (typeof temperature === "number") generationConfig.temperature = temperature;
  if (typeof maxTokens === "number") generationConfig.maxOutputTokens = maxTokens;
  if (Object.keys(generationConfig).length) body.generationConfig = generationConfig;

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

export interface AiDailyBundle {
  task: string;
  taskDescription: string;
  videos: AiVideo[];
}

interface CachedBundle extends AiDailyBundle { day: number; date: string; }

const todayKey = () => new Date().toISOString().slice(0, 10);
const bundleCacheKey = (goalLabel: string, day: number) =>
  `gm-ai-bundle-${goalLabel}-${day}-${todayKey()}`;

/**
 * ONE Gemini call per user per day. Returns today's task + 3 video searches.
 * Cached in localStorage by goal + day + date so refresh never re-calls API.
 */
export async function getAiDailyBundle(
  goalLabel: string,
  category: string,
  day: number,
): Promise<AiDailyBundle> {
  const cacheKey = bundleCacheKey(goalLabel, day);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed: CachedBundle = JSON.parse(cached);
      if (parsed.date === todayKey() && parsed.day === day) {
        return { task: parsed.task, taskDescription: parsed.taskDescription, videos: parsed.videos };
      }
    } catch { /* ignore */ }
  }

  const userPrompt = `User goal: ${goalLabel}
Category: ${category}
Day number: ${day} of 30
Date: ${todayKey()}
Generate today's task and 3 related YouTube searches.`;

  const text = await callGemini({
    prompt: userPrompt,
    system: GOALCIRCLE_SYSTEM_PROMPT,
    json: true,
    temperature: 0.7,
    maxTokens: 300,
  });

  const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const bundle: AiDailyBundle = {
    task: String(parsed.task || "").trim(),
    taskDescription: String(parsed.taskDescription || "").trim(),
    videos: Array.isArray(parsed.videos)
      ? parsed.videos.slice(0, 3).map((v: { title?: string; searchQuery?: string }) => ({
          title: String(v.title || "").slice(0, 80),
          searchQuery: String(v.searchQuery || v.title || ""),
        })).filter((v: AiVideo) => v.searchQuery)
      : [],
  };

  if (!bundle.task || bundle.videos.length === 0) {
    throw new Error("Invalid AI response");
  }

  localStorage.setItem(
    cacheKey,
    JSON.stringify({ ...bundle, day, date: todayKey() } as CachedBundle),
  );
  return bundle;
}

// Back-compat wrappers — internally share the single bundle call so we never
// hit Gemini more than once per user per day.
export async function getAiDailyTask(goalLabel: string, category: string, day: number): Promise<string> {
  const b = await getAiDailyBundle(goalLabel, category, day);
  return b.task;
}

export async function getAiVideos(goalLabel: string, day: number, _taskText: string): Promise<AiVideo[]> {
  // category isn't strictly needed once cached; pass empty fallback if uncached.
  const cacheKey = bundleCacheKey(goalLabel, day);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return (JSON.parse(cached) as CachedBundle).videos; } catch { /* ignore */ }
  }
  return [];
}

export const youtubeSearchUrl = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
