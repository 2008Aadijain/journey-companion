export interface VideoResource {
  title: string;
  thumbnail: string;
  url: string;
}

const YOUTUBE_RESOURCES: Record<string, VideoResource[]> = {
  Creative: [
    { title: "Figma Tutorial Hindi", thumbnail: "https://img.youtube.com/vi/FTFaQWZBqQ8/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=figma+tutorial+hindi" },
    { title: "UI Design for Beginners", thumbnail: "https://img.youtube.com/vi/c9Wg6Cb_YlU/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=ui+design+figma+hindi" },
    { title: "Canva Design Tips & Tricks", thumbnail: "https://img.youtube.com/vi/zJSg8fCDfBo/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=canva+design+tutorial+hindi" },
  ],
  Learning: [
    { title: "Python Tutorial Hindi", thumbnail: "https://img.youtube.com/vi/gfDE2a7MKjA/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=python+tutorial+hindi+beginners" },
    { title: "Python Projects for Beginners", thumbnail: "https://img.youtube.com/vi/zOjov-2OZ0E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=python+projects+hindi" },
    { title: "Web Development Hindi", thumbnail: "https://img.youtube.com/vi/5_5oE5lgrhw/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=web+development+hindi" },
  ],
  Fitness: [
    { title: "Home Workout for Beginners", thumbnail: "https://img.youtube.com/vi/UBMk30rjy0o/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=home+workout+beginners+hindi" },
    { title: "Weight Loss Tips Hindi", thumbnail: "https://img.youtube.com/vi/gMaB-fG14UM/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=weight+loss+tips+hindi" },
    { title: "Yoga for Beginners", thumbnail: "https://img.youtube.com/vi/v7AYKMP6rOE/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=yoga+beginners+hindi" },
  ],
  Business: [
    { title: "Business Ideas Hindi", thumbnail: "https://img.youtube.com/vi/ZZ7Nb07N5Qk/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=business+ideas+hindi+2026" },
    { title: "How to Start Startup", thumbnail: "https://img.youtube.com/vi/wvVPdyYeaQU/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=startup+kaise+shuru+kare+hindi" },
    { title: "Marketing Tips for Beginners", thumbnail: "https://img.youtube.com/vi/KQya6I68Xu4/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=marketing+tips+hindi" },
  ],
  Career: [
    { title: "Spoken English Hindi", thumbnail: "https://img.youtube.com/vi/M-v7EkuY_r4/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=spoken+english+hindi" },
    { title: "English Speaking Practice", thumbnail: "https://img.youtube.com/vi/1qw5ITr3k9E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=english+speaking+practice+hindi" },
    { title: "Resume Kaise Banaye", thumbnail: "https://img.youtube.com/vi/y8YH0Qbu5h4/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=resume+kaise+banaye+hindi" },
    { title: "Interview Tips Hindi", thumbnail: "https://img.youtube.com/vi/1qw5ITr3k9E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=interview+tips+hindi" },
  ],
  Reading: [
    { title: "Reading Habit Kaise Banaye", thumbnail: "https://img.youtube.com/vi/gfDE2a7MKjA/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=reading+habit+kaise+banaye" },
    { title: "Best Books Summary Hindi", thumbnail: "https://img.youtube.com/vi/zOjov-2OZ0E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=best+books+summary+hindi" },
  ],
  Custom: [
    { title: "Productivity Tips Hindi", thumbnail: "https://img.youtube.com/vi/gfDE2a7MKjA/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=productivity+tips+hindi" },
    { title: "Goal Setting Guide Hindi", thumbnail: "https://img.youtube.com/vi/zOjov-2OZ0E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=goal+setting+guide+hindi" },
  ],
};

export const getVideosForCategory = (category: string): VideoResource[] => {
  return YOUTUBE_RESOURCES[category] || YOUTUBE_RESOURCES.Learning;
};
