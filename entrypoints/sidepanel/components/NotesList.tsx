import { NoteItem } from "../hooks/useNotes";
import { getDisplayUrl, getNotePreview, formatDate } from "../utils/formatters";
import { useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Filter notes based on search query (content, URL, or date)
  // Then sort by lastUpdated date (newest first)
  const filteredNotes =
    searchQuery.trim() === ""
      ? [...notes].sort((a, b) => (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0))
      : notes
          .filter((note) => {
            const query = searchQuery.toLowerCase();
            // Search in content
            if (note.content.toLowerCase().includes(query)) return true;
            // Search in URL
            if (note.url.toLowerCase().includes(query)) return true;
            // Search in title
            if (note.title?.toLowerCase().includes(query)) return true;
            // Search in formatted date
            const formattedDate = formatDate(note.lastUpdated).toLowerCase();
            if (formattedDate.includes(query)) return true;

            return false;
          })
          .sort((a, b) => (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0));

  // ---- Export handlers ----
  const handleExportCSV = () => {
    const csvHeader = ["URL", "Title", "Content", "Last Updated"].join(",");
    const csvRows = notes.map((n) => {
      const dateStr = n.lastUpdated
        ? new Date(n.lastUpdated).toISOString()
        : "";
      const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
      return [
        escape(n.url),
        escape(n.title || ""),
        escape(n.content),
        escape(dateStr),
      ].join(",");
    });
    const csvContent = [csvHeader, ...csvRows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notes_export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(notes, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notes_export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="notes-list">
      <h2>All Notes ({notes.length})</h2>
      <div className="export-buttons">
        <button onClick={handleExportCSV}>Export CSV</button>
        <button onClick={handleExportJSON}>Export JSON</button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="検索: メモ内容、URL、更新日..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="clear-search-button"
            onClick={() => setSearchQuery("")}
            title="検索をクリア"
          >
            ×
          </button>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        searchQuery ? (
          <p className="empty-notes">検索条件に一致するメモはありません。</p>
        ) : (
          <p className="empty-notes">No notes have been created yet.</p>
        )
      ) : (
        <ul>
          {filteredNotes.map((item, index) => (
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
