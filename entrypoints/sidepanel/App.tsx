import { useState, useCallback, useMemo } from "react";
import "./App.css";
import { useNotes } from "./hooks/useNotes";
import { useTabs } from "./hooks/useTabs";
import { NoteEditor } from "./components/NoteEditor";
import { NotesList } from "./components/NotesList";
import { WebPageSummary } from "./components/WebPageSummary";
import { Settings } from "./components/Settings/Settings";

function App() {
  const [showNotesList, setShowNotesList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize notes hook
  const {
    note,
    title,
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

  // Handle adding summary to note
  const handleAddSummaryToNote = (summary: string): void => {
    // Combine existing note with summary
    const updatedNote = note ? `${note}\n\n${summary}` : summary;
    handleNoteChange(updatedNote);
  };

  // Navigate to a URL and show its note
  const handleNoteClick = (url: string) => {
    navigateToUrl(url);
    setShowNotesList(false); // Switch back to note view
    setShowSettings(false); // Ensure settings are closed
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
    setShowSettings(false); // Close settings when toggling view
    if (!showNotesList) {
      loadAllNotes(); // Refresh the notes list when showing it
    }
  };

  // Toggle settings view
  const toggleSettings = () => {
    setShowSettings(!showSettings);
    setShowNotesList(false); // Close notes list when toggling settings
  };

  return (
    <div className="note-container">
      <div className="header">
        <h1>{title || "BrowseScribe"}</h1>
        <div className="header-buttons">
          <button onClick={toggleSettings} className="settings-button">
            {showSettings ? "Back" : "⚙️ Settings"}
          </button>
          <button onClick={toggleView} className="toggle-button">
            {showNotesList ? "Current Note" : "All Notes"}
          </button>
        </div>
      </div>

      {showSettings ? (
        <Settings />
      ) : showNotesList ? (
        <NotesList
          notes={allNotes}
          onNoteClick={handleNoteClick}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <>
          <WebPageSummary
            url={currentUrl}
            title={currentTitle}
            onAddToNote={handleAddSummaryToNote}
          />
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
