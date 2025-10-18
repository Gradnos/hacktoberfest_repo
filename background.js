chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    const selectedText = message.text || '';
    console.log("OPENING");
    const openPanel = (tabId) => {
      chrome.sidePanel.open({ tabId });
      // Store the text in local storage instead of session
      chrome.storage.local.set({ selectedText });
    };

    if (sender.tab?.id) {
      console.log("panneloppening");
      openPanel(sender.tab.id);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]){
            console.log("panneloppening");
            openPanel(tabs[0].id);
        }
      });
    }

    sendResponse({ status: 'ok' });
    return true;
  }
});
