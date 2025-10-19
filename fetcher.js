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

  const uniqueMarkets = [...new Set(markets)];
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
// Enhanced ShowMarkets function with Polymarket-style UI
// Enhanced ShowMarkets function with Polymarket-style UI
// COMPLETE FILE - Replace your ShowMarkets function and add helper functions

// Enhanced ShowMarkets function with Polymarket-style UI
// COMPLETE FILE - Replace your ShowMarkets function and add helper functions

export function ShowMarkets(markets, container) {
  container.textContent = "";
  container.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: #0a0e27;
    padding: 24px;
    min-height: 100vh;
  `;

  if (!markets.length) {
    const emptyState = document.createElement("div");
    emptyState.style.cssText = `
      text-align: center;
      color: #6b7280;
      padding: 60px 20px;
      font-size: 16px;
    `;
    emptyState.textContent = "No markets found for this search.";
    container.appendChild(emptyState);
    return;
  }

  // Create header
  const header = document.createElement("div");
  header.style.cssText = `
    margin-bottom: 24px;
    color: #fff;
  `;
  header.innerHTML = `
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Related Markets</h2>
    <p style="margin: 0; color: #9ca3af; font-size: 14px;">${markets.length} market${markets.length === 1 ? '' : 's'} found</p>
  `;
  container.appendChild(header);

  // Create grid container
  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  `;

  markets.forEach((market) => {
    const card = createMarketCard(market);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function createMarketCard(market) {
  const card = document.createElement("div");
  card.style.cssText = `
    background: #1a1f3a;
    border: 1px solid #2d3348;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  `;

  // Hover effect
  card.onmouseenter = () => {
    card.style.borderColor = "#4f46e5";
    card.style.transform = "translateY(-2px)";
    card.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.15)";
  };
  card.onmouseleave = () => {
    card.style.borderColor = "#2d3348";
    card.style.transform = "translateY(0)";
    card.style.boxShadow = "none";
  };

  // Add market image if available (small corner image)
  if (market.image || market.icon) {
    const imageContainer = document.createElement("div");
    imageContainer.style.cssText = `
      width: 80px;
      height: 80px;
      float: right;
      margin-left: 12px;
      margin-bottom: 8px;
      overflow: hidden;
      border-radius: 8px;
      background: #0f1320;
      border: 1px solid #2d3348;
    `;
    
    const img = document.createElement("img");
    img.src = market.image || market.icon;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    img.onerror = () => {
      imageContainer.style.display = "none";
    };
    
    imageContainer.appendChild(img);
    card.appendChild(imageContainer);
  }

  // Category/tags
  const tags = market.tags || [];
  if (tags.length > 0) {
    const tagsContainer = document.createElement("div");
    tagsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    `;
    
    // Show first 2 tags
    tags.slice(0, 2).forEach(tag => {
      const tagBadge = document.createElement("div");
      tagBadge.style.cssText = `
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 500;
        text-transform: capitalize;
      `;
      tagBadge.textContent = tag.label || tag;
      tagsContainer.appendChild(tagBadge);
    });
    
    card.appendChild(tagsContainer);
  }

  // Market question/title
  const title = document.createElement("h3");
  title.style.cssText = `
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
    margin: 0 0 6px 0;
    min-height: 42px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `;
  title.textContent = market.title || market.question || "Untitled Market";
  card.appendChild(title);

  // Description
  if (market.description) {
    const description = document.createElement("p");
    description.style.cssText = `
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.4;
      margin: 0 0 12px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `;
    description.textContent = market.description;
    card.appendChild(description);
  }

  // Market stats (volume, liquidity, etc.)
  const stats = document.createElement("div");
  stats.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #2d3348;
  `;

  // Volume
  if (market.volume !== undefined || market.volume24hr !== undefined) {
    const volume = market.volume24hr || market.volume || 0;
    const volumeStat = createStat("24h Volume", formatCurrency(volume));
    stats.appendChild(volumeStat);
  }

  // Liquidity
  if (market.liquidity !== undefined || market.liquidityNum !== undefined) {
    const liquidity = market.liquidityNum || market.liquidity || 0;
    const liquidityStat = createStat("Liquidity", formatCurrency(liquidity));
    stats.appendChild(liquidityStat);
  }

  if (stats.children.length > 0) {
    card.appendChild(stats);
  }

  // Market outcomes - check markets array first
  const marketsList = market.markets && market.markets.length > 0 ? market.markets : [market];
  
  // If there are multiple related markets (like different dates), show them all
  if (marketsList.length > 1) {
    const multiMarketsContainer = document.createElement("div");
    multiMarketsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
      ${marketsList.length > 4 ? `
        max-height: 280px;
        overflow-y: auto;
        padding-right: 4px;
      ` : ''}
    `;

    // Custom scrollbar styling for the container
    if (marketsList.length > 4) {
      const style = document.createElement('style');
      style.textContent = `
        .multi-markets-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .multi-markets-scroll::-webkit-scrollbar-track {
          background: #1a1f3a;
          border-radius: 3px;
        }
        .multi-markets-scroll::-webkit-scrollbar-thumb {
          background: #2d3348;
          border-radius: 3px;
        }
        .multi-markets-scroll::-webkit-scrollbar-thumb:hover {
          background: #4f46e5;
        }
      `;
      document.head.appendChild(style);
      multiMarketsContainer.classList.add('multi-markets-scroll');
    }

    marketsList.forEach((mk, idx) => {
      const mkBtn = createMultiMarketButton(mk, idx, market);
      multiMarketsContainer.appendChild(mkBtn);
    });

    card.appendChild(multiMarketsContainer);
    return card;
  }

  // Single market - show yes/no outcomes
  const marketData = marketsList[0];
  
  // Parse outcomes from the market data
  let outcomes = [];
  if (marketData.outcomes && marketData.outcomePrices) {
    try {
      const outcomeNames = typeof marketData.outcomes === 'string' 
        ? JSON.parse(marketData.outcomes) 
        : marketData.outcomes;
      const outcomePrices = typeof marketData.outcomePrices === 'string'
        ? JSON.parse(marketData.outcomePrices)
        : marketData.outcomePrices;
      
      outcomes = outcomeNames.map((name, idx) => ({
        outcome: name,
        price: parseFloat(outcomePrices[idx] || 0)
      }));
    } catch (e) {
      console.error("Error parsing outcomes:", e);
    }
  }

  if (outcomes.length > 0) {
    const outcomesContainer = document.createElement("div");
    outcomesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    outcomes.forEach((outcome, idx) => {
      const outcomeBtn = createOutcomeButton(outcome, idx, market);
      outcomesContainer.appendChild(outcomeBtn);
    });

    card.appendChild(outcomesContainer);
  } else {
    // Fallback view button
    const viewButton = document.createElement("button");
    viewButton.style.cssText = `
      width: 100%;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid #4f46e5;
      color: #818cf8;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    viewButton.textContent = "View Market";
    viewButton.onmouseenter = () => {
      viewButton.style.background = "rgba(99, 102, 241, 0.2)";
    };
    viewButton.onmouseleave = () => {
      viewButton.style.background = "rgba(99, 102, 241, 0.1)";
    };
    card.appendChild(viewButton);
  }

  // Remove click handler from card since buttons now handle it
  return card;
}

function createStat(label, value) {
  const stat = document.createElement("div");
  stat.style.cssText = `
    flex: 1;
  `;
  stat.innerHTML = `
    <div style="color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${label}</div>
    <div style="color: #fff; font-size: 13px; font-weight: 600;">${value}</div>
  `;
  return stat;
}

function createOutcomeButton(outcome, idx, market) {
  const price = outcome.price || 0;
  const probability = Math.round(price * 100);
  const outcomeName = outcome.outcome || `Option ${idx + 1}`;
  
  // Color scheme based on option
  const isYes = outcomeName.toLowerCase().includes("yes");
  const isNo = outcomeName.toLowerCase().includes("no");
  
  let bgColor, borderColor, textColor, hoverBg;
  if (isYes) {
    bgColor = "rgba(16, 185, 129, 0.1)";
    borderColor = "#10b981";
    textColor = "#34d399";
    hoverBg = "rgba(16, 185, 129, 0.2)";
  } else if (isNo) {
    bgColor = "rgba(239, 68, 68, 0.1)";
    borderColor = "#ef4444";
    textColor = "#f87171";
    hoverBg = "rgba(239, 68, 68, 0.2)";
  } else {
    bgColor = "rgba(99, 102, 241, 0.1)";
    borderColor = "#6366f1";
    textColor = "#818cf8";
    hoverBg = "rgba(99, 102, 241, 0.2)";
  }

  const button = document.createElement("button");
  button.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${bgColor};
    border: 1px solid ${borderColor};
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  `;

  // Format probability display - handle edge cases
  let displayProb;
  if (probability <= 0) {
    displayProb = "<1%";
  } else if (probability >= 100) {
    displayProb = ">99%";
  } else {
    displayProb = `${probability}%`;
  }

  button.innerHTML = `
    <span style="color: #fff; font-size: 14px; font-weight: 500;">${outcomeName}</span>
    <span style="color: ${textColor}; font-size: 15px; font-weight: 700;">${displayProb}</span>
  `;

  button.onmouseenter = () => {
    button.style.background = hoverBg;
  };
  button.onmouseleave = () => {
    button.style.background = bgColor;
  };

  button.onclick = () => {
    // Open main market in Polymarket
    const slug = market.slug || market.ticker;
    const url = slug ? `https://polymarket.com/event/${slug}` : null;
    if (url) {
      window.open(url, "_blank");
    }
    console.log("Opening market with outcome:", outcomeName, market);
  };

  return button;
}

function createMultiMarketButton(mk, idx, parentMarket) {
  // Parse the price for this specific market
  let price = 0;
  if (mk.outcomePrices) {
    try {
      const prices = typeof mk.outcomePrices === 'string'
        ? JSON.parse(mk.outcomePrices)
        : mk.outcomePrices;
      price = parseFloat(prices[0] || 0); // First outcome (usually "Yes")
    } catch (e) {
      price = mk.lastTradePrice || 0;
    }
  } else if (mk.lastTradePrice !== undefined) {
    price = mk.lastTradePrice;
  }

  const probability = Math.round(price * 100);
  
  // Format probability display
  let displayProb;
  if (probability <= 0) {
    displayProb = "<1%";
  } else if (probability >= 100) {
    displayProb = ">99%";
  } else {
    displayProb = `${probability}%`;
  }

  // Color scheme same as Yes/No buttons - based on probability
  let bgColor, borderColor, textColor, hoverBg;
  if (probability >= 50) {
    // High probability - green like "Yes"
    bgColor = "rgba(16, 185, 129, 0.1)";
    borderColor = "#10b981";
    textColor = "#34d399";
    hoverBg = "rgba(16, 185, 129, 0.2)";
  } else {
    // Low probability - red like "No"
    bgColor = "rgba(239, 68, 68, 0.1)";
    borderColor = "#ef4444";
    textColor = "#f87171";
    hoverBg = "rgba(239, 68, 68, 0.2)";
  }

  const button = document.createElement("button");
  button.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${bgColor};
    border: 1px solid ${borderColor};
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  `;

  button.innerHTML = `
    <span style="color: #fff; font-size: 14px; font-weight: 500; max-width: 75%; text-align: left;">${mk.question}</span>
    <span style="color: ${textColor}; font-size: 15px; font-weight: 700;">${displayProb}</span>
  `;

  button.onmouseenter = () => {
    button.style.background = hoverBg;
  };
  button.onmouseleave = () => {
    button.style.background = bgColor;
  };

  button.onclick = () => {
    // Open parent market in Polymarket (not the individual sub-market)
    const slug = parentMarket.slug || parentMarket.ticker;
    const url = slug ? `https://polymarket.com/event/${slug}` : null;
    if (url) {
      window.open(url, "_blank");
    }
    console.log("Opening parent market:", parentMarket);
  };

  return button;
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "N/A";
  
  const num = parseFloat(amount);
  if (isNaN(num)) return "N/A";
  
  if (num >= 1000000) {
    return "$" + (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return "$" + (num / 1000).toFixed(1) + "K";
  } else {
    return "$" + num.toFixed(0);
  }
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
You are a helpful assistant. Extract 10 to 15 concise keywords or short phrases that are most relevant
to the following text, for searching prediction markets. Each keyword or phrase should be 1 to 4 words,
and respond as a JSON array of strings, like: ["phrase1", "phrase2", "phrase3"].

Text:
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
