import { useState, useEffect } from "react";
/**
 * Track the current active tab’s URL & title and expose helpers.
 * The hook now responds both to URL updates inside the active tab
 * (browser.tabs.onUpdated) and to the user switching between tabs
 * (browser.tabs.onActivated).
 *
 * This fixes the bug where the UI kept showing the previous tab’s
 * information after the user moved to another tab.
 */
export function useTabs(onUrlChange: (url: string, title: string) => void) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  useEffect(() => {
    // --- initial fetch of active tab ---
    const getCurrentTab = async () => {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        setCurrentTitle(tabs[0].title || "");
        onUrlChange(tabs[0].url, tabs[0].title || "");
      }
    };

    getCurrentTab();

    // --- when the active tab changes its URL/title (same tab) ---
    const handleTabUpdate = async (
      tabId: number,
      changeInfo: { url?: string; title?: string }
    ) => {
      if (changeInfo.url || changeInfo.title) {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id === tabId) {
          const newUrl = changeInfo.url || currentUrl;
          const newTitle = tabs[0].title || "";

          setCurrentUrl(newUrl);
          setCurrentTitle(newTitle);
          onUrlChange(newUrl, newTitle);
        }
      }
    };

    // --- when the user switches to a different tab ---
    const handleTabActivated = async (activeInfo: any) => {
      try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        if (tab.url) {
          setCurrentUrl(tab.url);
          setCurrentTitle(tab.title || "");
          onUrlChange(tab.url, tab.title || "");
        }
      } catch (error) {
        console.error("Error getting activated tab:", error);
      }
    };

    // register listeners
    browser.tabs.onUpdated.addListener(handleTabUpdate);
    browser.tabs.onActivated.addListener(handleTabActivated);

    // cleanup
    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
      browser.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, [onUrlChange, currentUrl]);

  // Navigate the current browser tab to a specific URL
  const navigateToUrl = async (url: string) => {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        await browser.tabs.update(tabs[0].id, { url });
        setCurrentUrl(url);
        // title will be updated by onUpdated/onActivated listeners
      }
    } catch (error) {
      console.error("Error navigating to URL:", error);
    }
  };

  return {
    currentUrl,
    currentTitle,
    navigateToUrl,
  };
}
