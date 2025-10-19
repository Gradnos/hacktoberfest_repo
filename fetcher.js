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
   window.lastSelectedText = str;

  // Step 1: Generating keywords
  progressCallback?.("Generating keywords...");
  const keyWords = await getkeywords(str);
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

  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  `;

  markets.forEach((market) => {
    const card = createMarketCard(market, container);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function createMarketCard(market, mainContainer) {
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

  const tags = market.tags || [];
  if (tags.length > 0) {
    const tagsContainer = document.createElement("div");
    tagsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    `;
    
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

  const stats = document.createElement("div");
  stats.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #2d3348;
  `;

  if (market.volume !== undefined || market.volume24hr !== undefined) {
    const volume = market.volume24hr || market.volume || 0;
    const volumeStat = createStat("24h Volume", formatCurrency(volume));
    stats.appendChild(volumeStat);
  }

  if (market.liquidity !== undefined || market.liquidityNum !== undefined) {
    const liquidity = market.liquidityNum || market.liquidity || 0;
    const liquidityStat = createStat("Liquidity", formatCurrency(liquidity));
    stats.appendChild(liquidityStat);
  }

  if (stats.children.length > 0) {
    card.appendChild(stats);
  }

  const marketsList = market.markets && market.markets.length > 0 ? market.markets : [market];
  
  if (marketsList.length > 1) {
    const multiMarketsContainer = document.createElement("div");
    multiMarketsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      ${marketsList.length > 4 ? `
        max-height: 280px;
        overflow-y: auto;
        padding-right: 4px;
      ` : ''}
    `;

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
  } else {
    const marketData = marketsList[0];
    
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
        margin-bottom: 12px;
      `;

      outcomes.forEach((outcome, idx) => {
        const outcomeBtn = createOutcomeButton(outcome, idx, market);
        outcomesContainer.appendChild(outcomeBtn);
      });

      card.appendChild(outcomesContainer);
    } else {
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
        margin-bottom: 12px;
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
  }

  // NEW: Add Analysis Button
  const analysisBtn = document.createElement("button");
  analysisBtn.style.cssText = `
    width: 100%;
    background: rgba(147, 51, 234, 0.1);
    border: 1px solid #9333ea;
    color: #c084fc;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  `;
  analysisBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
    <span>Analyze Market History</span>
  `;
  
  analysisBtn.onmouseenter = () => {
    analysisBtn.style.background = "rgba(147, 51, 234, 0.2)";
  };
  analysisBtn.onmouseleave = () => {
    analysisBtn.style.background = "rgba(147, 51, 234, 0.1)";
  };

analysisBtn.onclick = async (e) => {
  e.stopPropagation();
  // Get selected text from wherever you store it in your extension
  // You'll need to pass this from your main function
  const selectedText = window.lastSelectedText || market.title || "";
  await showMarketAnalysis(market, mainContainer, selectedText);
};

  card.appendChild(analysisBtn);

  return card;
}

async function showMarketAnalysis(market, mainContainer, selectedText) {
  // Create modal overlay
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
  `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: #1a1f3a;
    border: 1px solid #2d3348;
    border-radius: 16px;
    padding: 24px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  `;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText = `
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;
  closeBtn.onclick = () => modal.remove();
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "rgba(239, 68, 68, 0.2)";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "rgba(239, 68, 68, 0.1)";
  };

  // Title
  const title = document.createElement("h2");
  title.style.cssText = `
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    padding-right: 40px;
  `;
  title.textContent = "Analysis: " + (market.title || market.question || "Market");

  // Show selected text context
  const contextBox = document.createElement("div");
  contextBox.style.cssText = `
    background: rgba(99, 102, 241, 0.05);
    border-left: 3px solid #6366f1;
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 4px;
  `;
  contextBox.innerHTML = `
    <p style="margin: 0; color: #9ca3af; font-size: 12px; margin-bottom: 4px;">Selected Text:</p>
    <p style="margin: 0; color: #e5e7eb; font-size: 13px; font-style: italic;">"${selectedText.substring(0, 200)}${selectedText.length > 200 ? '...' : ''}"</p>
  `;

  // Loading state
  const loadingContainer = document.createElement("div");
  loadingContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #9ca3af;
  `;
  loadingContainer.innerHTML = `
    <div style="width: 40px; height: 40px; border: 3px solid #2d3348; border-top-color: #9333ea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
    <p style="margin: 0; font-size: 14px;">Analyzing sources and trends...</p>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(title);
  modalContent.appendChild(contextBox);
  modalContent.appendChild(loadingContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Fetch analysis
  try {
    const analysis = await fetchMarketAnalysis(market, selectedText);
    loadingContainer.remove();
    
    // Display analysis
    const analysisContent = createAnalysisDisplay(analysis);
    modalContent.appendChild(analysisContent);
  } catch (error) {
    loadingContainer.innerHTML = `
      <p style="color: #ef4444; margin: 0;">Error: ${error.message}</p>
    `;
  }
}

