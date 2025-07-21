export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    let isReady = false;

    // Check if DOM is ready
    const checkDOMReady = () => {
      return (
        document.readyState === "complete" ||
        (document.readyState === "interactive" && document.body)
      );
    };

    // Wait for DOM to be ready
    const waitForDOM = () => {
      return new Promise<void>((resolve) => {
        if (checkDOMReady()) {
          isReady = true;
          resolve();
        } else {
          const observer = new MutationObserver(() => {
            if (checkDOMReady()) {
              isReady = true;
              observer.disconnect();
              resolve();
            }
          });

          observer.observe(document, {
            childList: true,
            subtree: true,
          });

          // Fallback timeout
          setTimeout(() => {
            isReady = true;
            observer.disconnect();
            resolve();
          }, 5000);
        }
      });
    };

    // Initialize DOM readiness check
    waitForDOM();

    // Listen for messages from the sidepanel
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "getPageContent") {
        const handleRequest = async () => {
          try {
            // Wait for DOM if not ready
            if (!isReady) {
              await waitForDOM();
            }

            // Additional wait for dynamic content
            await new Promise((resolve) => setTimeout(resolve, 500));

            const content = extractPageContent();
            sendResponse({ content });
          } catch (error) {
            console.error("Error extracting page content:", error);
            sendResponse({ error: "Failed to extract page content" });
          }
        };

        handleRequest();
        return true; // Keep the message channel open for async response
      }
    });

    // Reset readiness on page navigation
    window.addEventListener("beforeunload", () => {
      isReady = false;
    });
  },
});

function extractPageContent(): string {
  // Check if body exists
  if (!document.body) {
    throw new Error("Document body not available");
  }

  // Create a clone of the body to avoid modifying the original page
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Remove unwanted elements from the clone
  const unwantedSelectors = [
    "script",
    "style",
    "noscript",
    "iframe",
    "nav",
    "header",
    "footer",
    "aside",
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    "[role='complementary']",
    ".advertisement",
    ".ads",
    ".ad",
    ".sidebar",
    ".menu",
    ".navigation",
    ".nav",
    ".breadcrumb",
    ".social",
    ".share",
    ".comments",
    ".comment",
    ".popup",
    ".modal",
    ".overlay",
    ".cookie",
    ".gdpr",
    "[class*='ad-']",
    "[class*='ads-']",
    "[id*='ad-']",
    "[id*='ads-']",
  ];

  unwantedSelectors.forEach((selector) => {
    const elements = bodyClone.querySelectorAll(selector);
    elements.forEach((element) => element.remove());
  });

  // Try to find main content areas
  const contentSelectors = [
    "main",
    "[role='main']",
    ".main-content",
    ".content",
    ".post-content",
    ".entry-content",
    ".article-content",
    "article",
    ".article",
  ];

  let mainContent: HTMLElement | null = null;
  for (const selector of contentSelectors) {
    const element = bodyClone.querySelector(selector) as HTMLElement;
    if (element && element.innerText && element.innerText.length > 200) {
      mainContent = element;
      break;
    }
  }

  // Use main content if found, otherwise use the whole body
  const sourceElement = mainContent || bodyClone;

  // Extract text content
  let textContent = sourceElement.innerText || sourceElement.textContent || "";

  // Clean up the text
  textContent = textContent
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, "\n") // Remove empty lines
    .replace(/^\s+|\s+$/gm, "") // Trim each line
    .trim();

  // Remove common noise patterns
  textContent = textContent
    .replace(/^(Skip to|Jump to|Go to).*/gim, "") // Skip navigation links
    .replace(/^(Cookie|Privacy|Terms).*/gim, "") // Legal notices
    .replace(/\b(Advertisement|Sponsored|Ad)\b.*/gim, "") // Ad labels
    .trim();

  // Check if we have meaningful content
  if (textContent.length < 50) {
    throw new Error("Insufficient content found on page");
  }

  // Limit content length to avoid API limits
  const maxLength = 8000; // Reasonable limit for summarization
  if (textContent.length > maxLength) {
    // Try to cut at sentence boundary
    const cutPoint = textContent.lastIndexOf(".", maxLength - 100);
    if (cutPoint > maxLength / 2) {
      textContent = textContent.substring(0, cutPoint + 1);
    } else {
      textContent = textContent.substring(0, maxLength) + "...";
    }
  }

  return textContent;
}
