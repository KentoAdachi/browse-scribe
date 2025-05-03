export default defineBackground(() => {
  console.log("WebNote background script is running");

  // Set up side panel to open when clicking the action button
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
