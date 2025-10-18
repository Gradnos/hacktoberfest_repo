// Create and inject the button into the page
function createSidePanelButton() {
  if (document.getElementById('sidepanel-toggle-btn')) return;

  const button = document.createElement('button');
  button.id = 'sidepanel-toggle-btn';
  button.innerHTML = '☰ Open Panel';
  button.title = 'Open Hello World Side Panel';

  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  });

  // --- FIX: append to <html> instead of <body> ---
  document.documentElement.appendChild(button);

  // Also force to top layer visually
  button.style.position = 'fixed';
  button.style.zIndex = '2147483647';
}


// Create the button when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidePanelButton);
} else {
  createSidePanelButton();
}

// Re-create button when navigating in SPA (Single Page Applications)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Small delay to ensure DOM is ready
    setTimeout(createSidePanelButton, 100);
  }
}).observe(document, { subtree: true, childList: true });