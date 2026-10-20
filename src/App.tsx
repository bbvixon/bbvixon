import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { creatorVideos, designStories, links, portfolioApps, youtubeConfig } from "./portfolioData";
import { portfolioKnowledge } from "./portfolioKnowledge";
import type { CreatorVideo, DesignStory, PortfolioApp } from "./portfolioData";
import { fetchCreatorVideos } from "./youtube";
import basilAboutStanding from "./assets/basil-about-standing.png";
import { CmsAdmin } from "./CmsAdmin";
import { StorySections } from "./StorySections";

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

type NavigationSection = "about" | "design" | "creator" | "apps" | "contact";

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

const mayBeJourney = [
  ["01", "Tell", "Speak naturally or type the situation without turning it into a formal prompt."],
  ["02", "Understand", "Grounded keywords emerge only after capture is complete, using the person's own language."],
  ["03", "Transform", "The may.be wordmark dissolves until its centred dot becomes the decision seed."],
  ["04", "Explore", "Organic branches reveal credible paths and keep every choice connected to one living tree."],
  ["05", "Return", "Undo restores the previous fork and camera position, so exploration never feels like commitment."],
];

const mayBePrinciples = [
  ["Voice first", "Speaking is the primary entry point; typing remains a complete, private fallback."],
  ["Grounded meaning", "AI interpretation stays visibly connected to user facts, evidence, assumptions, and unknowns."],
  ["Spatial continuity", "Nodes and paths share one world coordinate system; the chosen object is the object that moves."],
  ["Variable choices", "The system reveals two to six credible branches instead of forcing every decision into a binary."],
  ["Reversible exploration", "Following a branch means inspecting it, not committing to it. Undo always preserves context."],
  ["Accessible motion", "Reduced-motion, keyboard, touch, screen-reader, and high-contrast paths carry the same meaning."],
];

const mayBeUserStories = [
  ["Capture", "Start with voice, use text instead, recover from microphone problems, or restart at any time."],
  ["Interpretation", "See calm processing feedback and recognise specific words, factors, and named alternatives."],
  ["Transformation", "Cross a short emotional passage before the logo's centred dot grows into the decision."],
  ["Exploration", "Inspect branch summaries, follow consequences, and fit larger forks without losing readability."],
  ["Trust and recovery", "Undo one step, distinguish facts from assumptions, and use every path accessibly."],
];

