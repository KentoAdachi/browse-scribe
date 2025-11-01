import { useState, useEffect } from "react";
import { useApiSettings } from "../../hooks/useApiSettings";
import "./Settings.css";
import { createAIService, AIProvider } from "../../services/aiService";

export function Settings() {
  const {
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    model,
    setModel,
    provider,
    setProvider,
    saveSettings,
    isSaving,
    saveMessage,
  } = useApiSettings();

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch models from AI provider when settings change
  useEffect(() => {
    const fetchModels = async () => {
      if (!apiKey) {
        setAvailableModels([]); // Clear models if no API key
        return;
      }

      try {
        setIsLoadingModels(true);
        setModelLoadError(null);

        const aiService = createAIService(provider, apiKey, baseUrl);
        
        if (aiService.listModels) {
          const models = await aiService.listModels();
          setAvailableModels(models);
        } else {
          setAvailableModels([]);
        }
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
  }, [apiKey, baseUrl, provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
  };

  return (
    <div className="settings-container">
      <h2>AI API Settings</h2>
      <form onSubmit={handleSubmit}>
        {/* PROVIDER */}
        <div className="form-group">
          <label htmlFor="provider">Provider:</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProvider)}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>

        {/* API KEY */}
        <div className="form-group">
          <label htmlFor="api-key">API Key:</label>
          <div className="api-key-input">
            <input
              type={showApiKey ? "text" : "password"}
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === "gemini"
                  ? "Enter your Google AI API key"
                  : "Enter your OpenAI API key"
              }
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

        {/* BASE URL - Only show for OpenAI */}
        {provider === "openai" && (
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
        )}

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
