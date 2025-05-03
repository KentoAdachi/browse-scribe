import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { formatDate } from "../utils/formatters";

interface NoteEditorProps {
  note: string;
  lastUpdated?: number;
  onNoteChange: (content: string) => void;
}

export function NoteEditor({
  note,
  lastUpdated,
  onNoteChange,
}: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note); // ローカルで保持
  const isComposing = useRef(false); // IME中フラグ

  /* 親から note が更新されたときは draft も同期 */
  useEffect(() => {
    if (!isEditing) setDraft(note);
  }, [note, isEditing]);

  /* 変換確定前は親へ送らず draft だけ更新 */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);
    if (!isComposing.current) onNoteChange(value);
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
            onNoteChange(e.currentTarget.value); // 確定後に一度だけ送る
          }}
          onBlur={() => {
            onNoteChange(draft); // 最終同期
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
