// NoteEditor.tsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { formatDate } from "../utils/formatters";
import { browser } from "wxt/browser";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

interface NoteEditorProps {
  note: string;
  lastUpdated?: number;
  onNoteChange: (content: string) => void;
  autoEdit?: boolean;
}

export function NoteEditor({
  note,
  lastUpdated,
  onNoteChange,
  autoEdit = false,
}: NoteEditorProps) {
  /** 表示モードか編集モードか */
  const [isEditing, setIsEditing] = useState(false);
  /** テキストエリアの下書き内容 */
  const [draft, setDraft] = useState(note);
  /** IME 変換中かどうか */
  const isComposing = useRef(false);
  /** Text-to-speech hook */
  const { isSpeaking, isPaused, speak, pause, resume, stop, isSupported } =
    useSpeechSynthesis();

  /* ------------------------------------------------------------------
     1. 親から渡される note が変わったら draft を同期
        ─ 編集中でなければ常に上書き
        ─ 編集中の場合は、ユーザー操作を尊重して draft を保持
  ------------------------------------------------------------------ */
  useEffect(() => {
    // 編集中以外のタイミングでのみ draft を同期
    if (!isEditing) {
      setDraft(note);
    }
  }, [note, isEditing]);

  /* ------------------------------------------------------------------
     2. autoEdit の値に合わせて編集モードを切り替え
  ------------------------------------------------------------------ */
  useEffect(() => {
    setIsEditing(autoEdit);
  }, [autoEdit]);

  /* ------------------------------------------------------------------
     3. 入力処理
        ─ IME 変換確定前は onNoteChange を呼ばず draft だけ更新
        ─ 変換確定後 / 通常入力時に保存
  ------------------------------------------------------------------ */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);

    if (!isComposing.current) {
      const trimmed = value.trim();
      onNoteChange(trimmed || "");
    }
  };

  // プレビュー領域クリック時の処理
  // ⇢ <a> 要素やタイムスタンプリンクをクリックした場合は編集モードへ入らず
  //    デフォルトのリンク動作（遷移）を優先する
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // リンクやクリック可能な要素の場合は編集モードに入らない
    if (target.closest("a") || target.onclick || target.style.cursor === "pointer") {
      return;
    }
    setIsEditing(true);
  };

  /* ------------------------------------------------------------------
     4. タイムスタンプリンクのクリックハンドラー
        ─ timestamp:// スキームのリンクを検出してYouTube動画をシーク
  ------------------------------------------------------------------ */
  const handleTimestampLinkClick = async (href: string) => {
    console.log("[NoteEditor] Timestamp link clicked:", href);
    const seconds = parseInt(href.replace("timestamp://", ""), 10);
    console.log("[NoteEditor] Parsed seconds:", seconds);

    if (!isNaN(seconds)) {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        console.log("[NoteEditor] Active tab:", tab);

        // Check if we're on a YouTube page
        if (!tab.url?.includes("youtube.com/watch")) {
          console.warn("[NoteEditor] Not on a YouTube video page");
          alert("この機能はYouTube動画ページでのみ動作します");
          return;
        }

        if (tab.id) {
          console.log("[NoteEditor] Sending message to tab:", tab.id);
          const response = await browser.tabs.sendMessage(tab.id, {
            action: "seekVideo",
            timestamp: seconds,
          });
          console.log("[NoteEditor] Response from content script:", response);

          if (response && !response.success) {
            console.error("[NoteEditor] Seek failed:", response.error);
            alert("動画のシークに失敗しました");
          }
        } else {
          console.error("[NoteEditor] No tab ID found");
        }
      } catch (error) {
        console.error("[NoteEditor] Error seeking video:", error);
        // Don't show alert for connection errors when not on YouTube
        if (error instanceof Error && !error.message.includes("Receiving end does not exist")) {
          alert("動画のシークに失敗しました");
        }
      }
    } else {
      console.error("[NoteEditor] Invalid timestamp:", href);
    }
  };

  const handleSpeakNote = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      speak(note);
    }
  };

  const handleStopSpeaking = () => {
    stop();
  };

  return (
    <>
      <div className="editor-header">
        <div className="last-updated-info">
          最終更新日: {formatDate(lastUpdated)}
        </div>
        {isSupported && note && !isEditing && (
          <div className="tts-controls">
            <button
              onClick={handleSpeakNote}
              className="tts-button"
              title={
                isSpeaking
                  ? isPaused
                    ? "再生"
                    : "一時停止"
                  : "音声読み上げ"
              }
            >
              {isSpeaking ? (isPaused ? "▶️" : "⏸️") : "🔊"}
            </button>
            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                className="tts-button tts-stop"
                title="停止"
              >
                ⏹️
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={draft}
          autoFocus
          placeholder="Write your notes here using Markdown..."
          className="note-editor"
          onChange={handleChange}
          onCompositionStart={() => (isComposing.current = true)}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            const trimmed = e.currentTarget.value.trim();
            onNoteChange(trimmed || "");
          }}
          onBlur={() => {
            const trimmed = draft.trim();
            /* 変更がある & 空でない場合のみ保存 */
            if (trimmed !== note && trimmed !== "") {
              onNoteChange(trimmed);
            }
            setIsEditing(false);
          }}
        />
      ) : (
        <div className="note-preview" onClick={handlePreviewClick}>
          {note ? (
            <ReactMarkdown
              urlTransform={(url) => {
                // Allow timestamp:// scheme to pass through
                if (url.startsWith("timestamp://")) {
                  return url;
                }
                // Default behavior for other URLs
                return url;
              }}
              components={{
                a: ({ node, href, children, ...props }) => {
                  console.log("[NoteEditor] Rendering link:", { href, children });

                  // タイムスタンプリンクの処理
                  if (href?.startsWith("timestamp://")) {
                    console.log("[NoteEditor] Creating timestamp span for:", href);
                    return (
                      <span
                        onClick={(e) => {
                          console.log("[NoteEditor] Span clicked");
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          handleTimestampLinkClick(href);
                          return false;
                        }}
                        onMouseDown={(e) => {
                          console.log("[NoteEditor] Span mousedown");
                          e.preventDefault();
                        }}
                        style={{
                          color: "#4a8fee",
                          cursor: "pointer",
                          textDecoration: "underline",
                          display: "inline",
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {children}
                      </span>
                    );
                  }
                  // 通常のリンク
                  console.log("[NoteEditor] Creating regular link for:", href);
                  return (
                    <a {...props} href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {note}
            </ReactMarkdown>
          ) : (
            <p className="empty-note">Click to add a note for this page</p>
          )}
        </div>
      )}
    </>
  );
}
