// Background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    // Use sender.tab.id to get the current tab ID
    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    } else {
      // Fallback: get the active tab in current window
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
    }
  }
});

// Enable side panel for all sites by default
chrome.sidePanel.setOptions({
  enabled: true
});

// Set panel behavior - this ensures the panel works on all sites
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(error => console.log('Error setting panel behavior:', error));