function createAnalysisDisplay(analysis) {
  const container = document.createElement("div");
  container.style.cssText = `
    color: #fff;
  `;

  // Source Information Section
  if (analysis.sources && analysis.sources.length > 0) {
    const sourceSection = document.createElement("div");
    sourceSection.style.cssText = `
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid #10b981;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    `;
    
    let sourcesHTML = '<h3 style="color: #34d399; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">📰 Key Sources</h3>';
    
    analysis.sources.forEach((source, idx) => {
      sourcesHTML += `
        <div style="margin-bottom: ${idx < analysis.sources.length - 1 ? '12px' : '0'}; padding-bottom: ${idx < analysis.sources.length - 1 ? '12px' : '0'}; border-bottom: ${idx < analysis.sources.length - 1 ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'};">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <strong style="color: #e5e7eb; font-size: 14px;">${source.title}</strong>
            <span style="color: #9ca3af; font-size: 12px; white-space: nowrap; margin-left: 12px;">${source.date}</span>
          </div>
          <p style="margin: 4px 0; color: #d1d5db; font-size: 13px; line-height: 1.4;">${source.description}</p>
          <a href="${source.url}" target="_blank" style="color: #34d399; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;">
            Read more →
          </a>
        </div>
      `;
    });
    
    sourceSection.innerHTML = sourcesHTML;
    container.appendChild(sourceSection);
  }

  // Key Insights Section
  if (analysis.insights && analysis.insights.length > 0) {
    const insightsSection = document.createElement("div");
    insightsSection.style.cssText = `
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid #6366f1;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    `;
    
    let insightsHTML = '<h3 style="color: #818cf8; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">📊 Key Insights</h3>';
    insightsHTML += '<ul style="margin: 0; padding-left: 20px; color: #e5e7eb; font-size: 14px; line-height: 1.8;">';
    
    analysis.insights.forEach(insight => {
      insightsHTML += `<li style="margin-bottom: 8px;">${insight}</li>`;
    });
    
    insightsHTML += '</ul>';
    insightsSection.innerHTML = insightsHTML;
    container.appendChild(insightsSection);
  }

  // AI Prediction Section
  if (analysis.prediction) {
    const predictionSection = document.createElement("div");
    predictionSection.style.cssText = `
      background: rgba(147, 51, 234, 0.1);
      border: 1px solid #9333ea;
      border-radius: 12px;
      padding: 16px;
    `;
    
    predictionSection.innerHTML = `
      <h3 style="color: #c084fc; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">🤖 AI Prediction</h3>
      <div style="color: #e5e7eb; font-size: 14px; line-height: 1.6;">
        <div style="margin-bottom: 12px;">
          <strong style="color: #c084fc;">Outcome:</strong> ${analysis.prediction.outcome}
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: #c084fc;">Confidence:</strong> ${analysis.prediction.confidence}%
        </div>
        <div>
          <strong style="color: #c084fc;">Reasoning:</strong> ${analysis.prediction.reasoning}
        </div>
      </div>
    `;
    container.appendChild(predictionSection);
  }

  return container;
}

