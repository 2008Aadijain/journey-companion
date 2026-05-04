export interface VideoResource {
  title: string;
  url: string;
  thumbnail?: string;
}

const search = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const v = (title: string, query: string): VideoResource => ({ title, url: search(query) });

// Curated fallback search URLs (no per-video API call). Keyed by goal_label.
const VIDEOS_BY_GOAL: Record<string, VideoResource[]> = {
  "Start Business": [
    v("Business Ideas Hindi", "business ideas hindi 2024"),
    v("Startup Tips Hindi", "startup tips hindi"),
    v("Marketing Hindi", "digital marketing hindi"),
  ],
  "Learn Python": [
    v("Python Hindi Tutorial", "python tutorial hindi 2024"),
    v("Python Projects Hindi", "python projects hindi"),
    v("Python Tips Hindi", "python tips hindi"),
  ],
  "Learn Figma": [
    v("Figma Tutorial Hindi", "figma tutorial hindi 2024"),
    v("UI Design Hindi", "ui ux design hindi"),
    v("Figma Tips Hindi", "figma tips hindi"),
  ],
  "Learn Coding": [
    v("Web Dev Hindi", "web development hindi 2024"),
    v("HTML CSS Hindi", "html css hindi"),
    v("JavaScript Hindi", "javascript hindi beginners"),
  ],
  "Lose Weight": [
    v("Home Workout Hindi", "home workout hindi"),
    v("Weight Loss Hindi", "weight loss tips hindi"),
    v("Yoga Hindi", "yoga beginners hindi"),
  ],
  "Improve English": [
    v("Spoken English Hindi", "spoken english hindi"),
    v("English Speaking", "english speaking hindi"),
    v("English Grammar", "english grammar hindi"),
  ],
  "Get a Job": [
    v("Resume Kaise Banaye", "resume kaise banaye hindi"),
    v("Interview Tips Hindi", "interview tips hindi"),
    v("Job Search Hindi", "job search tips hindi"),
  ],
  "Build Reading Habit": [
    v("Reading Habit Hindi", "reading habit hindi"),
    v("Book Summary Hindi", "book summary hindi"),
    v("Speed Reading Hindi", "speed reading hindi"),
  ],
};

const VIDEOS_BY_CATEGORY: Record<string, VideoResource[]> = {
  Creative: VIDEOS_BY_GOAL["Learn Figma"],
  Learning: VIDEOS_BY_GOAL["Learn Python"],
  Fitness: VIDEOS_BY_GOAL["Lose Weight"],
  Business: VIDEOS_BY_GOAL["Start Business"],
  Career: VIDEOS_BY_GOAL["Get a Job"],
  Reading: VIDEOS_BY_GOAL["Build Reading Habit"],
  Custom: VIDEOS_BY_GOAL["Learn Python"],
};

export const getVideosForCategory = (categoryOrLabel: string, goalLabel?: string): VideoResource[] => {
  if (goalLabel && VIDEOS_BY_GOAL[goalLabel]) return VIDEOS_BY_GOAL[goalLabel];
  if (VIDEOS_BY_GOAL[categoryOrLabel]) return VIDEOS_BY_GOAL[categoryOrLabel];
  return VIDEOS_BY_CATEGORY[categoryOrLabel] || VIDEOS_BY_CATEGORY.Learning;
};
