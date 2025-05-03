import { useState } from "react";

export interface NoteItem {
  url: string;
  content: string;
}

export function useNotes() {
  const [note, setNote] = useState("");
  const [allNotes, setAllNotes] = useState<NoteItem[]>([]);

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
  const saveNote = async (url: string, content: string): Promise<void> => {
    try {
      await browser.storage.local.set({ [url]: content });
      setNote(content);
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
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return {
    note,
    setNote,
    allNotes,
    loadNote,
    loadAllNotes,
    saveNote,
    deleteNote,
  };
}
