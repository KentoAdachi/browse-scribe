import { useState, useCallback } from "react";
import "./App.css";
import { useNotes } from "./hooks/useNotes";
import { useTabs } from "./hooks/useTabs";
import { NoteEditor } from "./components/NoteEditor";
import { NotesList } from "./components/NotesList";

function App() {
  const [showNotesList, setShowNotesList] = useState(false);

  // Initialize notes hook
  const {
    note,
    title, // Adding title from useNotes hook
    lastUpdated,
    allNotes,
    loadNote,
    loadAllNotes,
    saveNote,
    deleteNote,
  } = useNotes();

  // Handle URL changes with a callback to avoid dependency issues
  const handleUrlChange = useCallback(
    (url: string, pageTitle: string) => {
      loadNote(url);
    },
    [loadNote]
  );

  // Initialize tabs hook with URL change callback
  const { currentUrl, currentTitle, navigateToUrl } = useTabs(handleUrlChange);

  // Handle note changes
  const handleNoteChange = (content: string): void => {
    saveNote(currentUrl, content, currentTitle);
  };

  // Navigate to a URL and show its note
  const handleNoteClick = (url: string) => {
    navigateToUrl(url);
    setShowNotesList(false); // Switch back to note view
  };

  // Delete a note
  const handleDeleteNote = async (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the navigateToNote
    await deleteNote(url);

    // If the deleted note is the current one, clear the current display
    if (url === currentUrl) {
      loadNote(currentUrl);
    }
  };

  // Toggle between current note view and notes list
  const toggleView = () => {
    setShowNotesList(!showNotesList);
    if (!showNotesList) {
      loadAllNotes(); // Refresh the notes list when showing it
    }
  };

  return (
    <div className="note-container">
      <div className="header">
        <h1>BrowseScribe</h1>
        <button onClick={toggleView} className="toggle-button">
          {showNotesList ? "Current Note" : "All Notes"}
        </button>
      </div>

      {showNotesList ? (
        <NotesList
          notes={allNotes}
          onNoteClick={handleNoteClick}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <>
          <NoteEditor
            note={note}
            lastUpdated={lastUpdated}
            onNoteChange={handleNoteChange}
          />
        </>
      )}
    </div>
  );
}

export default App;