async function fetchMarketAnalysis(market, selectedText) {
  const API_KEY = "AIzaSyBPZ2Mcv-a3GZkEPsKUv1OXjOMhg8uD-YU";
  const MODEL = "gemini-2.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const prompt = `
You are analyzing a prediction market in relation to some selected text. 

Selected Text:
"${selectedText}"

Market Information:
Title: ${market.title || market.question}
Description: ${market.description || 'N/A'}
Category: ${market.category || 'N/A'}

Your task:
1. Find 2-3 key news sources that first reported or are most relevant to the SELECTED TEXT (not the market itself)
2. Provide 3-5 bullet-point key insights about how this topic has evolved
3. Give a brief AI prediction for the market outcome based on current information

Respond ONLY with valid JSON in this exact format:
{
  "sources": [
    {
      "title": "Source name/headline",
      "date": "YYYY-MM-DD or 'Recent'",
      "url": "https://example.com (or 'N/A' if you don't know)",
      "description": "One sentence about what this source says"
    }
  ],
  "insights": [
    "Brief insight point 1",
    "Brief insight point 2", 
    "Brief insight point 3"
  ],
  "prediction": {
    "outcome": "Most likely outcome (Yes/No or description)",
    "confidence": 75,
    "reasoning": "One sentence explaining why"
  }
}

Keep everything concise. Each insight should be ONE sentence max. Sources should be real and verifiable.
`;

  try {
    const response = await fetch(`${endpoint}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const modelOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    let analysis;
    try {
      const jsonStr = modelOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON:", e, modelOutput);
      throw new Error("Failed to parse AI response");
    }

    return analysis;
  } catch (error) {
    console.error("Error fetching market analysis:", error);
    throw error;
  }
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
  let price = 0;
  if (mk.outcomePrices) {
    try {
      const prices = typeof mk.outcomePrices === 'string'
        ? JSON.parse(mk.outcomePrices)
        : mk.outcomePrices;
      price = parseFloat(prices[0] || 0);
    } catch (e) {
      price = mk.lastTradePrice || 0;
    }
  } else if (mk.lastTradePrice !== undefined) {
    price = mk.lastTradePrice;
  }

  const probability = Math.round(price * 100);
  
  let displayProb;
  if (probability <= 0) {
    displayProb = "<1%";
  } else if (probability >= 100) {
    displayProb = ">99%";
  } else {
    displayProb = `${probability}%`;
  }

  let bgColor, borderColor, textColor, hoverBg;
  if (probability >= 50) {
    bgColor = "rgba(16, 185, 129, 0.1)";
    borderColor = "#10b981";
    textColor = "#34d399";
    hoverBg = "rgba(16, 185, 129, 0.2)";
  } else {
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

export async function getkeywords(text) {
  const API_KEY = "AIzaSyBPZ2Mcv-a3GZkEPsKUv1OXjOMhg8uD-YU";
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
   - Translate the text to English if it's in another language.

2. **Generate relevant Polymarket search keywords.**
   - Focus on topics that are likely to have prediction markets or could plausibly have them (e.g., elections, price movements, policy outcomes, sports results, crypto events, geopolitical risks, major company announcements).
   - Include synonyms and event formulations:  
     e.g. "Ethereum ETF approval", "US presidential election", "Bitcoin price above 100k", "Biden approval rating".
   - Prefer concise, market-style keyword phrases (2–6 words each).

3. **Be smart with context and reasoning.**
   - If the snippet mentions two politicians → include their countries, possible elections, and related geopolitical events.  
   - If it's about a company → include keywords about its stock, regulation, and industry trends.  
   - If it's about crypto → include keywords like "price", "ETF approval", "adoption", "network upgrade".  
   - If the snippet is general → infer related global or economic prediction themes.

4. **Output format:**
   Return a JSON array of 5–15 short keyword phrases (strings) that would be good Polymarket search queries.
    MAX 10 

---

### EXAMPLE:

**Input:**
"Recent reports suggest tension between the US and China over semiconductor exports."

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

    let keywords = [];
    try {
      keywords = JSON.parse(modelOutput.replace(/\n/g, ""));
    } catch {
      keywords = modelOutput
        .split(/,|\n/)
        .map((k) => k.trim())
        .filter(Boolean);
    }

    return keywords;
  } catch (error) {
    console.error("Error calling Gemini API for keywords:", error);
    return [];
  }
}

export async function isvalidBulk(marketsList, text) {
  const API_KEY = "AIzaSyBPZ2Mcv-a3GZkEPsKUv1OXjOMhg8uD-YU";
  const MODEL = "gemini-2.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const minimalMarkets = marketsList.map((market) => ({
      title: market.title,
      subtitle: market.subtitle,
      description: market.description,
      category: market.category,
      subcategory: market.subcategory,
      ticker: market.ticker,
    }));

   const prompt = `You are a prediction market analyst. Rate how much the given text could impact each prediction market from 1-100.

SCORING GUIDELINES:
- 90-100: Direct, immediate impact (e.g., Fed announcement for inflation markets, election results for political markets)
- 70-89: Strong indirect impact (e.g., major policy changes affecting related sectors, geopolitical events affecting trade)
- 50-69: Moderate relevance (e.g., economic indicators for sector-specific markets, regulatory hints)
- 30-49: Weak connection (e.g., tangential mentions, background context)
- 10-29: Minimal relevance (e.g., same topic area but no clear impact pathway)
- 1-9: Nearly irrelevant (e.g., only keyword overlap)
- 0: Completely unrelated

IMPACT FACTORS TO CONSIDER:
1. Direct causality: Does this event directly affect the market outcome?
2. Geographic relevance: Does the location/country match the market scope?
3. Temporal proximity: Is this event close to the market's resolution date?
4. Authority level: Are key decision-makers or influential figures involved?
5. Magnitude: How significant is the event (policy change vs. routine meeting)?
6. Market sensitivity: How volatile/reactive is this type of market to news?

EXAMPLES:
- "Fed raises interest rates by 0.5%" → Inflation markets (95), Stock market predictions (85), Housing markets (80)
- "Two EU leaders meet for trade discussions" → EU trade markets (75), Their countries' economic markets (70), Global trade (50)
- "Celebrity tweets about cryptocurrency" → That specific crypto (40), Crypto adoption markets (25), Unrelated crypto (10)

Text:
${text}

Markets:
${JSON.stringify(minimalMarkets, null, 2)}

Respond ONLY with a JSON array of numbers (1-100) in the exact same order as the markets above.
Example format: [85, 42, 15, 90, 8]`;

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

    let scores = [];
    try {
      scores = JSON.parse(modelOutput.replace(/\n/g, ""));
    } catch {
      scores = modelOutput.match(/\d+/g)?.map((n) => parseInt(n, 10)) || [];
    }
    console.log("scores:  ", scores);
    
    if (scores.length !== marketsList.length) {
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