export interface VideoResource {
  title: string;
  thumbnail: string;
  url: string;
}

const YOUTUBE_RESOURCES: Record<string, VideoResource[]> = {
  Creative: [
    { title: "Figma Tutorial for Beginners (Hindi)", thumbnail: "https://img.youtube.com/vi/FTFaQWZBqQ8/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=figma+tutorial+hindi" },
    { title: "UI/UX Design Crash Course", thumbnail: "https://img.youtube.com/vi/c9Wg6Cb_YlU/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=ui+ux+design+tutorial+hindi" },
    { title: "Canva Design Tips & Tricks", thumbnail: "https://img.youtube.com/vi/zJSg8fCDfBo/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=canva+design+tutorial+hindi" },
  ],
  Learning: [
    { title: "Python Tutorial for Beginners (Hindi)", thumbnail: "https://img.youtube.com/vi/gfDE2a7MKjA/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=python+tutorial+hindi" },
    { title: "Coding for Beginners — Full Course", thumbnail: "https://img.youtube.com/vi/zOjov-2OZ0E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=coding+tutorial+hindi" },
    { title: "DSA in Hindi — Complete Roadmap", thumbnail: "https://img.youtube.com/vi/5_5oE5lgrhw/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=dsa+tutorial+hindi" },
  ],
  Fitness: [
    { title: "Home Workout — No Equipment", thumbnail: "https://img.youtube.com/vi/UBMk30rjy0o/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=workout+tutorial+hindi" },
    { title: "Weight Loss Tips (Hindi)", thumbnail: "https://img.youtube.com/vi/gMaB-fG14UM/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=weight+loss+hindi" },
    { title: "Yoga for Beginners", thumbnail: "https://img.youtube.com/vi/v7AYKMP6rOE/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=yoga+beginners+hindi" },
  ],
  Business: [
    { title: "Business Ideas 2024 (Hindi)", thumbnail: "https://img.youtube.com/vi/ZZ7Nb07N5Qk/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=business+ideas+hindi" },
    { title: "How to Start a Startup", thumbnail: "https://img.youtube.com/vi/wvVPdyYeaQU/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=startup+guide+hindi" },
    { title: "Marketing Tips for Beginners", thumbnail: "https://img.youtube.com/vi/KQya6I68Xu4/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=marketing+tips+hindi" },
  ],
  Career: [
    { title: "Spoken English — Full Course", thumbnail: "https://img.youtube.com/vi/M-v7EkuY_r4/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=spoken+english+tutorial" },
    { title: "Interview Tips in Hindi", thumbnail: "https://img.youtube.com/vi/1qw5ITr3k9E/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=interview+preparation+hindi" },
    { title: "Resume Building Guide", thumbnail: "https://img.youtube.com/vi/y8YH0Qbu5h4/mqdefault.jpg", url: "https://www.youtube.com/results?search_query=resume+building+hindi" },
  ],
};

export const getVideosForCategory = (category: string): VideoResource[] => {
  return YOUTUBE_RESOURCES[category] || YOUTUBE_RESOURCES.Learning;
};
