let sidePanelButton;

function createSidePanelButton() {
  if (sidePanelButton) return;

  sidePanelButton = document.createElement('button');
  sidePanelButton.id = 'sidepanel-toggle-btn';
  sidePanelButton.title = 'Ask Tsuri';
  sidePanelButton.style.display = 'none'; // hidden by default
  
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
  sidePanelButton.addEventListener('click', () => {
    // Slight delay ensures the selection is finalized
    setTimeout(() => {
      const selectedText = window.getSelection()?.toString().trim() || '';
      console.log('🟢 Button clicked, sending selected text:', selectedText);

      // Send message to background (no need to wait for response)
      chrome.runtime.sendMessage({
        action: 'openSidePanel',
        text: selectedText
      });
    }, 50);
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
  sidePanelButton.style.display = 'block';
}

function hideButton() {
  if (sidePanelButton) {
    sidePanelButton.style.display = 'none';
  }
}

// Event listeners
document.addEventListener('mouseup', () => setTimeout(showButtonNearSelection, 50));
document.addEventListener('keyup', () => setTimeout(showButtonNearSelection, 50));

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createSidePanelButton);
} else {
  createSidePanelButton();
}
