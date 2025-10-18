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

  // Step 2: Fetching markets
  progressCallback?.("Fetching markets...");
  await fetchMarkets(keyWords, progressCallback);

  // Step 3: Evaluating markets
  progressCallback?.("Evaluating markets...");
  const validMarkets = [];
  for (const market of [...new Set(markets)]) {
    if (await isvalid(market)) { // await here
      validMarkets.push(market);
    }
  }
  markets = validMarkets;

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
      progressCallback?.(`Fetched ${data?.events?.length || 0} markets for "${keyWord}"`);
    } catch (error) {
      console.error(error);
      progressCallback?.(`Error fetching "${keyWord}": ${error.message}`);
    }
  }
}

// Simulate async keyword generation
export function getkeywords(str) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(str.split(" "));
    }, 3000);
  });
}

// Simulate async market validation
export function isvalid(market) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true); // or any logic you want
    }, 10);
  });
}
