import { useState, useEffect } from "react";

export function useTabs(onUrlChange: (url: string, title: string) => void) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  useEffect(() => {
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

    // Listen for tab updates to refresh notes when URL changes
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

    browser.tabs.onUpdated.addListener(handleTabUpdate);
    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, [onUrlChange, currentUrl]);

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
        // After navigation, we need to wait for the page to load to get the title
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
