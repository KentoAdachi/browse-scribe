export default defineBackground(() => {
  console.log("WebNote background script is running");

  // browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.commands.onCommand.addListener(async (command, tab) => {
    console.log(`Command received: ${command}`);

    if (command === "open_side_panel" && tab?.id) {
      browser.sidePanel.open({ tabId: tab.id });
      browser.runtime.sendMessage({ type: "toggle-request", tabId: tab.id });
    }
  });
});
