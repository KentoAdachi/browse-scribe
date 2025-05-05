import { useState } from "react";
import { useApiSettings } from "../../hooks/useApiSettings";
import "./Settings.css";

const AVAILABLE_MODELS = [
  "gpt-4.1-nano",
  "gpt-4.0",
  "gpt-3.5-turbo",
  "gpt-4.1-turbo",
];

export function Settings() {
  const {
    apiKey,
    setApiKey,
    model,
    setModel,
    saveSettings,
    isSaving,
    saveMessage,
  } = useApiSettings();

  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
  };

  return (
    <div className="settings-container">
      <h2>OpenAI API Settings</h2>
      <form onSubmit={handleSubmit}>
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
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="model">Model:</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {AVAILABLE_MODELS.map((modelOption) => (
              <option key={modelOption} value={modelOption}>
                {modelOption}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="save-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </button>

        {saveMessage && <div className="save-message">{saveMessage}</div>}
      </form>
    </div>
  );
}
