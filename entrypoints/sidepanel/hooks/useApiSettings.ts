import { useState, useEffect } from "react";

interface ApiSettings {
  apiKey: string;
  model: string;
}

const DEFAULT_MODEL = "gpt-4.1-nano";
const STORAGE_KEY = "openai_api_settings";

export function useApiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Load settings from storage on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load API settings from storage
  const loadSettings = async (): Promise<void> => {
    try {
      const data = await browser.storage.local.get(STORAGE_KEY);
      if (data[STORAGE_KEY]) {
        const storedSettings = data[STORAGE_KEY] as ApiSettings;
        setApiKey(storedSettings.apiKey || "");
        setModel(storedSettings.model || DEFAULT_MODEL);
      }
    } catch (error) {
      console.error("Error loading API settings:", error);
    }
  };

  // Save API settings to storage
  const saveSettings = async (): Promise<void> => {
    try {
      setIsSaving(true);

      const settingsData: ApiSettings = {
        apiKey,
        model,
      };

      await browser.storage.local.set({ [STORAGE_KEY]: settingsData });

      setSaveMessage("Settings saved successfully!");

      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving API settings:", error);
      setSaveMessage("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    apiKey,
    setApiKey,
    model,
    setModel,
    saveSettings,
    loadSettings,
    isSaving,
    saveMessage,
  };
}
