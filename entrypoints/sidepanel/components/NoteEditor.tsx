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
        ─ 編集中でも draft が空なら上書き（初期ロード遅延対策）
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isEditing || draft === "") {
      setDraft(note);
    }
  }, [note, isEditing, draft]);

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
        <div className="note-preview" onClick={() => setIsEditing(true)}>
          {note ? (
            <ReactMarkdown>{note}</ReactMarkdown>
          ) : (
            <p className="empty-note">Click to add a note for this page</p>
          )}
        </div>
      )}
    </>
  );
}
