import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "BrowseScribe",
    description: "Save markdown notes per URL in your browser's side panel",
    action: {},
    permissions: ["storage", "tabs", "sidePanel"],
    host_permissions: ["https://notegpt.io/*"],
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
