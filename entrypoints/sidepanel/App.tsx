import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

// Type for note items
interface NoteItem {
  url: string;
  content: string;
}

function App() {
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [allNotes, setAllNotes] = useState<NoteItem[]>([]);
  const [showNotesList, setShowNotesList] = useState(false);

  // Load note when component mounts or URL changes
  useEffect(() => {
    const getCurrentTab = async () => {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        loadNote(tabs[0].url);
      }
    };

    getCurrentTab();
    loadAllNotes(); // Load all notes on mount

    // Listen for tab updates to refresh notes when URL changes
    const handleTabUpdate = async (
      tabId: number,
      changeInfo: { url?: string }
    ) => {
      if (changeInfo.url) {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id === tabId) {
          setCurrentUrl(changeInfo.url);
          loadNote(changeInfo.url);
        }
      }
    };

    browser.tabs.onUpdated.addListener(handleTabUpdate);
    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []);

  // Load note from storage based on URL
  const loadNote = async (url: string): Promise<void> => {
    try {
      const data = await browser.storage.local.get(url);
      if (data[url]) {
        setNote(data[url]);
      } else {
        setNote("");
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  // Load all notes from storage
  const loadAllNotes = async () => {
    try {
      const data = await browser.storage.local.get(null); // Get all items
      const notes: NoteItem[] = [];

      // Convert the object to an array of note items
      Object.entries(data).forEach(([url, content]) => {
        // Only include items that have content (and are likely notes)
        if (typeof content === "string" && content.trim()) {
          notes.push({ url, content: content as string });
        }
      });

      setAllNotes(notes);
    } catch (error) {
      console.error("Error loading all notes:", error);
    }
  };

  // Save note to storage
  const saveNote = async (content: string): Promise<void> => {
    try {
      await browser.storage.local.set({ [currentUrl]: content });
      // Refresh the notes list
      loadAllNotes();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Handle note changes
  const handleNoteChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    const newContent: string = e.target.value;
    setNote(newContent);
    saveNote(newContent);
  };

  // Navigate to a URL and show its note
  const navigateToNote = async (url: string) => {
    try {
      // Update the current tab to the URL of this note
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        await browser.tabs.update(tabs[0].id, { url });
        setCurrentUrl(url);
        loadNote(url);
        setShowNotesList(false); // Switch back to note view
      }
    } catch (error) {
      console.error("Error navigating to note:", error);
    }
  };

  // Delete a note
  const deleteNote = async (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the navigateToNote
    try {
      await browser.storage.local.remove(url);
      loadAllNotes(); // Refresh the list

      // If the deleted note is the current one, clear the current note
      if (url === currentUrl) {
        setNote("");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Get a preview of the note content (first 50 characters)
  const getNotePreview = (content: string): string => {
    const maxLength = 50;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Get a display version of URL (shortened)
  const getDisplayUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let displayUrl = urlObj.hostname + urlObj.pathname;
      if (displayUrl.length > 40) {
        displayUrl = displayUrl.substring(0, 37) + "...";
      }
      return displayUrl;
    } catch (e) {
      return url.length > 40 ? url.substring(0, 37) + "..." : url;
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
        <h1>WebNote</h1>
        <button onClick={toggleView} className="toggle-button">
          {showNotesList ? "Current Note" : "All Notes"}
        </button>
      </div>

      {showNotesList ? (
        <div className="notes-list">
          <h2>All Notes ({allNotes.length})</h2>
          {allNotes.length === 0 ? (
            <p className="empty-notes">No notes have been created yet.</p>
          ) : (
            <ul>
              {allNotes.map((item, index) => (
                <li
                  key={index}
                  className="note-item"
                  onClick={() => navigateToNote(item.url)}
                >
                  <div className="note-item-content">
                    <div className="note-item-url">
                      {getDisplayUrl(item.url)}
                    </div>
                    <div className="note-item-preview">
                      {getNotePreview(item.content)}
                    </div>
                  </div>
                  <button
                    className="delete-button"
                    onClick={(e) => deleteNote(item.url, e)}
                    title="Delete this note"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default App;
