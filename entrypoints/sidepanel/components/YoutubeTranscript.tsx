import { useState, useEffect } from "react";
import { fetchTranscript } from "youtube-transcript-plus";
import OpenAI from "openai";

interface YoutubeTranscriptProps {
  url: string;
  onAddToNote?: (transcript: string) => void;
}

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "",
  dangerouslyAllowBrowser: true, // Allow usage in browser environment
});

export function YoutubeTranscript({
  url,
  onAddToNote,
}: YoutubeTranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const getTranscript = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchTranscript(url);
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

  const formatTranscript = (): string => {
    return transcript.map((item) => item.text).join(" ");
  };

  const summarizeTranscript = async (text: string): Promise<string> => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content:
              "あなたは要約の専門家です。以下のテキストを簡潔に要約してください。要約にはマークダウン形式を使用してください。",
          },
          {
            role: "user",
            content: `以下のYouTube動画のトランスクリプトを要約してください:\n\n${text}`,
          },
        ],
        max_tokens: 500,
      });

      return (
        response.choices[0]?.message?.content || "要約を生成できませんでした。"
      );
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "要約の生成中にエラーが発生しました。";
    }
  };

  const handleAddToNote = async () => {
    if (onAddToNote && transcript.length > 0) {
      try {
        setIsSummarizing(true);
        const formattedTranscript = formatTranscript();
        const summary = await summarizeTranscript(formattedTranscript);

        onAddToNote(`## YouTube Transcript Summary\n\n${summary}\n\n`);
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
        <h3>YouTube Transcript</h3>
        <button
          onClick={handleAddToNote}
          className="add-transcript-button"
          disabled={isSummarizing}
        >
          {isSummarizing ? "Summarizing..." : "Add to Note"}
        </button>
      </div>
      <div className="transcript-content">
        {transcript.length > 0 ? (
          <div>
            {transcript.map((item, index) => (
              <span key={index} className="transcript-item">
                {item.text}{" "}
              </span>
            ))}
          </div>
        ) : (
          <p>No transcript available for this video.</p>
        )}
      </div>
    </div>
  );
}
