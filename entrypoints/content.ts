export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("WebNote content script is running.");
  },
});
