// sidepanel.js
import { main, ShowMarkets } from './fetcher.js';

const marketsContainer = document.getElementById("selected-text");
const noSel = document.getElementById("no-selection");

// Helper to update sidebar text
function updateProgress(text) {
  noSel.style.display = "none";
  marketsContainer.textContent = text;
}

// Run main for the last selected text
async function runForSelection(text) {
  if (!text) {
    marketsContainer.textContent = "(no text selected)";
    return;
  }

  const markets = await main(text, updateProgress);
  ShowMarkets(markets, marketsContainer);
}

// Initial load
chrome.storage.local.get("selectedText").then((data) => {
  runForSelection(data.selectedText || "");
});

// Update if selection changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.selectedText) {
    runForSelection(changes.selectedText.newValue || "");
  }
});
