let sidePanelButton;

function createSidePanelButton() {
  if (sidePanelButton) return;

  sidePanelButton = document.createElement('button');
  sidePanelButton.id = 'sidepanel-toggle-btn';
  sidePanelButton.title = 'Ask Tsuri';
  sidePanelButton.hidden = true; // hidden by default
  
  // Create logo and text
  const logo = document.createElement('img');
  logo.src = chrome.runtime.getURL('tsuri-icon.png');
  logo.alt = 'Tsuri';
  logo.className = 'tsuri-logo';
  
  const text = document.createElement('span');
  text.textContent = 'Ask Tsuri';
  
  sidePanelButton.appendChild(logo);
  sidePanelButton.appendChild(text);

  // On click -> send selection to background
  sidePanelButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const selectedText = window.getSelection()?.toString().trim() || '';
    console.log('🟢 Button clicked, sending selected text:', selectedText);

    // Send message to background
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      text: selectedText
    });

    // Hide button after clicking
    hideButton();
  });

  document.documentElement.appendChild(sidePanelButton);
}

// Show button near selected text
function showButtonNearSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    hideButton();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    hideButton();
    return;
  }

  const top = window.scrollY + rect.top - 45;
  const left = window.scrollX + rect.left + rect.width / 2;

  sidePanelButton.style.top = `${top}px`;
  sidePanelButton.style.left = `${left - sidePanelButton.offsetWidth / 2}px`;
  sidePanelButton.hidden = false;
}

function hideButton() {
  if (sidePanelButton) {
    sidePanelButton.hidden = true;
  }
}

// Event listeners
document.addEventListener('mouseup', (e) => {
  // Hide button if clicking outside of it
  if (sidePanelButton && e.target !== sidePanelButton && !sidePanelButton.contains(e.target)) {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        hideButton();
      } else {
        showButtonNearSelection();
      }
    }, 50);
  }
});

document.addEventListener('keyup', () => setTimeout(showButtonNearSelection, 50));

// Hide button when clicking anywhere that causes deselection
document.addEventListener('mousedown', (e) => {
  if (sidePanelButton && e.target !== sidePanelButton && !sidePanelButton.contains(e.target)) {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        hideButton();
      }
    }, 10);
  }
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidePanelButton);
} else {
  createSidePanelButton();
}
