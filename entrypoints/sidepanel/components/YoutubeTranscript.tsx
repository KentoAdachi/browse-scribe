import { useState, useEffect } from "react";
import { fetchTranscript } from "youtube-transcript-plus";
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

  useEffect(() => {
    const getTranscript = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchTranscript(url, { lang: "ja" });
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

  const formatTranscript = (): string => {
    return transcript.map((item) => item.text).join(" ");
  };

  const summarizeTranscript = async (text: string): Promise<string> => {
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
              "あなたは要約の専門家です。以下のテキストをMarkdownを用いて簡潔に箇条書き中心で要約してください。原稿は自動生成されたものであるため、不正確な単語は柔軟に読み替え、要約は日本語で行ってください。最初のタイトルは不要です。最初に動画全体の概要を簡潔に説明後、各トピックは見出し3（###）で始めてください。",
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
        const formattedTranscript = formatTranscript();
        const summary = await summarizeTranscript(formattedTranscript);

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
              ? "トランスクリプトを表示するには展開ボタンをクリックしてください"
              : "No transcript available for this video."}
          </p>
        )}
      </div>
    </div>
  );
}
