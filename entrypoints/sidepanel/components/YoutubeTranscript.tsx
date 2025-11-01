import { useState, useEffect } from "react";
import OpenAI from "openai";
import { useApiSettings } from "../hooks/useApiSettings";

interface YoutubeTranscriptProps {
  url: string;
  title: string;
  onAddToNote?: (transcript: string) => void;
}

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

// NoteGPT API response types
interface NoteGptResponse {
  code: number; // 100000 = success
  message: string;
  data: NoteGptData;
}

interface NoteGptData {
  videoId: string;
  videoInfo: {
    name: string;
    author: string;
    duration: string;
  };
  language_code: Array<{ code: string; name: string }>;
  transcripts: Record<string, TranscriptLanguage>;
}

interface TranscriptLanguage {
  custom?: TranscriptSegment[];
  default?: TranscriptSegment[];
  auto?: TranscriptSegment[];
}

interface TranscriptSegment {
  start: string; // "HH:MM:SS" or "MM:SS"
  end: string;
  text: string;
}

export function YoutubeTranscript({
  url,
  title,
  onAddToNote,
}: YoutubeTranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { apiKey, model, baseUrl } = useApiSettings();

  // Initialize OpenAI client with API key from settings
  const openai = new OpenAI({
    apiKey: apiKey || "",
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true, // Allow usage in browser environment
  });

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Parse timestamp string ("HH:MM:SS" or "MM:SS") to seconds
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(":").map(Number);
    if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    // MM:SS format
    return parts[0] * 60 + parts[1];
  };

  // Fetch transcript from NoteGPT API
  const fetchTranscriptFromApi = async (
    videoId: string
  ): Promise<TranscriptItem[]> => {
    const url = new URL("https://notegpt.io/api/v2/video-transcript");
    url.searchParams.append("platform", "youtube");
    url.searchParams.append("video_id", videoId);

    const response = await fetch(url.toString(), {
      headers: {
        Cookie: "anonymous_user_id=2500e00db502a74d4fd5d1b754d436fe",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: NoteGptResponse = await response.json();

    // Check if API returned success code
    if (data.code !== 100000) {
      throw new Error(`API error: ${data.message}`);
    }

    // Extract transcripts - priority: default > auto > custom
    const languageCode = data.data.language_code[0]?.code;
    if (!languageCode) {
      throw new Error("No language code found in response");
    }

    const transcriptLanguage = data.data.transcripts[languageCode];
    if (!transcriptLanguage) {
      throw new Error("No transcript found for language code");
    }

    // Select transcript segments based on priority
    const segments =
      transcriptLanguage.default ||
      transcriptLanguage.auto ||
      transcriptLanguage.custom;

    if (!segments || segments.length === 0) {
      throw new Error("No transcript segments found");
    }

    // Convert NoteGPT format to internal format
    return segments.map((segment) => {
      const startSeconds = parseTimestamp(segment.start);
      const endSeconds = parseTimestamp(segment.end);
      return {
        text: segment.text,
        offset: startSeconds,
        duration: endSeconds - startSeconds,
      };
    });
  };

  useEffect(() => {
    const getTranscript = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const videoId = extractVideoId(url);
        if (!videoId) {
          throw new Error("Invalid YouTube URL");
        }

        const result = await fetchTranscriptFromApi(videoId);
        setTranscript(result);
      } catch (err) {
        setError(
          "Failed to load transcript. This video may not have captions available."
        );
        console.error("Error fetching transcript:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      getTranscript();
    }
  }, [url]);

  // Clear error when URL changes to avoid persisting error state across videos
  useEffect(() => {
    setError(null);
  }, [url]);

  // Format seconds to MM:SS or HH:MM:SS format
  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Format transcript with timestamps for GPT to reference
  const formatTranscript = (): string => {
    return transcript
      .map((item) => {
        const timestamp = formatTimestamp(item.offset);
        return `[${timestamp}] ${item.text}`;
      })
      .join("\n");
  };

  const summarizeTranscript = async (
    text: string,
    videoId: string
  ): Promise<string> => {
    try {
      if (!apiKey) {
        return "APIキーが設定されていません。設定画面でAPIキーを設定してください。";
      }

      const response = await openai.chat.completions.create({
        model: model || "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content:
              "あなたは要約の専門家です。以下のテキストをMarkdownを用いて簡潔に箇条書き中心で要約してください。原稿は自動生成されたものであるため、不正確な単語は柔軟に読み替え、要約は日本語で行ってください。最初のタイトルは不要です。最初に動画全体の概要を簡潔に説明後、各トピックは見出し3（###）で始めてください。\n\n重要な箇所には、YouTubeの該当位置に飛べるリンクを追加してください。トランスクリプトの各行は[MM:SS]または[HH:MM:SS]の形式でタイムスタンプが付いています。リンクは以下の形式で記述してください:\n[MM:SS](https://www.youtube.com/watch?v=" +
              videoId +
              "&t=XXXs)\nここでXXXは秒数です（例: [12:34]なら&t=754s）。重要なポイントや話題が変わる箇所に適度にリンクを配置してください。",
          },
          {
            role: "user",
            content: `以下のYouTube動画「${title}」のトランスクリプトを要約してください:\n\n${text}`,
          },
        ],
      });

      return (
        response.choices[0]?.message?.content || "要約を生成できませんでした。"
      );
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "要約の生成中にエラーが発生しました。APIキーが正しく設定されているか確認してください。";
    }
  };

  const handleAddToNote = async () => {
    if (onAddToNote && transcript.length > 0) {
      try {
        setIsSummarizing(true);
        const videoId = extractVideoId(url);
        if (!videoId) {
          console.error("Failed to extract video ID");
          return;
        }

        const formattedTranscript = formatTranscript();
        const summary = await summarizeTranscript(formattedTranscript, videoId);

        const heading = "## YouTube Transcript Summary";
        onAddToNote(`${heading}\n\n${summary}\n\n`);
      } catch (error) {
        console.error("Error during summarization:", error);
      } finally {
        setIsSummarizing(false);
      }
    }
  };

  if (isLoading) {
    return <div className="transcript-loading">Loading transcript...</div>;
  }

  if (error) {
    return <div className="transcript-error">{error}</div>;
  }

  return (
    <div className="youtube-transcript">
      <div className="transcript-header">
        <div className="transcript-title">
          <h3>YouTube Transcript</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="toggle-transcript-button"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "折畳" : "展開"}
          </button>
        </div>
        <button
          onClick={handleAddToNote}
          className="add-transcript-button"
          disabled={isSummarizing || !apiKey}
          title={!apiKey ? "APIキーが設定されていません" : ""}
        >
          {isSummarizing ? "Summarizing..." : "Add to Note"}
        </button>
      </div>
      <div
        className={`transcript-content ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        {isExpanded && transcript.length > 0 ? (
          <div>
            {transcript.map((item, index) => (
              <span key={index} className="transcript-item">
                {item.text}{" "}
              </span>
            ))}
          </div>
        ) : (
          <p>
            {transcript.length > 0
              ? "Click expand to view transcript"
              : "No transcript available for this video."}
          </p>
        )}
      </div>
    </div>
  );
}
