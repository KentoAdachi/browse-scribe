import { useState, useEffect } from "react";

export interface NoteItem {
  url: string;
  title: string; // Page title
  content: string;
  lastUpdated?: number; // Timestamp of the last update
}

// Structure stored in browser.storage.local
interface StoredNote {
  title: string; // Page title
  content: string;
  lastUpdated: number;
}

export function useNotes() {
  const [note, setNote] = useState("");
  const [title, setTitle] = useState(""); // Add state for title
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);
  const [allNotes, setAllNotes] = useState<NoteItem[]>([]);

  // Set up message listener for toggle-request
  useEffect(() => {
    const messageListener = (msg: any) => {
      if (msg.type === "toggle-request") {
        window.close();
      }
    };

    browser.runtime.onMessage.addListener(messageListener);

    // Clean up listener when component unmounts
    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Load note from storage based on URL
  const loadNote = async (url: string): Promise<void> => {
    try {
      const data = await browser.storage.local.get(url);
      if (data[url]) {
        const storedNote = data[url] as StoredNote | string;

        // Handle both old format (string only) and new format (object with content & lastUpdated)
        if (typeof storedNote === "string") {
          setNote(storedNote);
          setTitle(""); // No title in old format
          setLastUpdated(undefined);
        } else {
          setNote(storedNote.content);
          setTitle(storedNote.title || ""); // Get title from storage
          setLastUpdated(storedNote.lastUpdated);
        }
      } else {
        setNote("");
        setTitle("");
        setLastUpdated(undefined);
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
      Object.entries(data).forEach(([url, stored]) => {
        if (typeof stored === "string" && stored.trim()) {
          // Old format: just string content
          notes.push({
            url,
            title: "", // No title in old format
            content: stored,
            lastUpdated: undefined,
          });
        } else if (
          stored &&
          typeof stored === "object" &&
          "content" in stored
        ) {
          // New format: object with content & lastUpdated
          const storedNote = stored as StoredNote;
          if (storedNote.content.trim()) {
            notes.push({
              url,
              title: storedNote.title || "", // Get title from storage
              content: storedNote.content,
              lastUpdated: storedNote.lastUpdated,
            });
          }
        }
      });

      setAllNotes(notes);
    } catch (error) {
      console.error("Error loading all notes:", error);
    }
  };

  // Save note to storage
  const saveNote = async (
    url: string,
    content: string,
    pageTitle: string
  ): Promise<void> => {
    try {
      // 空白のノートは保持しない - Don't keep empty notes
      if (!content.trim()) {
        // If the content is empty, delete the note instead of saving it
        await deleteNote(url);
        return;
      }

      const currentTime = Date.now();
      const noteData: StoredNote = {
        title: pageTitle,
        content: content,
        lastUpdated: currentTime,
      };

      await browser.storage.local.set({ [url]: noteData });
      setNote(content);
      setTitle(pageTitle);
      setLastUpdated(currentTime);

      // Refresh the notes list
      loadAllNotes();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Delete a note
  const deleteNote = async (url: string): Promise<void> => {
    try {
      await browser.storage.local.remove(url);
      loadAllNotes(); // Refresh the list

      // If this was the current note, reset the state
      if (note !== "") {
        setNote("");
        setTitle(""); // Reset title
        setLastUpdated(undefined);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return {
    note,
    title, // Expose title state
    lastUpdated,
    setNote,
    allNotes,
    loadNote,
    loadAllNotes,
    saveNote,
    deleteNote,
  };
}
