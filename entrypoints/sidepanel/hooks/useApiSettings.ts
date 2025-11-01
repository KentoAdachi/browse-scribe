import { useState, useEffect } from "react";
import { AIProvider } from "../services/aiService";

interface ApiSettings {
  apiKey: string;
  model: string;
  baseUrl: string;
  provider: AIProvider;
}

const DEFAULT_OPENAI_MODEL = "gpt-4.1-nano";
const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_PROVIDER: AIProvider = "openai";
const STORAGE_KEY = "openai_api_settings";

const getDefaultModel = (provider: AIProvider): string => {
  return provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL;
};

export function useApiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(getDefaultModel(DEFAULT_PROVIDER));
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [provider, setProvider] = useState<AIProvider>(DEFAULT_PROVIDER);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Load settings from storage on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update model to provider default when provider changes
  useEffect(() => {
    // Only auto-update model if the current model doesn't look like it belongs to the current provider
    // This prevents overwriting user's model selection on every provider change
    // Model prefixes as of November 2025
    const OPENAI_PREFIXES = ["gpt", "o1", "text-", "davinci"];
    const GEMINI_PREFIXES = ["gemini"];
    
    const isOpenAIModel = OPENAI_PREFIXES.some((prefix) => model.startsWith(prefix));
    const isGeminiModel = GEMINI_PREFIXES.some((prefix) => model.startsWith(prefix));
    
    if (provider === "openai" && isGeminiModel) {
      setModel(getDefaultModel("openai"));
    } else if (provider === "gemini" && isOpenAIModel) {
      setModel(getDefaultModel("gemini"));
    }
  }, [provider, model]);

  // Load API settings from storage
  const loadSettings = async (): Promise<void> => {
    try {
      const data = await browser.storage.local.get(STORAGE_KEY);
      if (data[STORAGE_KEY]) {
        const storedSettings = data[STORAGE_KEY] as ApiSettings;
        const loadedProvider = storedSettings.provider || DEFAULT_PROVIDER;
        setApiKey(storedSettings.apiKey || "");
        setModel(storedSettings.model || getDefaultModel(loadedProvider));
        setBaseUrl(storedSettings.baseUrl || DEFAULT_BASE_URL);
        setProvider(loadedProvider);
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
        baseUrl,
        provider,
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
    baseUrl,
    setBaseUrl,
    model,
    setModel,
    provider,
    setProvider,
    saveSettings,
    loadSettings,
    isSaving,
    saveMessage,
  };
}