const mayBePalette = [
  ["Canvas", "#F5F0E7"],
  ["Surface", "#FFFAF2"],
  ["Primary ink", "#332119"],
  ["Muted text", "#6F625A"],
  ["Warm accent", "#B47B54"],
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
- Apps: may.be decision companion and Emoti-Games interactive Figma Make experience.

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
  "app",
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

  if (normalizedQuestion.includes("app") || normalizedQuestion.includes("may.be") || normalizedQuestion.includes("emoti")) {
    return `The Apps page is a growing shelf of Basil's interactive work. It currently includes may.be, a voice-first decision companion, and Emoti-Games, a playful Figma Make experience about emotions.`;
  }

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
      const response = await fetch("/api/ai", {
        body: JSON.stringify({
          question: trimmedQuestion,
          systemPrompt: getAssistantSystemPrompt(videos),
          messages: messages.slice(-6),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Portfolio assistant endpoint failed.");
      }

      const data = (await response.json()) as { answer?: string };
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", text: data.answer || getLocalAssistantReply(trimmedQuestion, videos) },
      ]);
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

function AppLaunchScreen({ app, onBack }: { app: PortfolioApp; onBack: () => void }) {
  const [progress, setProgress] = useState(8);
  const [status, setStatus] = useState("Connecting to may.be...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let completed = false;
    let timedOut = false;

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + (current < 42 ? 7 : current < 72 ? 4 : 1), 92);
        if (next >= 78) setStatus("Almost ready...");
        else if (next >= 48) setStatus("Preparing your decision space...");
        else if (next >= 20) setStatus("Waking up the experience...");
        return next;
      });
    }, 700);

    const timeoutTimer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
      setHasError(true);
      setStatus("may.be is taking longer than expected.");
    }, 60000);

    fetch(app.url, {
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal,
    })
      .then(() => {
        completed = true;
        window.clearInterval(progressTimer);
        window.clearTimeout(timeoutTimer);
        setProgress(100);
        setStatus("may.be is ready.");
        window.setTimeout(() => window.location.replace(app.url), 650);
      })
      .catch(() => {
        if (timedOut || completed) return;
        window.clearInterval(progressTimer);
        window.clearTimeout(timeoutTimer);
        setHasError(true);
        setStatus("We could not wake may.be automatically.");
      });

    return () => {
      completed = true;
      controller.abort();
      window.clearInterval(progressTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [app.url]);

  return (
    <main className="appLaunchPage">
      <div className="launchAmbient launchAmbientOne" aria-hidden="true" />
      <div className="launchAmbient launchAmbientTwo" aria-hidden="true" />
      <button className="launchBrand" onClick={onBack} type="button">Basil Bose</button>
      <section className="launchCard" aria-live="polite">
        <div className="launchIconWrap">
          <span className="launchOrbit launchOrbitOne" aria-hidden="true" />
          <span className="launchOrbit launchOrbitTwo" aria-hidden="true" />
          <img src={app.iconUrl} alt="may.be app icon" />
        </div>
        <h1>may.be</h1>
        <p className="launchStatus">{status}</p>
        <div className="launchProgressTrack" role="progressbar" aria-label="Loading may.be" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="launchProgressMeta">
          <span>{progress}%</span>
        </div>
        {hasError ? (
          <div className="launchFallbackActions">
            <button onClick={() => window.location.reload()} type="button">Try again</button>
            <a href={app.url}>Open directly</a>
          </div>
        ) : null}
      </section>
      <button className="launchBack" onClick={onBack} type="button">Back to Apps</button>
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
  const [activeHomeSection, setActiveHomeSection] = useState<NavigationSection | null>(() => {
    const section = window.location.hash.slice(1);
    return ["about", "design", "creator", "contact"].includes(section) ? section as NavigationSection : null;
  });
  const [view, setView] = useState<"home" | "creator" | "design" | "apps" | "launcher" | "cms">(
    window.location.hash === "#cms"
      ? "cms"
      : window.location.hash.startsWith("#launch-app-")
        ? "launcher"
      : window.location.hash === "#apps"
        ? "apps"
      : window.location.hash === "#creator-page" || window.location.hash.startsWith("#movie-") || window.location.hash === "#watch"
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
  const [cmsDesignStories, setCmsDesignStories] = useState<DesignStory[]>([]);
  const [hiddenCmsStorySlugs, setHiddenCmsStorySlugs] = useState<string[]>([]);
  const [cmsPortfolioApps, setCmsPortfolioApps] = useState<PortfolioApp[]>([]);
  const [hiddenCmsAppSlugs, setHiddenCmsAppSlugs] = useState<string[]>([]);
  const resolvedDesignStories = useMemo(() => {
    const overrides = new Map(cmsDesignStories.map((story) => [story.slug, story]));
    return [
      ...designStories.filter((story) => !hiddenCmsStorySlugs.includes(story.slug)).map((story) => overrides.get(story.slug) ?? story),
      ...cmsDesignStories.filter((story) => !designStories.some((fallback) => fallback.slug === story.slug)),
    ].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [cmsDesignStories, hiddenCmsStorySlugs]);
  const resolvedPortfolioApps = useMemo(() => {
    const overrides = new Map(cmsPortfolioApps.map((app) => [app.slug, app]));
    return [
      ...portfolioApps.filter((app) => !hiddenCmsAppSlugs.includes(app.slug)).map((app) => overrides.get(app.slug) ?? app),
      ...cmsPortfolioApps.filter((app) => !portfolioApps.some((fallback) => fallback.slug === app.slug)),
    ].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [cmsPortfolioApps, hiddenCmsAppSlugs]);
  const launchAppSlug = window.location.hash.replace("#launch-app-", "");
  const launchingApp = resolvedPortfolioApps.find((app) => app.slug === launchAppSlug) ?? portfolioApps.find((app) => app.slug === "may-be");
  const [activeDesignIndex, setActiveDesignIndex] = useState(() => {
    const hashStory = window.location.hash.replace("#design-story-", "");
    const hashIndex = designStories.findIndex(
      (story) => story.slug === hashStory,
    );
    return hashIndex >= 0 ? hashIndex : 0;
  });
  const activeVideo = useMemo(
    () => videos.find((video) => video.videoId === activeVideoId) ?? videos[0],
    [activeVideoId, videos],
  );
  const activeDesignStory = resolvedDesignStories[activeDesignIndex] ?? resolvedDesignStories[0] ?? designStories[0];
  const isMayBeStory = activeDesignStory.title === "may.be";
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
    if (window.location.hash === "#cms") return;

    const controller = new AbortController();
    Promise.all([
      fetch("/api/design-stories", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error("Stories CMS unavailable");
        return response.json();
      }),
      fetch("/api/apps", { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error("Apps CMS unavailable");
        return response.json();
      }),
    ])
      .then(([data, appsData]) => {
        if (!Array.isArray(data.stories)) return;
        setCmsDesignStories(data.stories);
        setHiddenCmsStorySlugs(Array.isArray(data.hiddenSlugs) ? data.hiddenSlugs : []);
        if (Array.isArray(appsData.apps)) {
          setCmsPortfolioApps(appsData.apps);
          setHiddenCmsAppSlugs(Array.isArray(appsData.hiddenSlugs) ? appsData.hiddenSlugs : []);
        }
        const hashStory = window.location.hash.replace("#design-story-", "");
        if (hashStory) {
          const mergedSlugs = [
            ...designStories
              .filter((story) => !(Array.isArray(data.hiddenSlugs) && data.hiddenSlugs.includes(story.slug)))
              .map((story) => data.stories.find((candidate: DesignStory) => candidate.slug === story.slug) ?? story),
            ...data.stories.filter((story: DesignStory) => !designStories.some((fallback) => fallback.slug === story.slug)),
          ].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const nextIndex = mergedSlugs.findIndex((story) => story.slug === hashStory);
          if (nextIndex >= 0) setActiveDesignIndex(nextIndex);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("bbvixon-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (view !== "home") return;

    const updateActiveSection = () => {
      const marker = window.scrollY + window.innerHeight * 0.34;
      let current: NavigationSection | null = null;

      (["about", "design", "creator", "contact"] as NavigationSection[]).forEach((section) => {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= marker) current = section;
      });

      setActiveHomeSection(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [view]);

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
    setActiveHomeSection("creator");
    setCreatorView("library");
    setIsDescriptionExpanded(false);
    window.location.hash = "creator-page";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openHome = () => {
    setView("home");
    setActiveHomeSection(null);
    window.location.hash = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAppsPage = () => {
    setView("apps");
    setActiveHomeSection("apps");
    window.location.hash = "apps";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openHomeSection = (section: Exclude<NavigationSection, "apps" | "creator">) => {
    setView("home");
    setActiveHomeSection(section);
    window.location.hash = section;
    window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const renderNavigation = (activeSection: NavigationSection | null) => (
    <nav className="topbar" aria-label="Primary navigation">
      <button className="brandButton" onClick={openHome} type="button">Basil Bose</button>
      <div className="navlinks">
        {themeToggle}
        <button className={activeSection === "about" ? "activeNavItem" : undefined} aria-current={activeSection === "about" ? "page" : undefined} onClick={() => openHomeSection("about")} type="button">About</button>
        <button className={activeSection === "design" ? "activeNavItem" : undefined} aria-current={activeSection === "design" ? "page" : undefined} onClick={() => openHomeSection("design")} type="button">Design</button>
        <button className={activeSection === "creator" ? "activeNavItem" : undefined} aria-current={activeSection === "creator" ? "page" : undefined} onClick={openCreatorPage} type="button">Creator</button>
        <button className={activeSection === "apps" ? "activeNavItem" : undefined} aria-current={activeSection === "apps" ? "page" : undefined} onClick={openAppsPage} type="button">Apps</button>
        <button className={activeSection === "contact" ? "activeNavItem" : undefined} aria-current={activeSection === "contact" ? "page" : undefined} onClick={() => openHomeSection("contact")} type="button">Contact</button>
      </div>
    </nav>
  );

  const openDesignStory = (index: number) => {
    const story = resolvedDesignStories[index];

    if (!story?.documentUrl && !story?.sections?.length) {
      setActiveDesignIndex(index);
      return;
    }

    setActiveDesignIndex(index);
    setView("design");
    window.location.hash = `design-story-${story.slug}`;
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

  if (view === "cms") {
    return <CmsAdmin defaultStories={designStories} defaultApps={portfolioApps} />;
  }

  if (view === "launcher" && launchingApp) {
    return <AppLaunchScreen app={launchingApp} onBack={openAppsPage} />;
  }

  if (view === "apps") {
    return (
      <main className="appsPage">
        {renderNavigation("apps")}

        <section className="appsHero">
          <div className="appsHeroOrb appsHeroOrbOne" aria-hidden="true" />
          <div className="appsHeroOrb appsHeroOrbTwo" aria-hidden="true" />
          <p className="kicker">Apps by Basil</p>
          <h1>Small ideas,<br />made interactive.</h1>
          <p className="appsHeroIntro">
            A growing shelf of independent experiments, thoughtful tools, and playful browser experiences.
          </p>
        </section>

        <section className="appsStore" aria-label="Basil Bose apps">
          <div className="appsStoreHeading">
            <div>
              <p className="kicker">Available now</p>
              <h2>Explore the collection</h2>
            </div>
            <p>Each app opens in its own tab, ready to use.</p>
          </div>

          <div className="appCardGrid">
            {resolvedPortfolioApps.map((app, index) => (
              <article className="appStoreCard" key={app.slug}>
                <div className="appStoreVisual">
                  <span className="appRank">{String(index + 1).padStart(2, "0")}</span>
                  {app.iconUrl ? <img src={app.iconUrl} alt={`${app.title} app icon`} /> : <span className="appIconFallback">{app.title.slice(0, 1)}</span>}
                </div>
                <div className="appStoreCopy">
                  <div className="appMetaRow">
                    <span>{app.category}</span>
                    <i aria-hidden="true">•</i>
                    <span>{app.platform}</span>
                  </div>
                  <h2>{app.title}</h2>
                  <h3>{app.tagline}</h3>
                  <p>{app.description}</p>
                  <a href={app.slug === "may-be" ? `/#launch-app-${app.slug}` : app.url} target="_blank" rel="noreferrer">
                    Open app <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="appsFooter">
          <span>More experiments are on the way.</span>
          <button onClick={openHome} type="button">Return to portfolio</button>
        </footer>
      </main>
    );
  }

  if (view === "design") {
    return (
      <main className="caseStudyPage">
        {renderNavigation("design")}
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
          {activeDesignStory.figmaUrl ? (
            <a className="primaryAction caseStudyFigma" href={activeDesignStory.figmaUrl} target="_blank" rel="noreferrer">
              Open Figma design
              <span aria-hidden="true">-&gt;</span>
            </a>
          ) : null}
        </section>
        {activeDesignStory.sections?.length ? (
          <StorySections sections={activeDesignStory.sections} />
        ) : isMayBeStory ? (
          <section className="mayBeStory" aria-label="may.be product design case study">
            <article className="mayBeOpening">
              <div>
                <p className="streamLabel">Product Intent</p>
                <h2>See where every choice could take you.</h2>
              </div>
              <div>
                <p>
                  may.be is a mobile-first decision-exploration experience. A person describes where
                  they are stuck, the system extracts grounded meaning, distils the central decision,
                  and reveals a spatial tree of credible alternatives.
                </p>
                <p>
                  The key design requirement is continuity: one story becomes one decision seed and
                  grows into one persistent tree—not a sequence of cards, reports, or dashboard panels.
                </p>
              </div>
            </article>

            <section className="mayBeSection" aria-labelledby="may-be-journey-title">
              <div className="mayBeSectionHeading">
                <p className="streamLabel">Experience Journey</p>
                <h2 id="may-be-journey-title">One thought owns the screen at a time.</h2>
                <p>The product moves from expression to meaning, then into reversible exploration.</p>
              </div>
              <div className="mayBeJourney">
                {mayBeJourney.map(([number, title, description]) => (
                  <article key={number}>
                    <span>{number}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mayBeFigma" aria-labelledby="may-be-figma-title">
              <div className="mayBeSectionHeading">
                <p className="streamLabel">Figma Design</p>
                <h2 id="may-be-figma-title">The interaction shown as a cinematic mobile flow.</h2>
                <p>
                  The screens connect invitation, listening, keyword meaning, decision transformation,
                  branching, and conversational history in one warm, minimal visual system.
                </p>
              </div>
              <div className="mayBeFigmaFrame">
                <img src="/design/may-be-figma-screens.svg" alt="may.be Figma mobile flow showing invitation, listening, meaning, and decision-tree screens" />
              </div>
            </section>

            <section className="mayBeSection mayBePrinciples" aria-labelledby="may-be-principles-title">
              <div className="mayBeSectionHeading">
                <p className="streamLabel">Experience Principles</p>
                <h2 id="may-be-principles-title">Calm, grounded, continuous, and human.</h2>
              </div>
              <div className="mayBeCardGrid">
                {mayBePrinciples.map(([title, description]) => (
                  <article key={title}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mayBeSection mayBeStories" aria-labelledby="may-be-stories-title">
              <div className="mayBeSectionHeading">
                <p className="streamLabel">User Story Architecture</p>
                <h2 id="may-be-stories-title">Twenty stories organised around five human needs.</h2>
                <p>Each epic translates the product idea into observable, testable behaviour.</p>
              </div>
              <div className="mayBeStoryRows">
                {mayBeUserStories.map(([title, description], index) => (
                  <article key={title}>
                    <span>0{index + 1}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mayBeSystem" aria-labelledby="may-be-system-title">
              <div className="mayBeSectionHeading">
                <p className="streamLabel">Design System</p>
                <h2 id="may-be-system-title">Warm neutrals carry the story. Brown marks the decision.</h2>
                <p>
                  The system uses native typography, generous spacing, minimum 44-point targets, a
                  restrained component set, and motion that explains cause rather than decorating it.
                </p>
              </div>
              <div className="mayBePalette">
                {mayBePalette.map(([name, value]) => (
                  <div key={name}>
                    <span style={{ background: value }} />
                    <strong>{name}</strong>
                    <small>{value}</small>
                  </div>
                ))}
              </div>
              <div className="mayBeSystemDetails">
                <article><span>Type</span><strong>SF Pro / system sans</strong><p>Sentence case, short labels, Dynamic Type, and wrapping before shrinking.</p></article>
                <article><span>Shape</span><strong>Circles and soft surfaces</strong><p>Decision seeds and branches stay tactile without becoming card-heavy.</p></article>
                <article><span>Motion</span><strong>Cause and continuity</strong><p>Paths draw before nodes arrive; the centred logo dot grows into the decision.</p></article>
                <article><span>Access</span><strong>Equivalent paths</strong><p>VoiceOver, Reduce Motion, keyboard, touch, and increased contrast retain the full journey.</p></article>
              </div>
            </section>

            <section className="mayBeOutcome" aria-labelledby="may-be-outcome-title">
              <p className="streamLabel">MVP Outcome</p>
              <h2 id="may-be-outcome-title">A coherent journey, not an answer machine.</h2>
              <p>
                The MVP is complete when a person can speak or type a real situation, recognise their
                meaning in the interpretation, explore a variable decision tree, inspect consequences,
                and return to an earlier fork without losing context. It does not predict outcomes,
                assign probabilities, or pretend generated possibilities are facts.
              </p>
            </section>
          </section>
        ) : null}
        {isAbPharmaStory && !activeDesignStory.sections?.length ? (
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
        {!isMayBeStory && (activeDesignStory.pageImages?.length || !activeDesignStory.sections?.length) ? <section className="caseStudyViewer">
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
        </section> : null}
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
          {renderNavigation("creator")}

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
        {renderNavigation("creator")}

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
      {renderNavigation(activeHomeSection)}

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
            Explore may.be, Spaid, Playmore, and AB Pharma through focused case studies, design
            documents, and editable Figma work.
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
              disabled={!activeDesignStory.documentUrl && !activeDesignStory.sections?.length}
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
                {activeDesignStory.documentUrl || activeDesignStory.sections?.length ? (
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
            {resolvedDesignStories.map((story, index) => (
              <button
                className={index === activeDesignIndex ? "designThumb active" : "designThumb"}
                key={story.slug}
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


