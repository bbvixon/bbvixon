export type DesignStory = {
  title: string;
  role: string;
  summary: string;
  outcome: string;
  tags: string[];
  thumbnailUrl?: string;
  documentUrl?: string;
  redesignDocumentUrl?: string;
  pageImages?: string[];
  status?: "ready" | "placeholder";
};

export type CreatorVideo = {
  title: string;
  displayTitle?: string;
  videoId: string;
  description: string;
  category: "My Directions" | "My Camera Works";
  year: string;
  runtime: string;
  thumbnailUrl?: string;
  genre?: string;
  cast?: string[];
  crew?: string[];
};

export const designStories: DesignStory[] = [
  {
    title: "Spaid",
    role: "UX Case Study",
    summary:
      "A first-time visitor journey for a payment and service experience, presented through mobile UI screens and product storytelling.",
    outcome:
      "The study focuses on clarity, trust, onboarding, payment discovery, and making a complex service feel approachable.",
    tags: ["UX", "Mobile app", "Payments"],
    thumbnailUrl: "/design/spaid-thumb.png",
    documentUrl: "/design/spaid-user-story.pdf",
    pageImages: Array.from({ length: 19 }, (_, index) =>
      `/design/spaid-pages/page-${String(index + 1).padStart(2, "0")}.png`,
    ),
    status: "ready",
  },
  {
    title: "Playmore",
    role: "UX Story",
    summary:
      "A sports community app concept that helps people find players, join games, and build local activity circles.",
    outcome:
      "The case study covers research, interviews, survey insights, persona, wireframes, UI screens, and a green sports-focused design system.",
    tags: ["UX Research", "Community", "App design"],
    thumbnailUrl: "/design/playmore-thumb.png",
    documentUrl: "/design/playmore-user-story.pdf",
    pageImages: ["/design/playmore-pages/page.png"],
    status: "ready",
  },
  {
    title: "AB Pharma",
    role: "Enterprise UX Story",
    summary:
      "A pharmaceutical transfer hub for packaging submissions, routing by region, and tracking upload progress.",
    outcome:
      "Refreshed with SSO, regional roles, dashboards, package automation, and audit-ready status visibility.",
    tags: ["Enterprise UX", "Regulatory", "Dashboard"],
    thumbnailUrl: "/design/ab-pharma-thumb.svg",
    documentUrl: "/design/ab-pharma.pdf",
    redesignDocumentUrl: "/design/ab-pharma-redesigned-web-experience.pdf",
    pageImages: Array.from({ length: 8 }, (_, index) =>
      `/design/ab-pharma-redesigned-pages/page-${index + 1}.png`,
    ),
    status: "ready",
  },
];

export const creatorVideos: CreatorVideo[] = [
  {
    title: "Featured film from Basil Bose",
    displayTitle: "Featured",
    videoId: "dQw4w9WgXcQ",
    description:
      "Replace this placeholder with a video ID from the Basil Bose YouTube channel.",
    category: "My Directions",
    year: "2026",
    runtime: "3 min",
    genre: "Short Film",
    cast: ["Basil Bose"],
    crew: ["Direction: Basil Bose"],
  },
  {
    title: "Short film / creator showcase",
    displayTitle: "Short",
    videoId: "ysz5S6PUM-U",
    description:
      "Thumbnails use YouTube's image endpoint, and clicking opens the embedded player.",
    category: "My Directions",
    year: "2025",
    runtime: "5 min",
    genre: "Short Film",
    cast: ["Basil Bose"],
    crew: ["Direction: Basil Bose"],
  },
  {
    title: "Behind the scenes / visual story",
    displayTitle: "Behind",
    videoId: "jNQXAC9IVRw",
    description:
      "This card structure is ready for your real channel movies once we confirm the IDs.",
    category: "My Camera Works",
    year: "2025",
    runtime: "2 min",
    genre: "Cinematography",
    cast: ["Basil Bose"],
    crew: ["Camera: Basil Bose"],
  },
  {
    title: "Visual experiment",
    displayTitle: "Visual",
    videoId: "ScMzIvxBSi4",
    description:
      "A cinematic slot for experiments, edits, or mood-driven creator work.",
    category: "My Camera Works",
    year: "2024",
    runtime: "4 min",
    genre: "Visual Experiment",
    cast: ["Basil Bose"],
    crew: ["Camera: Basil Bose"],
  },
  {
    title: "Creator diary",
    displayTitle: "Creator",
    videoId: "aqz-KE-bpKQ",
    description:
      "Use this row for process videos, making-of clips, or personal creator notes.",
    category: "My Camera Works",
    year: "2024",
    runtime: "6 min",
    genre: "Behind the Scenes",
    cast: ["Basil Bose"],
    crew: ["Camera: Basil Bose"],
  },
];

export const links = {
  currentPortfolio: "https://basilbose.wixsite.com/bbvixon",
  designStories: "https://basilbose.wixsite.com/bbvixon/blank",
  linkedin: "https://www.linkedin.com/in/basilbosebb/",
  youtube: "https://www.youtube.com/user/basilbose",
};

export const youtubeConfig = {
  username: "basilbose",
  channelId: import.meta.env.VITE_YOUTUBE_CHANNEL_ID || "UCaAy0DUXWjrq195IAb6b72A",
  playlistId: import.meta.env.VITE_YOUTUBE_PLAYLIST_ID || "PLL5SSU2xMWvU",
  apiKey: import.meta.env.VITE_YOUTUBE_API_KEY,
};

