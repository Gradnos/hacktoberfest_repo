let sidePanelButton;

function createSidePanelButton() {
  if (sidePanelButton) return;

  // Create the button element
  sidePanelButton = document.createElement('button');
  sidePanelButton.id = 'sidepanel-toggle-btn';
  sidePanelButton.textContent = 'Ask Predictor';
  sidePanelButton.title = 'Ask Predictor';
  sidePanelButton.style.display = 'none'; // hidden by default

  // On click -> open panel
  sidePanelButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  });

  document.documentElement.appendChild(sidePanelButton);
}

// Show the button near the selected text
function showButtonNearSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    hideButton();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Ignore off-screen or invalid selections
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    hideButton();
    return;
  }

  // Position slightly above and centered
  const top = window.scrollY + rect.top - 45;
  const left = window.scrollX + rect.left + rect.width / 2;

  sidePanelButton.style.top = `${top}px`;
  sidePanelButton.style.left = `${left - sidePanelButton.offsetWidth / 2}px`;
  sidePanelButton.style.display = 'block';
}

function hideButton() {
  if (sidePanelButton) {
    sidePanelButton.style.display = 'none';
  }
}

// Detect when user finishes selecting text
document.addEventListener('mouseup', () => {
  setTimeout(showButtonNearSelection, 100);
});
document.addEventListener('keyup', () => {
  setTimeout(showButtonNearSelection, 100);
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidePanelButton);
} else {
  createSidePanelButton();
}
