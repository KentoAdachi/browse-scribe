import { NoteItem } from "../hooks/useNotes";
import { getDisplayUrl, getNotePreview, formatDate } from "../utils/formatters";

interface NotesListProps {
  notes: NoteItem[];
  onNoteClick: (url: string) => void;
  onDeleteNote: (url: string, event: React.MouseEvent) => void;
}

export function NotesList({
  notes,
  onNoteClick,
  onDeleteNote,
}: NotesListProps) {
  return (
    <div className="notes-list">
      <h2>All Notes ({notes.length})</h2>
      {notes.length === 0 ? (
        <p className="empty-notes">No notes have been created yet.</p>
      ) : (
        <ul>
          {notes.map((item, index) => (
            <li
              key={index}
              className="note-item"
              onClick={() => onNoteClick(item.url)}
            >
              <div className="note-item-content">
                {item.title && (
                  <div className="note-item-title">{item.title}</div>
                )}
                <div className="note-item-url">{getDisplayUrl(item.url)}</div>
                <div className="note-item-preview">
                  {getNotePreview(item.content)}
                </div>
                <div className="note-item-date">
                  {formatDate(item.lastUpdated)}
                </div>
              </div>
              <button
                className="delete-button"
                onClick={(e) => onDeleteNote(item.url, e)}
                title="Delete this note"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
