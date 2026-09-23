import type { CreatorVideo } from "./portfolioData";

type ChannelResponse = {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
};

type PlaylistResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      resourceId?: {
        videoId?: string;
      };
      thumbnails?: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }>;
};

type VideoDetailsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      publishedAt?: string;
    };
    status?: {
      embeddable?: boolean;
    };
  }>;
};

type YouTubeConfig = {
  apiKey?: string;
  channelId?: string;
  playlistId?: string;
  username: string;
};

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

const getDisplayTitle = (title: string) => {
  const normalized = title.trim();
  const [cleanTitle] = normalized.split(/\s[-|]\s|[|-]/);

  return cleanTitle?.trim() || normalized || "Untitled";
};

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`YouTube request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const getUploadsPlaylistId = async (config: YouTubeConfig) => {
  const channelParams = new URLSearchParams({
    part: "contentDetails",
    key: config.apiKey ?? "",
  });

  if (config.channelId) {
    channelParams.set("id", config.channelId);
  } else {
    channelParams.set("forUsername", config.username);
  }

  const data = await getJson<ChannelResponse>(`${YOUTUBE_API}/channels?${channelParams}`);
  const uploadsPlaylistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new Error("Unable to resolve YouTube uploads playlist.");
  }

  return uploadsPlaylistId;
};

const getVideoDetails = async (videoIds: string[], apiKey: string) => {
  if (videoIds.length === 0) {
    return new Map<string, { embeddable: boolean; year: string }>();
  }

  const videoParams = new URLSearchParams({
    part: "snippet,status",
    id: videoIds.join(","),
    key: apiKey,
  });
  const data = await getJson<VideoDetailsResponse>(`${YOUTUBE_API}/videos?${videoParams}`);

  return new Map(
    data.items
      ?.filter((item) => item.id)
      .map((item) => [
        item.id as string,
        {
          embeddable: Boolean(item.status?.embeddable),
          year: item.snippet?.publishedAt
            ? new Date(item.snippet.publishedAt).getFullYear().toString()
            : "YouTube",
        },
      ]) ?? [],
  );
};

export const fetchCreatorVideos = async (config: YouTubeConfig): Promise<CreatorVideo[]> => {
  if (!config.apiKey) {
    throw new Error("Missing VITE_YOUTUBE_API_KEY.");
  }

  const uploadsPlaylistId = config.playlistId || (await getUploadsPlaylistId(config));
  const playlistParams = new URLSearchParams({
    part: "snippet",
    maxResults: "24",
    playlistId: uploadsPlaylistId,
    key: config.apiKey,
  });
  const data = await getJson<PlaylistResponse>(`${YOUTUBE_API}/playlistItems?${playlistParams}`);
  const playlistItems = data.items ?? [];
  const videoIds = playlistItems
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter((videoId): videoId is string => Boolean(videoId));
  const videoDetails = await getVideoDetails(videoIds, config.apiKey);

  return (
    playlistItems
      ?.map((item, index): CreatorVideo | null => {
        const snippet = item.snippet;
        const videoId = snippet?.resourceId?.videoId;

        if (
          !snippet ||
          !videoId ||
          !videoDetails.get(videoId)?.embeddable ||
          snippet.title === "Deleted video" ||
          snippet.title === "Private video"
        ) {
          return null;
        }

        const publishedYear = videoDetails.get(videoId)?.year ?? "YouTube";
        const category = "My Directions";

        return {
          title: snippet.title ?? "Untitled video",
          displayTitle: getDisplayTitle(snippet.title ?? "Untitled video"),
          videoId,
          description: snippet.description || "A creator video from Basil Bose.",
          category,
          year: publishedYear,
          runtime: "YouTube",
          genre: category === "My Directions" ? "Short Film" : "Cinematography",
          cast: ["Basil Bose"],
          crew: ["Direction: Basil Bose", "Creator: Basil Bose"],
          thumbnailUrl:
            snippet.thumbnails?.maxres?.url ??
            snippet.thumbnails?.high?.url ??
            snippet.thumbnails?.medium?.url ??
            snippet.thumbnails?.default?.url,
        };
      })
      .filter((video): video is CreatorVideo => Boolean(video)) ?? []
  );
};
