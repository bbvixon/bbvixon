export type DesignStorySection = {
  eyebrow?: string;
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type DesignStory = {
  slug: string;
  title: string;
  role: string;
  summary: string;
  outcome: string;
  tags: string[];
  thumbnailUrl?: string;
  documentUrl?: string;
  redesignDocumentUrl?: string;
  pageImages?: string[];
  figmaUrl?: string;
  sections?: DesignStorySection[];
  published?: boolean;
  sortOrder?: number;
  status?: "ready" | "placeholder";
};

export type PortfolioApp = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  url: string;
  iconUrl: string;
  category: string;
  platform: string;
  published?: boolean;
  sortOrder?: number;
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
    slug: "may.be",
    title: "may.be",
    role: "AI Product Design Story",
    summary:
      "A voice-first decision-making experience that turns a difficult human situation into an explorable map of possible paths.",
    outcome:
      "The design replaces dashboards and advice cards with a calm, cinematic flow: listen, surface meaning, reveal the decision seed, and grow an organic choice tree.",
    tags: ["AI UX", "Voice interface", "Decision mapping"],
    thumbnailUrl: "/design/may-be-figma-screens.svg",
    documentUrl: "/design/may-be-figma-screens.svg",
    figmaUrl:
      "https://www.figma.com/design/077S09CY8D9ysDLe9udaed/Mobile-App-Wireframes-and-UI-Design?node-id=6-240&t=XD4GgFBy4oUCXGMY-0",
    status: "ready",
  },
  {
    slug: "suzuki-connect-one",
    title: "Suzuki Connect ONE",
    role: "Connected Car UX Case Study",
    summary:
      "A connected-car experience proposal that turns vehicle telemetry, remote commands, maintenance, and family sharing into information owners can understand and trust.",
    outcome:
      "The concept combines first-week discovery with a confidence layer for data freshness, honest command states, offline recovery, and clear vehicle-care pathways.",
    tags: ["Connected car", "Trust UX", "Service design"],
    thumbnailUrl: "/design/suzuki-connect-device-montage.png",
    sections: [
      {
        eyebrow: "The opportunity",
        title: "Connected should mean confident",
        body:
          "Suzuki Connect already offers live tracking, geofences, supported remote operations, vehicle-health information, trip history, and access through devices such as smartwatches and Alexa. Feature availability depends on the vehicle model and variant.\n\nThe case study asks how that capability can support two moments at once: helping new owners discover value during their first week, and helping returning owners trust the app during everyday use.",
      },
      {
        eyebrow: "Customer evidence",
        title: "The trust gap appears when data becomes uncertain",
        body:
          "Selected public app reviews and community discussions point to recurring friction: vehicle location or fuel information can appear stale, remote actions may fail without a clear recovery path, renewal can leave the app, and some owners experience a fragmented journey across separate products.\n\nThese signals informed the design direction. They are research inputs to validate, not claims that every owner encounters the same problems.",
      },
      {
        eyebrow: "Market framing",
        title: "Feature parity is crowded, so trust becomes the position",
        body:
          "Suzuki Connect has a strong functional baseline across remote operations, location, geofencing, health information, and trip behaviour. Hyundai Bluelink and Kia Connect show how competitors extend that baseline through deeper diagnostics, health reporting, valet privacy, profiles, calendar links, and connected navigation.\n\nThe proposal therefore focuses less on adding a longer feature list and more on making every important state recent, explainable, and recoverable.",
      },
      {
        eyebrow: "Product strategy",
        title: "Two engines support one ownership experience",
        body:
          "The discovery engine introduces My Suzuki Day, a calm pre-drive briefing that shows useful connected features from the start. The confidence engine adds timestamps, command acknowledgement, explicit unknown states, and practical recovery when connectivity fails.\n\nDiscovery gives owners a reason to try the product. Reliability gives them a reason to return.",
        imageUrl: "/design/suzuki-connect-device-montage.png",
        imageAlt: "Suzuki Connect shown across vehicle status, location, driving analytics, and vehicle health screens",
      },
      {
        eyebrow: "Experience architecture",
        title: "Ready, Live, and Care",
        body:
          "Ready prepares the next drive with saved destinations, departure context, range information when available, and reminders. Live communicates the freshness of vehicle data and separates a request from a confirmed action. Care translates verified vehicle signals into understandable maintenance information and guided support.\n\nTogether, these layers create one journey from first-week discovery to long-term ownership support.",
      },
      {
        eyebrow: "Daily delight",
        title: "My Suzuki Day makes the next drive easier",
        body:
          "The home experience answers three immediate questions: what matters today, whether the current vehicle status can be trusted, and what the owner should do next. A short departure briefing can surface a saved destination, planned departure, available range context, and reminders without turning the home screen into a dashboard.\n\nAll prototype trip and vehicle values are illustrative until connected to validated vehicle signals.",
      },
      {
        eyebrow: "Live confidence",
        title: "A request and a confirmation are different states",
        body:
          "Important telemetry carries both a timestamp and a confidence state. The interface distinguishes Locked from Last confirmed locked and shows when location data last reached the app.\n\nRemote commands remain pending until the vehicle acknowledges them. If the connection times out, the product says that the current state is unknown, preserves the last confirmed state, and offers safe next steps instead of presenting a false success message.",
      },
      {
        eyebrow: "Care and consent",
        title: "Support stays understandable and sharing stays controlled",
        body:
          "Vehicle care explains verified signals without inferring a mechanical diagnosis from missing data. Owners can review supporting information before deciding whether to book service.\n\nFamily Circle uses explicit permission for selected status, arrival, or support updates. The owner chooses what to share, with whom, and for how long, while permissions remain visible and editable.",
      },
      {
        eyebrow: "Validation plan",
        title: "Measure discovery, comprehension, and recovery",
        body:
          "The next step is to test which moments drive first-week activation, where stale data and remote commands damage trust, and which vehicle signals can be surfaced safely for each model and variant.\n\nSuccess measures include task completion, recognition of stale versus live data, acknowledged versus attempted commands, repeat support contacts after a failure, 30-day engagement, and renewal behaviour.",
        imageUrl: "/design/suzuki-connect-validation.png",
        imageAlt: "Validation questions for the Suzuki Connect ONE concept",
      },
    ],
    status: "ready",
  },
  {
    slug: "spaid",
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
    slug: "playmore",
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
    slug: "ab-pharma",
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

export const portfolioApps: PortfolioApp[] = [
  {
    slug: "may-be",
    title: "may.be",
    tagline: "Find clarity in the choices ahead.",
    description:
      "A calm, voice-first decision companion that helps you express where you feel stuck and explore the paths available to you.",
    url: "https://may-be-62sg.onrender.com/",
    iconUrl: "/apps/maybe-icon.png",
    category: "Decision companion",
    platform: "Web app",
    published: true,
    sortOrder: 0,
  },
  {
    slug: "emoti-games",
    title: "Emoti-Games",
    tagline: "A playful way to explore how you feel.",
    description:
      "An interactive Figma Make experience that welcomes you by name and turns emotional reflection into a light, game-like moment.",
    url: "https://lunch-click-86851431.figma.site/",
    iconUrl: "/apps/emoti-games-icon.png",
    category: "Interactive game",
    platform: "Figma Make",
    published: true,
    sortOrder: 1,
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

