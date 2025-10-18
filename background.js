chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    const selectedText = message.text || '';

    const openPanel = (tabId) => {
      chrome.sidePanel.open({ tabId });
      // Store the text in local storage instead of session
      chrome.storage.local.set({ selectedText });
    };

    if (sender.tab?.id) {
      openPanel(sender.tab.id);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) openPanel(tabs[0].id);
      });
    }

    sendResponse({ status: 'ok' });
    return true;
  }
});
