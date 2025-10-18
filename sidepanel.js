chrome.storage.local.get('selectedText').then((data) => {
  const textBox = document.getElementById('selected-text');
  const noSel = document.getElementById('no-selection');

  if (data.selectedText && data.selectedText.trim()) {
    noSel.style.display = 'none';
    textBox.textContent = data.selectedText;
  } else {
    noSel.style.display = 'inline';
  }
});

// Optional: listen for updates
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.selectedText) {
    const el = document.getElementById('selected-text');
    const noSel = document.getElementById('no-selection');
    if (changes.selectedText.newValue && changes.selectedText.newValue.trim()) {
      noSel.style.display = 'none';
      el.textContent = changes.selectedText.newValue;
    } else {
      el.textContent = '';
      noSel.style.display = 'inline';
    }
  }
});
