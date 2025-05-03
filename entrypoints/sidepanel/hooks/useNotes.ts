import { useState } from "react";

export interface NoteItem {
  url: string;
  content: string;
  lastUpdated?: number; // Timestamp of the last update
}

// Structure stored in browser.storage.local
interface StoredNote {
  content: string;
  lastUpdated: number;
}

export function useNotes() {
  const [note, setNote] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);
  const [allNotes, setAllNotes] = useState<NoteItem[]>([]);

  // Load note from storage based on URL
  const loadNote = async (url: string): Promise<void> => {
    try {
      const data = await browser.storage.local.get(url);
      if (data[url]) {
        const storedNote = data[url] as StoredNote | string;

        // Handle both old format (string only) and new format (object with content & lastUpdated)
        if (typeof storedNote === "string") {
          setNote(storedNote);
          setLastUpdated(undefined);
        } else {
          setNote(storedNote.content);
          setLastUpdated(storedNote.lastUpdated);
        }
      } else {
        setNote("");
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
  const saveNote = async (url: string, content: string): Promise<void> => {
    try {
      // 空白のノートは保持しない - Don't keep empty notes
      if (!content.trim()) {
        // If the content is empty, delete the note instead of saving it
        await deleteNote(url);
        return;
      }

      const currentTime = Date.now();
      const noteData: StoredNote = {
        content: content,
        lastUpdated: currentTime,
      };

      await browser.storage.local.set({ [url]: noteData });
      setNote(content);
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
        setLastUpdated(undefined);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return {
    note,
    lastUpdated,
    setNote,
    allNotes,
    loadNote,
    loadAllNotes,
    saveNote,
    deleteNote,
  };
}
