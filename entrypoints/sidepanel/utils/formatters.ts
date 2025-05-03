/**
 * Format a URL for display by shortening it
 */
export const getDisplayUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    let displayUrl = urlObj.hostname + urlObj.pathname;
    if (displayUrl.length > 40) {
      displayUrl = displayUrl.substring(0, 37) + "...";
    }
    return displayUrl;
  } catch (e) {
    return url.length > 40 ? url.substring(0, 37) + "..." : url;
  }
};

/**
 * Get a preview of the note content
 */
export const getNotePreview = (content: string): string => {
  const maxLength = 50;
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};
