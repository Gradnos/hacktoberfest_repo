const input = document.getElementById("input");
const output = document.getElementById("output");
const askBtn = document.getElementById("ask");

// Load selected text from storage
chrome.storage.local.get("selectedText", ({ selectedText }) => {
    if (selectedText) input.value = selectedText;
});

askBtn.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) return;

    output.textContent = "⏳ Waiting for ChatGPT...";

    try {
        // Replace YOUR_API_KEY with your real OpenAI key
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_API_KEY"
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: text }]
            })
        });
        const data = await res.json();
        output.textContent = data.choices?.[0]?.message?.content || "No response";
    } catch (err) {
        output.textContent = "❌ Error: " + err.message;
    }
});
