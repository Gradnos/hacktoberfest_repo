console.log("🟢 background.js loaded");

chrome.runtime.onMessage.addListener(async (message, sender) => {
    console.log("📨 Message received in background:", message);

    if (message.type === "ask-predictor" && message.text) {
        await chrome.storage.local.set({ selectedText: message.text });
        console.log("💾 Text saved:", message.text);

        // Open popup window (no window object needed)
        const width = 360;
        const height = 600;
        const left = 1600; // Adjust if needed
        const top = 50;

        chrome.windows.create({
            url: chrome.runtime.getURL("sidebar.html"),
            type: "popup",
            width: width,
            height: height,
            left: left,
            top: top
        }, (win) => {
            console.log("✅ Popup window opened", win.id);
        });
    }
});
