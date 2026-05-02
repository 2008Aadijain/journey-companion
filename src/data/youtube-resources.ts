export interface VideoResource {
  title: string;
  thumbnail: string;
  url: string;
}

const thumb = (id: string) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
const watch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const v = (title: string, id: string): VideoResource => ({ title, thumbnail: thumb(id), url: watch(id) });

// Keyed by goal_label (matches what's stored in profile.goal_label)
const VIDEOS_BY_GOAL: Record<string, VideoResource[]> = {
  "Learn Figma": [
    v("Figma Tutorial Hindi", "II-6dDzc-80"),
    v("UI Design Beginners", "_K06Dni-RE4"),
    v("Figma Complete Course", "HZuk6Wkx_Eg"),
  ],
  "Learn Python": [
    v("Python Hindi Tutorial", "UrsmFxEIp5k"),
    v("Python for Beginners", "_uQrJ0TkZlc"),
    v("Python Projects", "8ext9G7xspg"),
  ],
  "Learn Coding": [
    v("Web Dev Hindi", "tVzUXW6siu0"),
    v("HTML CSS Hindi", "BsDoLVMnmZs"),
    v("JavaScript Hindi", "hKB-YGF14SY"),
  ],
  "Lose Weight": [
    v("Home Workout Hindi", "UItWltVZZmE"),
    v("Weight Loss Tips", "8Sm0sKwCwRs"),
    v("Yoga for Beginners", "v7AYKMP6rOE"),
  ],
  "Start Business": [
    v("Business Ideas Hindi", "ZpzNzjMOJtY"),
    v("Startup Tips Hindi", "9pobMYmCGzQ"),
    v("Marketing Tips", "oBYzH2bJSbg"),
  ],
  "Improve English": [
    v("Spoken English Hindi", "_9WTPF-J3mY"),
    v("English Speaking", "53bVMMLiLDY"),
    v("English Grammar", "9o5zAMEHCYQ"),
  ],
  "Get a Job": [
    v("Resume Kaise Banaye", "y8YH0Qbu5h4"),
    v("Interview Tips Hindi", "HG68Ymazo18"),
    v("Job Search Tips", "BVPiAMWABu8"),
  ],
  "Build Reading Habit": [
    v("Reading Habit Hindi", "YQOrqAKKcUQ"),
    v("Book Summary Hindi", "7bB_KgjCa_A"),
    v("Speed Reading Tips", "ZwEquW_Yij0"),
  ],
};

// Fallback by category for older/custom goals
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
