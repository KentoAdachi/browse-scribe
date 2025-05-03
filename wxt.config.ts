import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "WebNote",
    description: "Save markdown notes per URL in your browser's side panel",
    action: {},
    permissions: ["storage", "tabs", "sidePanel"],
    side_panel: {
      default_path: "sidepanel/index.html",
    },
  },
});
