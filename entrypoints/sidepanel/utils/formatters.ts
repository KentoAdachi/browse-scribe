/**
 * Format a URL for display by shortening it
 */
export const getDisplayUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    let displayUrl = urlObj.hostname + urlObj.pathname;
    if (urlObj.search) {
      displayUrl += "?" + urlObj.search.substring(1);
    }
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

/**
 * Format a timestamp into a readable date string
 */
export const formatDate = (timestamp?: number): string => {
  if (!timestamp) return "No update record";

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Format seconds to MM:SS or HH:MM:SS format for video timestamps
 * @param seconds - The timestamp in seconds
 * @returns Formatted timestamp string
 */
export const formatSecondsToTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
