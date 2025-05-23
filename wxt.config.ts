import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    startUrls: ["https://www.youtube.com/shorts/O7nNwkPwu1E/"],
  },
  manifest: {
    name: "BrowseScribe",
    description: "Save markdown notes per URL in your browser's side panel",
    action: {},
    permissions: ["storage", "tabs", "sidePanel"],
    side_panel: {
      default_path: "sidepanel/index.html",
    },
    commands: {
      open_side_panel: {
        suggested_key: { default: "Alt+M" },
        description: "Open side panel",
      },
    },
  },
});
