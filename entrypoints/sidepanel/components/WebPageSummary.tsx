import { useState, useEffect } from "react";
import OpenAI from "openai";
import { useApiSettings } from "../hooks/useApiSettings";

interface WebPageSummaryProps {
  url: string;
  title: string;
  onAddToNote?: (summary: string) => void;
}

export function WebPageSummary({
  url,
  title,
  onAddToNote,
}: WebPageSummaryProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const { apiKey, model, baseUrl } = useApiSettings();

  // Initialize OpenAI client with API key from settings
  const openai = new OpenAI({
    apiKey: apiKey || "",
    baseURL: baseUrl,
    dangerouslyAllowBrowser: true, // Allow usage in browser environment
  });

  useEffect(() => {
    let isCancelled = false;

    const getPageContent = async (retryCount = 0) => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if URL is accessible
        if (
          url.startsWith("chrome://") ||
          url.startsWith("chrome-extension://") ||
          url.startsWith("moz-extension://")
        ) {
          throw new Error("Cannot access browser internal pages");
        }

        // Wait a bit for page to load if this is a retry
        if (retryCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Send message to content script to get page content
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab.id) {
          throw new Error("No active tab found");
        }

        // Check if tab is still loading
        if (tab.status === "loading" && retryCount < 3) {
          if (!isCancelled) {
            setTimeout(() => getPageContent(retryCount + 1), 1000);
          }
          return;
        }

        const response = await Promise.race([
          browser.tabs.sendMessage(tab.id, {
            action: "getPageContent",
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
          ),
        ]);

        if (isCancelled) return;

        if (response && response.content) {
          setContent(response.content);
        } else if (response && response.error) {
          throw new Error(response.error);
        } else if (retryCount < 2) {
          // Retry up to 2 times
          setTimeout(() => getPageContent(retryCount + 1), 1000);
          return;
        } else {
          throw new Error("Failed to extract page content");
        }
      } catch (err) {
        if (isCancelled) return;

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        if (
          errorMessage.includes("Cannot access") ||
          errorMessage.includes("browser internal")
        ) {
          setError("Cannot summarize browser internal pages or extensions.");
        } else if (errorMessage.includes("Timeout") && retryCount < 2) {
          setTimeout(() => getPageContent(retryCount + 1), 1000);
          return;
        } else {
          setError(
            "Failed to load page content. Please make sure the page is fully loaded and try refreshing."
          );
        }
        console.error("Error fetching page content:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (url) {
      getPageContent();
    }

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Clear error when URL changes
  useEffect(() => {
    setError(null);
  }, [url]);

  const summarizeContent = async (text: string): Promise<string> => {
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
              "あなたは要約の専門家です。以下のWebページのテキストをMarkdownを用いて簡潔に箇条書き中心で要約してください。要約は日本語で行ってください。最初のタイトルは不要です。最初にページ全体の概要を簡潔に説明後、各トピックは見出し3（###）で始めてください。広告やナビゲーション要素などの不要な情報は除外し、主要なコンテンツに焦点を当ててください。",
          },
          {
            role: "user",
            content: `以下のWebページ「${title}」の内容を要約してください:\n\n${text}`,
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

  const askQuestion = async (text: string, prompt: string): Promise<string> => {
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
              "あなたはWebページの内容分析の専門家です。以下のWebページの内容に基づいて、ユーザーの質問に正確に答えてください。回答は日本語で行い、Markdownを使って読みやすく整理してください。ページの内容に含まれていない情報については、「ページに記載されていません」と明記してください。",
          },
          {
            role: "user",
            content: `以下のWebページ「${title}」の内容に基づいて質問に答えてください。\n\n【質問】\n${prompt}\n\n【Webページの内容】\n${text}`,
          },
        ],
      });

      return (
        response.choices[0]?.message?.content || "回答を生成できませんでした。"
      );
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "回答の生成中にエラーが発生しました。APIキーが正しく設定されているか確認してください。";
    }
  };

  const handleAddToNote = async () => {
    if (onAddToNote && content) {
      try {
        setIsSummarizing(true);
        const isCustomPrompt = customPrompt.trim().length > 0;

        let result: string;
        let heading: string;

        if (isCustomPrompt) {
          result = await askQuestion(content, customPrompt.trim());
          heading = "## Web Page Analysis";
        } else {
          result = await summarizeContent(content);
          heading = "## Web Page Summary";
        }

        onAddToNote(`${heading}\n\n${result}\n\n`);

        // Clear the custom prompt after successful processing
        if (isCustomPrompt) {
          setCustomPrompt("");
        }
      } catch (error) {
        console.error("Error during processing:", error);
      } finally {
        setIsSummarizing(false);
      }
    }
  };

  if (isLoading) {
    return <div className="transcript-loading">Loading page content...</div>;
  }

  if (error) {
    return <div className="transcript-error">{error}</div>;
  }

  const isCustomPrompt = customPrompt.trim().length > 0;

  return (
    <div className="youtube-transcript">
      <div className="transcript-header">
        <div className="transcript-title">
          <h3>Web Page Content</h3>
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
          {isSummarizing
            ? isCustomPrompt
              ? "分析中..."
              : "要約中..."
            : isCustomPrompt
            ? "質問する"
            : "要約する"}
        </button>
      </div>

      {/* Custom prompt input */}
      <div
        className="prompt-input-container"
        style={{ padding: "10px", borderBottom: "1px solid #eee" }}
      >
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="質問を入力してください（空の場合は要約を生成します）"
          rows={3}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        {customPrompt.trim() && (
          <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
            質問モード: このページの内容について質問します
          </div>
        )}
      </div>

      <div
        className={`transcript-content ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        {isExpanded && content ? (
          <div>
            <div className="transcript-item">
              {content.substring(0, 1000)}
              {content.length > 1000 && "..."}
            </div>
          </div>
        ) : (
          <p>
            {content
              ? "Click expand to view page content"
              : "No content available for this page."}
          </p>
        )}
      </div>
    </div>
  );
}
