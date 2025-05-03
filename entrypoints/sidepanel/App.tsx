import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

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

    // Listen for tab updates to refresh notes when URL changes
    interface TabChangeInfo {
      url?: string;
    }

    const handleTabUpdate = async (
      tabId: number,
      changeInfo: TabChangeInfo
    ): Promise<void> => {
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
  interface StoredNotes {
    [key: string]: string;
  }

  const loadNote = async (url: string): Promise<void> => {
    try {
      const data: StoredNotes = await browser.storage.local.get(url);
      if (data[url]) {
        setNote(data[url]);
      } else {
        setNote("");
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  // Save note to storage
  const saveNote = async (content: string): Promise<void> => {
    try {
      await browser.storage.local.set({ [currentUrl]: content });
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

  return (
    <div className="note-container">
      <h1>WebNote</h1>

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
    </div>
  );
}

export default App;
