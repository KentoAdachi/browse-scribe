import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface NoteEditorProps {
  note: string;
  onNoteChange: (content: string) => void;
}

export function NoteEditor({ note, onNoteChange }: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleNoteChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    onNoteChange(e.target.value);
  };

  return (
    <>
      {isEditing ? (
        <textarea
          value={note}
          onChange={handleNoteChange}
          onBlur={() => setIsEditing(false)}
          className="note-editor"
          autoFocus
          placeholder="Write your notes here using Markdown..."
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
