// fetcher.js
export const log = console.log;
export let markets = [];
export const BASE_URL = "https://gamma-api.polymarket.com";

export async function main(str, progressCallback) {
  markets = []; // reset for each run

  if (!str || !str.trim()) {
    progressCallback?.("(no text selected)");
    return [];
  }

  // Step 1: Generating keywords
  progressCallback?.("Generating keywords...");
  const keyWords = await getkeywords(str); // await now
  progressCallback?.(`Keywords: ${keyWords.join(", ")}`);
  console.log("keyWords: --------", keyWords);
  // Step 2: Fetching markets
  progressCallback?.("Fetching markets...");
  await fetchMarkets(keyWords, progressCallback);
  console.log(markets, str);
  // Step 3: Evaluating markets
  progressCallback?.("Evaluating markets...");
  const validMarkets = [];

  const uniqueMarkets = Object.values(
    markets.reduce((acc, market) => {
      const key = market.ticker || market.id;
      if (!acc[key]) acc[key] = market;
      return acc;
    }, {})
  );
  const scores = await isvalidBulk(uniqueMarkets, str);

  uniqueMarkets.forEach((market, i) => {
    if (scores[i] >= 60) {
      // threshold for "valid"
      validMarkets.push({ ...market, score: scores[i] });
    }
  });

  validMarkets.sort((a, b) => b.score - a.score);
  markets = validMarkets;

  console.log("valid markets:", markets);
  return markets;
}

export function ShowMarkets(markets, container) {
  container.textContent = "";
  if (!markets.length) {
    container.textContent = "No valid markets found.";
    return;
  }

  markets.forEach((market) => {
    const div = document.createElement("div");
    div.textContent = `Ticker: ${market.ticker} | Name: ${market.name}`;
    div.style.marginBottom = "6px";
    container.appendChild(div);
    log(`Ticker: ${market.ticker}`, market);
  });
}

export async function fetchMarkets(keyWords, progressCallback, limit = 10) {
  for (const keyWord of keyWords) {
    const url = `${BASE_URL}/public-search?q=${keyWord}&events_status=active&limit=${limit}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data?.events?.length) {
        markets.push(...data.events);
      }
      progressCallback?.(
        `Fetched ${data?.events?.length || 0} markets for "${keyWord}"`
      );
    } catch (error) {
      console.error(error);
      progressCallback?.(`Error fetching "${keyWord}": ${error.message}`);
    }
  }
}

// Simulate async keyword generation
// Uses Gemini 2.5 Flash Lite to generate search keywords/phrases from input text
export async function getkeywords(text) {
  const API_KEY = "AIzaSyBPZ2Mcv-a3GZkEPsKUv1OXjOMhg8uD-YU"; // 🔒 Replace with your Gemini API key
  const MODEL = "gemini-2.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const prompt = `
You are an expert in prediction markets and event discovery.
Your goal is to generate high-quality search keywords for finding relevant markets on Polymarket based on a given text snippet.

---

### INPUT:
A text snippet (which may be in any language). It can describe news, events, opinions, political situations, sports, cryptocurrencies, tech, etc.

### TASK:
1. **Understand the meaning of the text.**
   - Identify all key topics, entities, people, organizations, places, currencies, technologies, or events mentioned or implied.
   - Translate the text to English if it’s in another language.

2. **Generate relevant Polymarket search keywords.**
   - Focus on topics that are likely to have prediction markets or could plausibly have them (e.g., elections, price movements, policy outcomes, sports results, crypto events, geopolitical risks, major company announcements).
   - Include synonyms and event formulations:  
     e.g. “Ethereum ETF approval”, “US presidential election”, “Bitcoin price above 100k”, “Biden approval rating”.
   - Prefer concise, market-style keyword phrases (2–6 words each).

3. **Be smart with context and reasoning.**
   - If the snippet mentions two politicians → include their countries, possible elections, and related geopolitical events.  
   - If it’s about a company → include keywords about its stock, regulation, and industry trends.  
   - If it’s about crypto → include keywords like “price”, “ETF approval”, “adoption”, “network upgrade”.  
   - If the snippet is general → infer related global or economic prediction themes.

4. **Output format:**
   Return a JSON array of 5–15 short keyword phrases (strings) that would be good Polymarket search queries.
    MAX 10 
---

### EXAMPLE:

**Input:**
“Recent reports suggest tension between the US and China over semiconductor exports.”

**Output:**
[
  "US-China relations",
  "semiconductor export restrictions",
  "Taiwan conflict",
  "chip industry outlook",
  "China economic slowdown",
  "US tech policy"
]

---

Now, analyze the following snippet and ONLY return your keyword list MAKE SURE YOU ONLY RETURN THE LIST:
${text}
`;

    const response = await fetch(`${endpoint}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      console.error(
        "Gemini API HTTP Error:",
        response.status,
        await response.text()
      );
      return [];
    }

    const data = await response.json();
    const modelOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON array from model output
    let keywords = [];
    try {
      keywords = JSON.parse(modelOutput.replace(/\n/g, ""));
    } catch {
      // fallback: split by commas if JSON fails
      keywords = modelOutput
        .split(/,|\n/)
        .map((k) => k.trim())
        .filter(Boolean);
    }

    //console.log("Generated keywords:", keywords);
    return keywords;
  } catch (error) {
    console.error("Error calling Gemini API for keywords:", error);
    return [];
  }
}

// Simulate async market validation
// sheafaset 1-100
// Uses Gemini 2.5 Flash Lite to rate how related a market is to given text (1–100)
// Uses Gemini 2.5 Flash Lite to rate how related a market is to given text (1–100)
// Uses Gemini 2.5 Flash Lite to rate a list of markets against the text (returns array of scores)
export async function isvalidBulk(marketsList, text) {
  const API_KEY = "AIzaSyBPZ2Mcv-a3GZkEPsKUv1OXjOMhg8uD-YU"; // 🔒 Replace with your Gemini API key
  const MODEL = "gemini-2.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    // Only pick essential fields to reduce token usage
    const minimalMarkets = marketsList.map((market) => ({
      title: market.title,
      subtitle: market.subtitle,
      description: market.description,
      category: market.category,
      subcategory: market.subcategory,
      ticker: market.ticker,
    }));

    // Build prompt for all markets
    const prompt = `
Rate from 1 to 100 how related each of the following prediction markets is to the given text.
Respond ONLY with a JSON array of numbers in the same order as the markets, like: [90, 15, 78] array should be the same size as given number of markets.

Text:
${text}

Markets:
${JSON.stringify(minimalMarkets, null, 2)}
`;

    const response = await fetch(`${endpoint}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      console.error(
        "Gemini API HTTP Error:",
        response.status,
        await response.text()
      );
      return Array(marketsList.length).fill(0);
    }

    const data = await response.json();
    const modelOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON array from model output
    let scores = [];
    try {
      scores = JSON.parse(modelOutput.replace(/\n/g, ""));
    } catch {
      // fallback: extract all numbers in order
      scores = modelOutput.match(/\d+/g)?.map((n) => parseInt(n, 10)) || [];
    }
    console.log("scores:  ", scores);
    // Make sure scores array length matches markets list
    if (scores.length !== marketsList.length) {
      // Only add zeros to the end
      while (scores.length < marketsList.length) {
        scores.push(0);
      }
    }

    console.log("scores: ", scores);
    return scores;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return Array(marketsList.length).fill(0);
  }
}
