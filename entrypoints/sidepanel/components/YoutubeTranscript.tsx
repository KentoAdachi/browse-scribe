import { useState, useEffect } from "react";
import { fetchTranscript } from "youtube-transcript-plus";

interface YoutubeTranscriptProps {
  url: string;
  onAddToNote?: (transcript: string) => void;
}

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

export function YoutubeTranscript({ url, onAddToNote }: YoutubeTranscriptProps) {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTranscript = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchTranscript(url);
        setTranscript(result);
      } catch (err) {
        setError("Failed to load transcript. This video may not have captions available.");
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
    return transcript.map(item => item.text).join(" ");
  };

  const handleAddToNote = () => {
    if (onAddToNote && transcript.length > 0) {
      const formattedTranscript = formatTranscript();
      onAddToNote(`## YouTube Transcript\n\n${formattedTranscript}`);
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
        <button onClick={handleAddToNote} className="add-transcript-button">
          Add to Note
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