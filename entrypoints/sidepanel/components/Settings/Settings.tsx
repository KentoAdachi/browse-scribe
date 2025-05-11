import { useState, useEffect } from "react";
import { useApiSettings } from "../../hooks/useApiSettings";
import "./Settings.css";
import OpenAI from "openai";

export function Settings() {
  const {
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    model,
    setModel,
    saveSettings,
    isSaving,
    saveMessage,
  } = useApiSettings();

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch models from OpenAI API when settings change
  useEffect(() => {
    const fetchModels = async () => {
      if (!apiKey) {
        setAvailableModels([]); // Clear models if no API key
        return;
      }

      try {
        setIsLoadingModels(true);
        setModelLoadError(null);

        const openai = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl,
          dangerouslyAllowBrowser: true, // Allow usage in browser environment
        });

        const response = await openai.models.list();
        const models = response.data.map((m) => m.id);
        setAvailableModels(models);
      } catch (error) {
        console.error("Error fetching models:", error);
        setModelLoadError(
          "Failed to load models. Please check your API key / base URL."
        );
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [apiKey, baseUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
  };

  return (
    <div className="settings-container">
      <h2>OpenAI API Settings</h2>
      <form onSubmit={handleSubmit}>
        {/* API KEY */}
        <div className="form-group">
          <label htmlFor="api-key">API Key:</label>
          <div className="api-key-input">
            <input
              type={showApiKey ? "text" : "password"}
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowApiKey((prev) => !prev)}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* BASE URL */}
        <div className="form-group">
          <label htmlFor="base-url">Base URL:</label>
          <input
            type="text"
            id="base-url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        {/* MODEL */}
        <div className="form-group">
          <label htmlFor="model">Model:</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoadingModels || !apiKey}
          >
            {isLoadingModels ? (
              <option value="">Loading models...</option>
            ) : availableModels.length > 0 ? (
              availableModels.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))
            ) : (
              <option value="">
                {apiKey ? "No models found" : "Enter API key to load models"}
              </option>
            )}
          </select>
          {modelLoadError && (
            <div className="error-message">{modelLoadError}</div>
          )}
        </div>

        {/* SAVE */}
        <button type="submit" className="save-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        {saveMessage && <div className="save-message">{saveMessage}</div>}
      </form>
    </div>
  );
}
