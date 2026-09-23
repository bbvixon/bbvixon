import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { creatorVideos, designStories, links, youtubeConfig } from "./portfolioData";
import { portfolioKnowledge } from "./portfolioKnowledge";
import type { CreatorVideo } from "./portfolioData";
import { fetchCreatorVideos } from "./youtube";
import basilAboutStanding from "./assets/basil-about-standing.png";

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getAvailableQualityLevels: () => string[];
  setPlaybackQuality: (suggestedQuality: string) => void;
  loadModule: (module: string) => void;
  unloadModule: (module: string) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars: Record<string, string | number>;
          events: {
            onReady: (event: { target: YouTubePlayer }) => void;
            onStateChange?: () => void;
          };
        },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const cleanDescription = (description: string) =>
  description
    .replace(/\*\*/g, "")
    .replace(/#+\S*/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .trim();

const shortDescription = (description: string) => {
  const words = cleanDescription(description).split(/\s+/).filter(Boolean);
  return words.slice(0, 26).join(" ") + (words.length > 26 ? "..." : "");
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const rounded = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

type AssistantMessage = {
  role: "assistant" | "user";
  text: string;
};

type OllamaResponse = {
  message?: {
    content?: string;
  };
  response?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
    text?: string;
  }>;
};

const abPharmaCompetitors = [
  {
    name: "Veeva RIM",
    insight: "Strong single-platform regulatory model for submissions, registrations, publishing, archive, and correspondence.",
    takeaway: "AB Pharma should feel like one controlled workspace instead of a zip-and-upload utility.",
    url: "https://www.veeva.com/products/veeva-rim/",
  },
  {
    name: "Ennov RIM",
    insight: "Focuses on structured product, registration, submission, correspondence, commitment data and dashboard visibility.",
    takeaway: "The refreshed design should connect package status with region, owner, deadline, and audit context.",
    url: "https://en.ennov.com/solutions/regulatory/rim/",
  },
  {
    name: "ArisGlobal LifeSphere RIM",
    insight: "Emphasizes global planning, tracking, collaboration, single source of truth, and interactive dashboards.",
    takeaway: "AB Pharma needs regional routing and progress monitoring as first-class workflows.",
    url: "https://www.arisglobal.com/lifesphere/regulatory/rim/",
  },
  {
    name: "IQVIA SmartSolve RIM",
    insight: "Positions RIM as a cloud platform for global compliance, market access, document management, and submission publishing.",
    takeaway: "The new concept should surface compliance confidence and inspection readiness, not just upload completion.",
    url: "https://www.iqvia.com/solutions/safety-regulatory-compliance/regulatory-compliance/smartsolve-rim",
  },
  {
    name: "Freyr SUBMIT PRO",
    insight: "Highlights eCTD validation, templates, PDF handling, automation, viewer, publishing workflow, and DMS integration.",
    takeaway: "AB Pharma can improve by showing validation state, package structure, and automation feedback before transfer.",
    url: "https://www.freyrdigital.com/products/submission-management/submit-pro",
  },
];

const DesignImageIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect x="4" y="5" width="16" height="12" rx="2.5" />
    <path d="M7.2 14.2l3.1-3.1 2.2 2.2 1.4-1.4 2.9 2.9" />
    <circle cx="16.5" cy="8.7" r="1.35" />
    <path d="M9 20h6" />
    <path d="M12 17v3" />
  </svg>
);

const MovieCameraIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect x="4" y="9" width="11" height="8" rx="2" />
    <path d="M15 11.4l5-2.6v8.4l-5-2.6z" />
    <circle cx="7.4" cy="6.2" r="2.2" />
    <circle cx="12.4" cy="6.2" r="2.2" />
  </svg>
);

const getAssistantSystemPrompt = (videos: CreatorVideo[]) => {
  const movieContext = videos
    .map(
      (video) =>
        `- ${video.displayTitle ?? video.title}: ${video.year}, ${video.genre ?? "Short Film"}, ${cleanDescription(video.description).slice(0, 280)}`,
    )
    .join("\n");

  return `You are BB AI, a concise assistant embedded in Basil Bose's portfolio website.
Basil Bose is presented as a Designer / Developer / Creator.
Answer only as a helpful portfolio guide for Basil Bose, BB VIXON, his design work, his developer profile, his creator/video work, his YouTube films, and this portfolio website.
If the user asks anything outside Basil's portfolio, do not answer the outside topic. Reply with a short funny redirect such as "Please use your ChatGPT for that 😄 I am only trained for Basil's portfolio." or "Poor me, I can search only inside Basil's portfolio."
When users ask about YouTube, films, videos, creator work, or BB VIXON, emphasize Basil's end-to-end video capability: direction, editing, story, script, camera/cinematography, and production experience across 25+ films/videos.

Curated portfolio knowledge:
${portfolioKnowledge}

Portfolio sections:
- Hero: Basil Bose, Designer / Developer / Creator.
- Design: user stories, UX, product thinking, interface decisions, human-centered problem solving.
- Creator Cinema: BB VIXON streaming-style page for Basil's direction works.
- Future section: local AI assistant/agent space.

Creator videos:
${movieContext || "- Creator videos are still loading."}`;
};

const outOfScopeReplies = [
  "Please use your ChatGPT for that 😄 I am only trained for Basil's portfolio.",
  "Poor me, I can search only inside Basil's portfolio.",
  "My brain has a BB VIXON filter on it. Ask me about Basil's design, code, films, or portfolio.",
  "That sounds like a job for full ChatGPT. I am the tiny portfolio bouncer here.",
];

