import { useState, useEffect } from "react";

export function useTabs(onUrlChange: (url: string) => void) {
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    const getCurrentTab = async () => {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
        onUrlChange(tabs[0].url);
      }
    };

    getCurrentTab();

    // Listen for tab updates to refresh notes when URL changes
    const handleTabUpdate = async (
      tabId: number,
      changeInfo: { url?: string }
    ) => {
      if (changeInfo.url) {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tabs[0]?.id === tabId) {
          setCurrentUrl(changeInfo.url);
          onUrlChange(changeInfo.url);
        }
      }
    };

    browser.tabs.onUpdated.addListener(handleTabUpdate);
    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, [onUrlChange]);

  // Navigate to a URL
  const navigateToUrl = async (url: string) => {
    try {
      // Update the current tab to the URL of this note
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        await browser.tabs.update(tabs[0].id, { url });
        setCurrentUrl(url);
        onUrlChange(url);
      }
    } catch (error) {
      console.error("Error navigating to URL:", error);
    }
  };

  return {
    currentUrl,
    navigateToUrl,
  };
}
