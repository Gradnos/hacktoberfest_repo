document.addEventListener("mouseup", (event) => { // Add event parameter
    const selection = window.getSelection().toString().trim();
    
    // Check if the click was on the button or its children
    if (event.target.closest('#ask-button')) {
        return; // Don't remove the button if clicking on it
    }
    
    removeButton();

    if (selection.length > 0) {
        const button = document.createElement("button");
        button.textContent = "Ask Predictor";
        button.id = "ask-button";
        Object.assign(button.style, {
            position: "absolute",
            top: `${event.pageY + 5}px`,
            left: `${event.pageX + 5}px`,
            zIndex: 10000,
            backgroundColor: "#0a84ff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            padding: "5px 10px",
            cursor: "pointer"
        });
        document.body.appendChild(button);

        button.addEventListener("click", () => {
            console.log("🟢 Button clicked, sending message to background");
            chrome.runtime.sendMessage({ type: "ask-predictor", text: selection }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("⚠️ Send failed:", chrome.runtime.lastError.message);
                } else {
                    console.log("✅ Message sent successfully", response);
                }
            });
            removeButton();
        });
    }
});

function removeButton() {
    const oldBtn = document.getElementById("ask-button");
    if (oldBtn) oldBtn.remove();
}