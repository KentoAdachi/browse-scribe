// NoteEditor.tsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { formatDate } from "../utils/formatters";

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
  // ⇢ <a> 要素をクリックした場合は編集モードへ入らず
  //    デフォルトのリンク動作（遷移）を優先する
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a")) {
      return;
    }
    setIsEditing(true);
  };

  return (
    <>
      <div className="last-updated-info">
        最終更新日: {formatDate(lastUpdated)}
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
              components={{
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
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
