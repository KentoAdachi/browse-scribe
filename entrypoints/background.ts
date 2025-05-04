export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command, tab) => {
    console.log(`Command received: ${command}`);

    if (command === "open_side_panel" && tab?.id) {
      browser.sidePanel.open({ tabId: tab.id });
      browser.runtime.sendMessage({ type: "toggle-request", tabId: tab.id });
    }
  });
});