const portfolioScopeKeywords = [
  "ai",
  "assistant",
  "basil",
  "bb vixon",
  "bbvixon",
  "camera",
  "cinema",
  "contact",
  "creator",
  "design",
  "developer",
  "edit",
  "film",
  "hire",
  "movie",
  "portfolio",
  "script",
  "story",
  "user stor",
  "video",
  "work",
  "youtube",
];

const getOutOfScopeReply = (question: string) => outOfScopeReplies[question.length % outOfScopeReplies.length];

const isPortfolioQuestion = (question: string) => {
  const normalizedQuestion = question.toLowerCase();
  return portfolioScopeKeywords.some((keyword) => normalizedQuestion.includes(keyword));
};

const getLocalAssistantReply = (question: string, videos: CreatorVideo[]) => {
  const normalizedQuestion = question.toLowerCase();
  const movieTitles = videos
    .slice(0, 5)
    .map((video) => video.displayTitle ?? video.title)
    .join(", ");

  if (
    normalizedQuestion.includes("creator") ||
    normalizedQuestion.includes("movie") ||
    normalizedQuestion.includes("film") ||
    normalizedQuestion.includes("video") ||
    normalizedQuestion.includes("youtube") ||
    normalizedQuestion.includes("camera") ||
    normalizedQuestion.includes("edit") ||
    normalizedQuestion.includes("script") ||
    normalizedQuestion.includes("story")
  ) {
    return `Basil's creator work is a core strength of this portfolio. Through BB VIXON and his YouTube films/videos, he can direct, edit, write stories and scripts, handle camera/cinematography, and shape the full production pipeline across 25+ films/videos. The Creator Cinema currently features My Directions, including ${movieTitles || "selected short films"}, with movie pages and a custom watch screen.`;
  }

  if (normalizedQuestion.includes("design") || normalizedQuestion.includes("user stor")) {
    return `The Design section focuses on user stories, product thinking, interface decisions, and human-centered problem solving. It is set up for selected design stories rather than a full project archive.`;
  }

  if (normalizedQuestion.includes("contact") || normalizedQuestion.includes("hire") || normalizedQuestion.includes("work")) {
    return `The best way to contact Basil right now is through the LinkedIn button in the Contact section. Visitors can connect for design, development, creator/video work, direction, editing, story/script, and camera/cinematography projects.`;
  }

  if (normalizedQuestion.includes("ai") || normalizedQuestion.includes("assistant")) {
    return `I am BB AI, a small portfolio assistant connected to Basil's local AI setup. I answer about Basil's design work, developer profile, creator films, YouTube work, and this portfolio.`;
  }

  if (
    normalizedQuestion.includes("basil") ||
    normalizedQuestion.includes("portfolio") ||
    normalizedQuestion.includes("developer") ||
    normalizedQuestion.includes("bb vixon") ||
    normalizedQuestion.includes("bbvixon")
  ) {
    return `Basil Bose is presented here as a Designer / Developer / Creator. You can ask me about the Design section, Creator Cinema, films, user stories, video works, or contact details.`;
  }

  return getOutOfScopeReply(question);
};

function PortfolioAssistant({ videos }: { videos: CreatorVideo[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: "Hi, I am Basil's portfolio assistant. Ask me about his design work, creator films, or how this portfolio is structured.",
    },
  ]);

  const askAssistant = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isThinking) {
      return;
    }

    setQuestion("");
    setIsThinking(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", text: trimmedQuestion },
    ]);

    if (!isPortfolioQuestion(trimmedQuestion)) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", text: getOutOfScopeReply(trimmedQuestion) },
      ]);
      setIsThinking(false);
      return;
    }

    try {
      const localEndpoint = import.meta.env.VITE_LOCAL_AI_ENDPOINT;
      const localModel = import.meta.env.VITE_LOCAL_AI_MODEL || "llama3.2";

      if (localEndpoint) {
        const response = await fetch(localEndpoint, {
          body: JSON.stringify({
            model: localModel,
            stream: false,
            messages: [
              {
                role: "system",
                content: getAssistantSystemPrompt(videos),
              },
              ...messages.slice(-6).map((message) => ({
                role: message.role,
                content: message.text,
              })),
              {
                role: "user",
                content: trimmedQuestion,
              },
            ],
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Local assistant endpoint failed.");
        }

        const data = (await response.json()) as OllamaResponse;
        const modelReply =
          data.choices?.[0]?.message?.content ||
          data.choices?.[0]?.text ||
          data.message?.content ||
          data.response;
        setMessages((currentMessages) => [
          ...currentMessages,
          { role: "assistant", text: modelReply || getLocalAssistantReply(trimmedQuestion, videos) },
        ]);
      } else {
        setMessages((currentMessages) => [
          ...currentMessages,
          { role: "assistant", text: getLocalAssistantReply(trimmedQuestion, videos) },
        ]);
      }
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          text: `${getLocalAssistantReply(trimmedQuestion, videos)} The local model endpoint did not respond, so I used the portfolio fallback answer.`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <aside className={isOpen ? "assistantPanel open" : "assistantPanel"} aria-label="Portfolio AI assistant">
      {isOpen ? (
        <div className="assistantWindow">
          <div className="assistantHeader">
            <div>
              <span>BB AI</span>
              <p>Portfolio assistant</p>
            </div>
            <button aria-label="Close assistant" onClick={() => setIsOpen(false)} type="button">
              x
            </button>
          </div>
          <div className="assistantMessages">
            {messages.map((message, index) => (
              <p className={message.role === "user" ? "assistantBubble user" : "assistantBubble"} key={`${message.role}-${index}`}>
                {message.text}
              </p>
            ))}
            {isThinking ? <p className="assistantBubble">Thinking...</p> : null}
          </div>
          <form
            className="assistantForm"
            onSubmit={(event) => {
              event.preventDefault();
              void askAssistant();
            }}
          >
            <input
              aria-label="Ask the portfolio assistant"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about Basil..."
              value={question}
            />
            <button type="submit">Ask</button>
          </form>
        </div>
      ) : null}
      <button className="assistantToggle" onClick={() => setIsOpen((open) => !open)} type="button">
        AI
      </button>
    </aside>
  );
}

function FullscreenPlayer({
  isMuted,
  onBack,
  onMuteChange,
  video,
}: {
  isMuted: boolean;
  onBack: () => void;
  onMuteChange: (muted: boolean) => void;
  video: CreatorVideo;
}) {
  const containerId = `youtube-player-${video.videoId}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const hideTimerRef = useRef<number | null>(null);

  const showControls = () => {
    setControlsVisible(true);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
      setSettingsOpen(false);
    }, 4600);
  };

  useEffect(() => {
    let cancelled = false;

    const buildPlayer = () => {
      if (cancelled || !window.YT?.Player) {
        return;
      }

      playerRef.current?.destroy();
      playerRef.current = new window.YT.Player(containerId, {
        videoId: video.videoId,
        playerVars: {
          autoplay: 1,
          cc_load_policy: captionsOn ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (isMuted) {
              event.target.mute();
            }
            event.target.playVideo();
            setDuration(event.target.getDuration());
            setQualityLevels(event.target.getAvailableQualityLevels());
            setIsReady(true);
            showControls();
          },
        },
      });
    };

    if (window.YT?.Player) {
      buildPlayer();
    } else {
      window.onYouTubeIframeAPIReady = buildPlayer;
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [captionsOn, containerId, isMuted, video.videoId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  const togglePlay = () => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    if (isPaused) {
      player.playVideo();
      setIsPaused(false);
    } else {
      player.pauseVideo();
      setIsPaused(true);
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    if (player.isMuted()) {
      player.unMute();
      onMuteChange(false);
    } else {
      player.mute();
      onMuteChange(true);
    }
  };

  const seek = (value: string) => {
    const nextTime = Number(value);
    playerRef.current?.seekTo(nextTime, true);
    setCurrentTime(nextTime);
  };

  const changeQuality = (quality: string) => {
    setSelectedQuality(quality);
    playerRef.current?.setPlaybackQuality(quality);
    showControls();
  };

  const toggleCaptions = () => {
    const nextCaptionsState = !captionsOn;
    setCaptionsOn(nextCaptionsState);

    if (nextCaptionsState) {
      playerRef.current?.loadModule("captions");
    } else {
      playerRef.current?.unloadModule("captions");
    }

    showControls();
  };

  return (
    <main className="watchScreen" onMouseMove={showControls} onTouchStart={showControls}>
      <button
        aria-label="Back to movie details"
        className={controlsVisible ? "watchBack visible" : "watchBack"}
        onClick={onBack}
        type="button"
      >
        &lt;
      </button>
      <div className="watchFrame">
        <div id={containerId} />
        <div className="watchChromeMask" aria-hidden="true" />
        {!isReady ? (
          <div className="watchLoading">
            <span>BB VIXON</span>
            <p>Loading movie</p>
          </div>
        ) : null}
      </div>
      <div className={controlsVisible ? "watchControls visible" : "watchControls"}>
        <button aria-label={isPaused ? "Play" : "Pause"} onClick={togglePlay} type="button">
          {isPaused ? <>&#9654;</> : <>&#10074;&#10074;</>}
        </button>
        <span>{formatTime(currentTime)}</span>
        <input
          aria-label="Seek video"
          max={duration || 1}
          min="0"
          onChange={(event) => seek(event.target.value)}
          step="1"
          type="range"
          value={Math.min(currentTime, duration || 1)}
        />
        <span>{formatTime(duration)}</span>
        <button aria-label={isMuted ? "Unmute" : "Mute"} onClick={toggleMute} type="button">
          {isMuted ? <>&#128263;</> : <>&#128266;</>}
        </button>
        <button aria-label="Player settings" onClick={() => setSettingsOpen((open) => !open)} type="button">
          &#9881;
        </button>
        {settingsOpen ? (
          <div className="settingsPanel">
            <div>
              <span>Quality</span>
              <select
                aria-label="Video quality"
                onChange={(event) => changeQuality(event.target.value)}
                value={selectedQuality}
              >
                <option value="auto">Auto</option>
                {qualityLevels.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={toggleCaptions} type="button">
              CC {captionsOn ? "On" : "Off"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    window.localStorage.getItem("bbvixon-theme") === "light" ? "light" : "dark",
  );
  const [bulbMotion, setBulbMotion] = useState<"idle" | "active" | "settling">("idle");
  const bulbSlowTimerRef = useRef<number | null>(null);
  const bulbStopTimerRef = useRef<number | null>(null);
  const [isGamePromptVisible, setIsGamePromptVisible] = useState(false);
  const idleGameTimerRef = useRef<number | null>(null);
  const [videos, setVideos] = useState<CreatorVideo[]>(youtubeConfig.apiKey ? [] : creatorVideos);
  const [activeVideoId, setActiveVideoId] = useState(youtubeConfig.apiKey ? "" : creatorVideos[0]?.videoId);
  const [isLoadingVideos, setIsLoadingVideos] = useState(Boolean(youtubeConfig.apiKey));
  const [videoStatus, setVideoStatus] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [view, setView] = useState<"home" | "creator" | "design">(
    window.location.hash === "#creator-page" || window.location.hash.startsWith("#movie-") || window.location.hash === "#watch"
      ? "creator"
      : window.location.hash.startsWith("#design-story-")
        ? "design"
        : "home",
  );
  const [creatorView, setCreatorView] = useState<"library" | "movie" | "watch">(
    window.location.hash === "#watch"
      ? "watch"
      : window.location.hash.startsWith("#movie-") || window.location.hash === "#player"
        ? "movie"
        : "library",
  );
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeDesignIndex, setActiveDesignIndex] = useState(() => {
    const hashStory = window.location.hash.replace("#design-story-", "");
    const hashIndex = designStories.findIndex(
      (story) => story.title.toLowerCase().replace(/\s+/g, "-") === hashStory,
    );
    return hashIndex >= 0 ? hashIndex : 0;
  });
  const activeVideo = useMemo(
    () => videos.find((video) => video.videoId === activeVideoId) ?? videos[0],
    [activeVideoId, videos],
  );
  const activeDesignStory = designStories[activeDesignIndex] ?? designStories[0];
  const isAbPharmaStory = activeDesignStory.title === "AB Pharma";
  const activeTitle = activeVideo?.displayTitle ?? activeVideo?.title;
  const activeThumbnail =
    activeVideo?.thumbnailUrl ?? `https://img.youtube.com/vi/${activeVideo?.videoId}/maxresdefault.jpg`;
  const videoRows = useMemo(
    () =>
      [
        {
          category: "My Directions",
          videos: videos.filter((video) => video.category === "My Directions"),
        },
      ],
    [videos],
  );
  const directionsVideos = videoRows.find((row) => row.category === "My Directions")?.videos ?? [];
  const featuredVideos = directionsVideos.length > 0 ? directionsVideos : videos;
  const featuredVideo = featuredVideos[featuredIndex] ?? featuredVideos[0];
  const featuredImage =
    featuredVideo?.thumbnailUrl ?? `https://img.youtube.com/vi/${featuredVideo?.videoId}/maxresdefault.jpg`;
  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  const resetIdleGameTimer = () => {
    if (idleGameTimerRef.current) {
      window.clearTimeout(idleGameTimerRef.current);
    }

    idleGameTimerRef.current = window.setTimeout(() => {
      setIsGamePromptVisible(true);
      idleGameTimerRef.current = null;
    }, 180000);
  };
  const dismissGamePrompt = () => {
    setIsGamePromptVisible(false);
    setView("home");
    window.location.hash = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
    resetIdleGameTimer();
  };
  const playIdleGame = () => {
    window.open("https://lunch-click-86851431.figma.site/", "_blank", "noopener,noreferrer");
    setIsGamePromptVisible(false);
    resetIdleGameTimer();
  };
  const handleHeroMouseMove = () => {
    setBulbMotion("active");

    if (bulbSlowTimerRef.current) {
      window.clearTimeout(bulbSlowTimerRef.current);
    }

    if (bulbStopTimerRef.current) {
      window.clearTimeout(bulbStopTimerRef.current);
    }

    bulbSlowTimerRef.current = window.setTimeout(() => {
      setBulbMotion("settling");
      bulbSlowTimerRef.current = null;
    }, 550);

    bulbStopTimerRef.current = window.setTimeout(() => {
      setBulbMotion("idle");
      bulbStopTimerRef.current = null;
    }, 3400);
  };
  const updateContactField =
    (field: keyof typeof contactForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setContactForm((currentForm) => ({ ...currentForm, [field]: event.target.value }));
    };
  const submitContactForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSendingContact(true);
    setContactStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Could not send the message.");
      }

      setContactForm({ name: "", email: "", subject: "", message: "" });
      setContactStatus("Message saved. I will follow up from the database.");
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : "Could not send the message.");
    } finally {
      setIsSendingContact(false);
    }
  };
  const themeToggle = (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "light"}
      className="themeToggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className="themeToggleTrack" aria-hidden="true">
        <span className="themeToggleThumb" />
      </span>
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bbvixon-theme", theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (bulbSlowTimerRef.current) {
        window.clearTimeout(bulbSlowTimerRef.current);
      }

      if (bulbStopTimerRef.current) {
        window.clearTimeout(bulbStopTimerRef.current);
      }

      if (idleGameTimerRef.current) {
        window.clearTimeout(idleGameTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isGamePromptVisible || creatorView === "watch") {
      if (idleGameTimerRef.current) {
        window.clearTimeout(idleGameTimerRef.current);
        idleGameTimerRef.current = null;
      }
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    const handleActivity = () => resetIdleGameTimer();

    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    resetIdleGameTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      if (idleGameTimerRef.current) {
        window.clearTimeout(idleGameTimerRef.current);
        idleGameTimerRef.current = null;
      }
    };
  }, [creatorView, isGamePromptVisible]);

  useEffect(() => {
    let ignore = false;

    fetchCreatorVideos(youtubeConfig)
      .then((channelVideos) => {
        if (ignore) {
          return;
        }

        if (channelVideos.length === 0) {
          setVideos(creatorVideos);
          setActiveVideoId(creatorVideos[0]?.videoId ?? "");
          setIsLoadingVideos(false);
          setVideoStatus("No embeddable YouTube movies were returned. Showing local sample movies for now.");
          return;
        }

        setVideos(channelVideos);
        setActiveVideoId(channelVideos[0].videoId);
        setIsLoadingVideos(false);
        setVideoStatus(
          youtubeConfig.playlistId
            ? `Loaded ${channelVideos.length} curated movies from YouTube.`
            : `Loaded ${channelVideos.length} movies from Basil Bose on YouTube.`,
        );
      })
      .catch((error: Error) => {
        if (!ignore) {
          setVideos(creatorVideos);
          setActiveVideoId(creatorVideos[0]?.videoId ?? "");
          setIsLoadingVideos(false);
          setVideoStatus(`${error.message} Showing local sample movies for now.`);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (featuredVideos.length <= 1 || creatorView !== "library") {
      return;
    }

    const timer = window.setInterval(() => {
      setFeaturedIndex((index) => (index + 1) % featuredVideos.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [creatorView, featuredVideos.length]);

  useEffect(() => {
    if (featuredIndex >= featuredVideos.length) {
      setFeaturedIndex(0);
    }
  }, [featuredIndex, featuredVideos.length]);

  const openCreatorPage = () => {
    setView("creator");
    setCreatorView("library");
    setIsDescriptionExpanded(false);
    window.location.hash = "creator-page";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openHome = () => {
    setView("home");
    window.location.hash = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDesignStory = (index: number) => {
    const story = designStories[index];

    if (!story?.documentUrl) {
      setActiveDesignIndex(index);
      return;
    }

    setActiveDesignIndex(index);
    setView("design");
    window.location.hash = `design-story-${story.title.toLowerCase().replace(/\s+/g, "-")}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectVideo = (videoId: string) => {
    setActiveVideoId(videoId);
    setCreatorView("movie");
    setIsDescriptionExpanded(false);
    window.location.hash = `movie-${videoId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startMovie = () => {
    setCreatorView("watch");
    window.location.hash = "watch";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (view === "design") {
    return (
      <main className="caseStudyPage">
        <nav className="cinemaNav" aria-label="Case study navigation">
          <div className="navIdentity">
            <button className="brandButton" onClick={openHome} type="button">
              Basil Bose
            </button>
            <button
              className="innerBackButton"
              onClick={() => {
                setView("home");
                window.location.hash = "design";
                window.setTimeout(() => document.getElementById("design")?.scrollIntoView({ behavior: "smooth" }), 0);
              }}
              type="button"
            >
              &lt; Back to Design
            </button>
          </div>
          <div className="navlinks">
            {themeToggle}
            <button onClick={openHome} type="button">Portfolio</button>
            <button
              onClick={() => {
                setView("home");
                window.location.hash = "design";
                window.setTimeout(() => document.getElementById("design")?.scrollIntoView({ behavior: "smooth" }), 0);
              }}
              type="button"
            >
              Design
            </button>
          </div>
        </nav>
        <section className="caseStudyHeader">
          <p className="kicker">Design Case Study</p>
          <h1>{activeDesignStory.title}</h1>
          <p>{activeDesignStory.summary}</p>
          <div className="tagRow">
            {activeDesignStory.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {activeDesignStory.redesignDocumentUrl ? (
            <a className="primaryAction caseStudyDownload" href={activeDesignStory.redesignDocumentUrl} target="_blank" rel="noreferrer">
              Open redesigned PDF
              <span aria-hidden="true">-&gt;</span>
            </a>
          ) : null}
        </section>
        {isAbPharmaStory ? (
          <section className="abStoryDeck" aria-label="AB Pharma refreshed UX story">
            <div className="abStoryGrid">
              <article className="abNarrativeCard">
                <p className="streamLabel">Refreshed Story</p>
                <h2>From legacy upload applet to regulatory transfer hub.</h2>
                <p>
                  The original problem came from a pharmaceutical acquisition: Company A needed a
                  new way to package, route, upload, and monitor regulatory documents after Company
                  B's zip-based Java applet no longer fit the parent company's standards.
                </p>
                <div className="abFactGrid">
                  <span><strong>5-20</strong> document sets per medical area per day</span>
                  <span><strong>1-80 GB</strong> package size range for Company A</span>
                  <span><strong>4</strong> target regulatory regions</span>
                  <span><strong>SSO</strong> and default user-region preference</span>
                </div>
              </article>
              <article className="abMockScreen" aria-label="Refreshed AB Pharma dashboard concept">
                <div className="mockSidebar">
                  <span>AB</span>
                  <small>Regulatory Hub</small>
                  <b>Package</b>
                  <b>Monitor</b>
                  <b>Regions</b>
                  <b>Audit</b>
                </div>
                <div className="mockMain">
                  <div className="mockTopline">
                    <span>Europe / Default region</span>
                    <button type="button">Create package</button>
                  </div>
                  <h3>Submission queue</h3>
                  <div className="mockStats">
                    <span><strong>18</strong> Today</span>
                    <span><strong>06</strong> Uploading</span>
                    <span><strong>02</strong> Needs action</span>
                  </div>
                  <div className="mockProgress">
                    <span style={{ width: "72%" }} />
                  </div>
                  <div className="mockRows">
                    <span>CMC dossier - APAC <b>Validating</b></span>
                    <span>Safety update - EU <b>Uploading</b></span>
                    <span>Label package - LATAM <b>Ready</b></span>
                  </div>
                </div>
              </article>
            </div>

            <div className="abStoryGrid three">
              <article className="abNarrativeCard">
                <p className="streamLabel">Research Signal</p>
                <h3>What users needed</h3>
                <p>
                  Interviews showed a workflow stuck between manual folder naming, manual zipping,
                  large package sizes, different regional standards, and status follow-up across
                  teams. The refreshed UX makes package creation guided, traceable, and region-aware.
                </p>
              </article>
              <article className="abNarrativeCard">
                <p className="streamLabel">Design Direction</p>
                <h3>What changed</h3>
                <p>
                  The new design concept introduces a dashboard, dynamic region forms, browse-path
                  auto-fill, upload progress, filters, status visibility, and lightweight enterprise
                  styling using a blue-grey trust palette.
                </p>
              </article>
              <article className="abNarrativeCard">
                <p className="streamLabel">Delivery Story</p>
                <h3>How it shipped</h3>
                <p>
                  The original story covers requirement gathering, stakeholder demos, high-fidelity
                  wireframes, HTML/CSS/Bootstrap/JS UI development, Spring Boot integration, UAT,
                  release notes, user manual, install notes, and support transition.
                </p>
              </article>
            </div>

            <div className="competitorPanel">
              <div>
                <p className="streamLabel">Competition Scan</p>
                <h2>Patterns borrowed from modern RIM and submission tools.</h2>
                <p>
                  The refreshed AB Pharma concept is positioned against modern regulatory systems:
                  dashboards, single source of truth, package structure, automation, validation,
                  workflow ownership, and audit-ready traceability.
                </p>
              </div>
              <div className="competitorGrid">
                {abPharmaCompetitors.map((competitor) => (
                  <a href={competitor.url} key={competitor.name} target="_blank" rel="noreferrer">
                    <strong>{competitor.name}</strong>
                    <span>{competitor.insight}</span>
                    <em>{competitor.takeaway}</em>
                  </a>
                ))}
              </div>
            </div>

            <div className="originalStoryIntro">
              <p className="streamLabel">Redesigned PDF Preview</p>
              <h2>Updated AB Pharma redesign deck</h2>
              <p>
                The corrected redesigned PDF is shown below as page images, so visitors can review
                the updated case-study deck without leaving the portfolio.
              </p>
            </div>
          </section>
        ) : null}
        <section className="caseStudyViewer">
          {activeDesignStory.pageImages?.length ? (
            <div className="caseStudyPages" aria-label={`${activeDesignStory.title} full case study`}>
              {activeDesignStory.pageImages.map((pageImage, index) => (
                <img
                  alt={`${activeDesignStory.title} case study page ${index + 1}`}
                  key={pageImage}
                  loading={index === 0 ? "eager" : "lazy"}
                  src={pageImage}
                />
              ))}
            </div>
          ) : (
            <div className="placeholderPreview">
              <span>UX</span>
              <strong>Coming soon</strong>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (view === "creator") {
    if (isLoadingVideos) {
      return (
        <main className="cinemaPage">
          <div className="vixonLoader" role="status" aria-live="polite">
            <div className="loaderMark">
              <span>BB</span>
              <span>VIXON</span>
            </div>
            <div className="loaderTrack" aria-hidden="true">
              <span />
            </div>
            <p>Loading creator cinema</p>
          </div>
        </main>
      );
    }

    if (creatorView === "watch" && activeVideo) {
      return (
        <FullscreenPlayer
          isMuted={isMuted}
          onBack={() => {
            setCreatorView("movie");
            window.location.hash = `movie-${activeVideo.videoId}`;
          }}
          onMuteChange={setIsMuted}
          video={activeVideo}
        />
      );
    }

    if (creatorView === "movie" && activeVideo) {
      const description = cleanDescription(activeVideo.description);
      const visibleDescription = isDescriptionExpanded
        ? description
        : shortDescription(activeVideo.description);

      return (
        <main className="cinemaPage">
          <nav className="cinemaNav" aria-label="Movie navigation">
            <div className="navIdentity">
              <button className="brandButton" onClick={openCreatorPage} type="button">
                BB VIXON
              </button>
              <button className="innerBackButton" onClick={openCreatorPage} type="button">
                &lt; Back to Library
              </button>
            </div>
            <div className="navlinks">
              {themeToggle}
              <button onClick={openCreatorPage} type="button">Creator Home</button>
              <button onClick={openHome} type="button">Portfolio</button>
            </div>
          </nav>

          <section className="movieDetailHero">
            <img className="movieDetailBackdrop" src={activeThumbnail} alt="" aria-hidden="true" />
            <div className="movieDetailContent">
              <p className="streamLabel">{activeVideo.category}</p>
              <h1>{activeTitle}</h1>
              <div className="movieMeta">
                <span>{activeVideo.year}</span>
                <span>{activeVideo.genre ?? "Short Film"}</span>
                <span>{activeVideo.runtime}</span>
              </div>
              <p className="compactDescription">{visibleDescription}</p>
              {description !== visibleDescription ? (
                <button
                  className="expandDescription"
                  onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                  type="button"
                >
                  {isDescriptionExpanded ? "Show less" : "More details"}
                </button>
              ) : null}
              <div className="heroActions">
                <button className="watchAction" onClick={startMovie} type="button">
                  Play
                </button>
                <button className="detailAction" onClick={openCreatorPage} type="button">
                  Back to Library
                </button>
              </div>
            </div>
          </section>

          <section className="moviePlayerShell movieInfoOnly" id="player">
            <aside className="movieFacts">
              <p className="streamLabel">Movie Info</p>
              <h2>Description</h2>
              <p>{visibleDescription}</p>
              <h3>Genre</h3>
              <p>{activeVideo.genre ?? "Short Film"}</p>
              <h3>Cast</h3>
              <p>{activeVideo.cast?.join(", ") ?? "Basil Bose"}</p>
              <h3>Crew</h3>
              <p>{activeVideo.crew?.join(" | ") ?? "Direction: Basil Bose"}</p>
            </aside>
          </section>
        </main>
      );
    }

    return (
      <main className="cinemaPage">
        <nav className="cinemaNav" aria-label="Creator navigation">
          <div className="navIdentity">
            <button className="brandButton" onClick={openHome} type="button">
              Basil Bose
            </button>
            <button className="innerBackButton" onClick={openHome} type="button">
              &lt; Back to Portfolio
            </button>
          </div>
          <div className="navlinks">
            {themeToggle}
            <button onClick={openHome} type="button">Portfolio</button>
            <a href="#featured">Featured</a>
            <a href="#library">Library</a>
          </div>
        </nav>

        <section className="cinemaHero directionsHero" id="featured">
          <div className="cinemaShade" aria-hidden="true" />
          <div className="cinemaHeroContent">
            <p className="streamLabel">Featured Playlist</p>
            <h1>My Directions</h1>
            <div className="movieMeta">
              <span>{featuredVideos.length} films</span>
              <span>Curated playlist</span>
              <span>BB VIXON</span>
            </div>
            <p>Selected direction works from Basil Bose, curated from the YouTube playlist you shared.</p>
            <p className="videoStatus">{videoStatus}</p>
            <button className="watchAction" onClick={() => selectVideo(featuredVideo?.videoId ?? videos[0]?.videoId)} type="button">
              Open Featured Movie
            </button>
          </div>
          <div className="featuredSlideshow" aria-label="My Directions slideshow">
            {featuredVideo ? (
              <button className="slideCard" onClick={() => selectVideo(featuredVideo.videoId)} type="button">
                <img src={featuredImage} alt="" />
                <span>{featuredVideo.displayTitle ?? featuredVideo.title}</span>
              </button>
            ) : null}
            <div className="slideControls" aria-label="Featured slideshow controls">
              <button
                aria-label="Previous featured movie"
                onClick={() =>
                  setFeaturedIndex((index) =>
                    featuredVideos.length ? (index - 1 + featuredVideos.length) % featuredVideos.length : 0,
                  )
                }
                type="button"
              >
                &lt;
              </button>
              <div className="slideDots">
                {featuredVideos.map((video, index) => (
                  <button
                    aria-label={`Show ${video.displayTitle ?? video.title}`}
                    className={index === featuredIndex ? "active" : ""}
                    key={video.videoId}
                    onClick={() => setFeaturedIndex(index)}
                    type="button"
                  />
                ))}
              </div>
              <button
                aria-label="Next featured movie"
                onClick={() =>
                  setFeaturedIndex((index) =>
                    featuredVideos.length ? (index + 1) % featuredVideos.length : 0,
                  )
                }
                type="button"
              >
                &gt;
              </button>
            </div>
          </div>
        </section>

        <section className="movieLibrary" id="library">
          {videoRows.map((row) => (
            <div className="movieRow" key={row.category}>
              <h2>{row.category}</h2>
              <div className="movieRail">
                {row.videos.map((video) => (
                  <button
                    className={video.videoId === activeVideo?.videoId ? "movieTile active" : "movieTile"}
                    key={video.videoId}
                    onClick={() => selectVideo(video.videoId)}
                      type="button"
                  >
                    <img
                      src={video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                      alt=""
                      loading="lazy"
                    />
                    <span className="movieTileOverlay">
                      <strong>{video.displayTitle ?? video.title}</strong>
                      <span>{video.year} | {video.runtime}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#home">
          Basil Bose
        </a>
        <div className="navlinks">
          {themeToggle}
          <a href="#about">About</a>
          <a href="#design">Design</a>
          <button onClick={openCreatorPage} type="button">Creator</button>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero" id="home" onMouseMove={handleHeroMouseMove}>
        <div className="heroBackdrop" aria-hidden="true" />
        <button
          aria-label={theme === "dark" ? "Turn the bulb on and switch to light mode" : "Turn the bulb off and switch to dark mode"}
          aria-pressed={theme === "light"}
          className={[
            "heroBulb",
            theme === "light" ? "isOn" : "",
            bulbMotion === "active" ? "isSwinging" : "",
            bulbMotion === "settling" ? "isSettling" : "",
          ].filter(Boolean).join(" ")}
          onClick={toggleTheme}
          type="button"
        >
          <span className="bulbCord" aria-hidden="true" />
          <span className="bulbCap" aria-hidden="true" />
          <span className="bulbGlass" aria-hidden="true" />
          <span className="bulbGlow" aria-hidden="true" />
        </button>
        <div className="heroContent">
          <p className="kicker">Portfolio</p>
          <h1 className="heroName"><span>Basil</span><span>Bose</span></h1>
          <p className="titleLine">Designer / Developer / Creator</p>
          <p className="heroCopy">
            I build digital experiences, shape product ideas, and create visual stories across design,
            code, and film — from story and script to camera, edit, and final screen.
          </p>
          <div className="heroActions">
            <a className="primaryAction" href="#design">
              <span className="actionIcon"><DesignImageIcon /></span>
              View Design
            </a>
            <button className="secondaryAction" onClick={openCreatorPage} type="button">
              <span className="actionIcon"><MovieCameraIcon /></span>
              Watch Creator Work
            </button>
          </div>
        </div>
      </section>

      <section className="introBand" aria-label="Portfolio focus">
        <div>
          <span className="bandMark" aria-hidden="true" />
          <span>Design thinking, development craft, and creator-led storytelling in one focused portfolio.</span>
        </div>
      </section>

      <section className="aboutSection" id="about" aria-label="About Basil Bose">
        <div className="aboutCard">
          <div className="aboutPortraitWrap">
            <img src={basilAboutStanding} alt="Basil Bose portrait" />
          </div>
          <div className="aboutCopy">
            <h2>Hello</h2>
            <p>
              I&apos;m Basil Bose, a designer, developer, and creator who blends product thinking with
              visual storytelling. I design clear user journeys, build web experiences, and create films
              through direction, story, script, camera, edit, and final presentation.
            </p>
            <div className="aboutStats" aria-label="Portfolio highlights">
              <span><strong>25+</strong> films/videos</span>
              <span><strong>UX</strong> stories</span>
              <span><strong>Web</strong> builds</span>
            </div>
          </div>
          <div className="aboutMeta" aria-hidden="true">
            <span>About me</span>
            <span>Design / Code / Cinema</span>
          </div>
        </div>
      </section>

      <section className="section" id="design">
        <div className="sectionHeader">
          <p className="kicker">Design</p>
          <h2>User stories and product design</h2>
          <p>
            Selected user stories from Basil's portfolio, presented as focused case-study thumbnails.
            Spaid and Playmore are available now, with one space reserved for the next story.
          </p>
          <a className="textLink" href={links.designStories} target="_blank" rel="noreferrer">
            Current user stories
            <span aria-hidden="true">-&gt;</span>
          </a>
        </div>

        <div className="designCarousel" aria-label="Design user story carousel">
          <article className={activeDesignStory.status === "placeholder" ? "designFeature placeholder" : "designFeature"}>
            <button
              className="designPreview"
              disabled={!activeDesignStory.documentUrl}
              onClick={() => openDesignStory(activeDesignIndex)}
              type="button"
            >
              {activeDesignStory.thumbnailUrl ? (
                <img src={activeDesignStory.thumbnailUrl} alt={`${activeDesignStory.title} case study preview`} />
              ) : (
                <div className="placeholderPreview">
                  <span>UX</span>
                  <strong>Next story</strong>
                </div>
              )}
            </button>
            <div className="designFeatureContent">
              <p className="storyRole">{activeDesignStory.role}</p>
              <h3>{activeDesignStory.title}</h3>
              <p>{activeDesignStory.summary}</p>
              <p className="outcome">{activeDesignStory.outcome}</p>
              <div className="tagRow">
                {activeDesignStory.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="designActions">
                {activeDesignStory.documentUrl ? (
                  <button className="primaryAction designGoAction" onClick={() => openDesignStory(activeDesignIndex)} type="button">
                    Lets Go..
                  </button>
                ) : (
                  <span className="comingSoonPill">Placeholder</span>
                )}
              </div>
            </div>
          </article>

          <div className="designThumbRail" aria-label="Design story thumbnails">
            {designStories.map((story, index) => (
              <button
                className={index === activeDesignIndex ? "designThumb active" : "designThumb"}
                key={story.title}
                onClick={() => setActiveDesignIndex(index)}
                onDoubleClick={() => openDesignStory(index)}
                type="button"
              >
                {story.thumbnailUrl ? <img src={story.thumbnailUrl} alt="" /> : <span className="thumbPlaceholder">+</span>}
                <span>
                  <small>{story.role}</small>
                  <strong>{story.title}</strong>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section creatorSection" id="creator">
        <div className="sectionHeader">
          <p className="kicker">Creator</p>
          <h2>Movies and visual stories</h2>
          <p>
            A focused showcase of Basil's video works across direction, editing, story, script,
            and camera work for 25+ films/videos.
          </p>
          <button className="textLink buttonLink" onClick={openCreatorPage} type="button">
            Open creator cinema
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>

        {isLoadingVideos ? (
          <div className="previewLoading">
            <span>BB VIXON</span>
            <p>Loading creator videos</p>
          </div>
        ) : (
          <div className="creatorPreviewPanel">
            <div>
              <p className="kicker">Creator Cinema</p>
              <h3>Curated directions, presented like a streaming library.</h3>
              <p>
                BB VIXON highlights Basil as a multi-disciplinary filmmaker who can move from idea
                and screenplay to shoot, edit, and final presentation.
              </p>
              <button className="primaryAction" onClick={openCreatorPage} type="button">
                Open Creator Cinema
                <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
            <div className="previewStrip" aria-label="Featured direction thumbnails">
              {videos.slice(0, 3).map((video) => (
                <button className="previewThumb" key={video.videoId} onClick={() => selectVideo(video.videoId)} type="button">
                  <img
                    src={video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                  <span>{video.displayTitle ?? video.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="contactBand" id="contact">
        <div className="contactContent">
          <p className="kicker">Contact</p>
          <h2>Let us build something visual, useful, and cinematic.</h2>
          <p>
            For design, development, creator videos, direction, editing, story/script, or camera work,
            send a quick note here. LinkedIn and YouTube are still available if visitors want a direct
            external path.
          </p>
        </div>
        <form className="contactForm" onSubmit={submitContactForm}>
          <div className="contactFieldGrid">
            <label>
              Name
              <input
                autoComplete="name"
                onChange={updateContactField("name")}
                placeholder="Your name"
                required
                type="text"
                value={contactForm.name}
              />
            </label>
            <label>
              Email
              <input
                autoComplete="email"
                onChange={updateContactField("email")}
                placeholder="you@example.com"
                required
                type="email"
                value={contactForm.email}
              />
            </label>
          </div>
          <label>
            Subject
            <input
              onChange={updateContactField("subject")}
              placeholder="Project, hiring, collaboration..."
              type="text"
              value={contactForm.subject}
            />
          </label>
          <label>
            Message
            <textarea
              onChange={updateContactField("message")}
              placeholder="Tell me what you want to build."
              required
              rows={5}
              value={contactForm.message}
            />
          </label>
          {contactStatus ? <p className="contactStatus">{contactStatus}</p> : null}
          <div className="contactActions" aria-label="Contact actions">
            <button className="primaryAction" disabled={isSendingContact} type="submit">
              {isSendingContact ? "Sending..." : "Send Message"}
              <span aria-hidden="true">-&gt;</span>
            </button>
            <a className="secondaryAction" href={links.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a className="secondaryAction" href={links.youtube} target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
        </form>
      </section>
      {isGamePromptVisible ? (
        <div className="idleGameOverlay" role="dialog" aria-modal="true" aria-labelledby="idle-game-title">
          <div className="idleGameCard">
            <p className="kicker">Tiny break?</p>
            <h2 id="idle-game-title">Do you want to play a game?</h2>
            <p>
              You have been idle for a bit. Take a quick playful detour, or cancel to return to the homepage.
            </p>
            <div className="idleGameActions">
              <button className="primaryAction" onClick={playIdleGame} type="button">
                Play
              </button>
              <button className="secondaryAction" onClick={dismissGamePrompt} type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <PortfolioAssistant videos={videos} />
    </main>
  );
}

export default App;

