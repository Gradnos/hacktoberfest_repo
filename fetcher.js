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
  progressCallback?.("Tsuring keywords...");
  const keyWords = await getkeywords(str);
  progressCallback?.(`Keywords: ${keyWords.join(", ")}`);
  console.log("keyWords: --------", keyWords);
  // Step 2: Fetching markets
  progressCallback?.("Tsuring markets...");
  await fetchMarkets(keyWords, progressCallback);
  console.log(markets, str);
  // Step 3: Evaluating markets
  progressCallback?.("Tsuring markets...");
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
    background: #0f0f0f;
    padding: 20px;
    min-height: 100vh;
  `;

  if (!markets.length) {
    const emptyState = document.createElement("div");
    emptyState.style.cssText = `
      text-align: center;
      color: #6b7280;
      padding: 48px 20px;
      font-size: 14px;
    `;
    emptyState.textContent = "No markets found for this search.";
    container.appendChild(emptyState);
    return;
  }

  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
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
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  `;

  card.onmouseenter = () => {
    card.style.borderColor = "#3a3a3a";
    card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  };
  card.onmouseleave = () => {
    card.style.borderColor = "#2a2a2a";
    card.style.boxShadow = "none";
  };

  // Header container with icon, title, and percentage
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  `;

  // Icon
  if (market.image || market.icon) {
    const imageContainer = document.createElement("div");
    imageContainer.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.05);
      flex-shrink: 0;
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
    header.appendChild(imageContainer);
  }

  // Title
  const title = document.createElement("h3");
  title.style.cssText = `
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.3;
    margin: 0;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `;
  title.textContent = market.title || market.question || "Untitled Market";
  header.appendChild(title);

  card.appendChild(header);

  const marketsList = market.markets && market.markets.length > 0 ? market.markets : [market];
  
  if (marketsList.length > 1) {
    const multiMarketsContainer = document.createElement("div");
    multiMarketsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      ${marketsList.length > 4 ? `
        max-height: 240px;
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
          background: #2a2a2a;
          border-radius: 3px;
        }
        .multi-markets-scroll::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 3px;
        }
        .multi-markets-scroll::-webkit-scrollbar-thumb:hover {
          background: #4a4a4a;
        }
      `;
      document.head.appendChild(style);
      multiMarketsContainer.classList.add('multi-markets-scroll');
    }

    const getPrice = (mk) => {
      try {
        if (mk.outcomePrices) {
          const prices = typeof mk.outcomePrices === 'string'
            ? JSON.parse(mk.outcomePrices)
            : mk.outcomePrices;
          const p = parseFloat(prices?.[0] ?? 0);
          return isNaN(p) ? 0 : p;
        }
        if (mk.lastTradePrice !== undefined && mk.lastTradePrice !== null) {
          const p = parseFloat(mk.lastTradePrice);
          return isNaN(p) ? 0 : p;
        }
      } catch {}
      return 0;
    };

    const sortedMarketsList = [...marketsList].sort((a, b) => getPrice(b) - getPrice(a));

    sortedMarketsList.forEach((mk, idx) => {
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
      // Binary market - show 2 buttons side by side with percentage in header
      if (outcomes.length === 2) {
        // Add percentage to header
        const percentage = document.createElement("div");
        percentage.style.cssText = `
          color: #ffffff;
          font-size: 32px;
          font-weight: 700;
          flex-shrink: 0;
        `;
        const price = outcomes[0].price || 0;
        const prob = Math.round(price * 100);
        percentage.textContent = `${prob}%`;
        header.appendChild(percentage);

        // Binary buttons grid
        const buttonsGrid = document.createElement("div");
        buttonsGrid.style.cssText = `
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
        `;

        outcomes.forEach((outcome, idx) => {
          const outcomeBtn = createOutcomeButton(outcome, idx, market);
          buttonsGrid.appendChild(outcomeBtn);
        });

        card.appendChild(buttonsGrid);
      } else {
        // Multi-outcome market - show list of options sorted by percentage descending
        const outcomesContainer = document.createElement("div");
        outcomesContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        `;

        // Sort outcomes by price (percentage) in descending order
        console.log('Before sort:', outcomes.map(o => ({ outcome: o.outcome, price: o.price })));
        const sortedOutcomes = [...outcomes].sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceB - priceA;
        });
        console.log('After sort:', sortedOutcomes.map(o => ({ outcome: o.outcome, price: o.price })));

        sortedOutcomes.forEach((outcome, idx) => {
          const outcomeBtn = createOutcomeButton(outcome, idx, market);
          outcomesContainer.appendChild(outcomeBtn);
        });

        card.appendChild(outcomesContainer);
      }
    }
  }

  // Footer with volume, analysis button, and platform logo
  const footer = document.createElement("div");
  footer.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #2a2a2a;
    gap: 8px;
  `;

  // Volume
  const volume = market.volume24hr || market.volume || 0;
  const volumeText = document.createElement("span");
  volumeText.style.cssText = `
    color: #9ca3af;
    font-size: 12px;
  `;
  volumeText.textContent = formatVolume(volume);
  footer.appendChild(volumeText);

  // Right side container for button and logo
  const rightContainer = document.createElement("div");
  rightContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  // Analysis Button
  const analysisBtn = document.createElement("button");
  analysisBtn.style.cssText = `
    background: linear-gradient(135deg, #4169E1 0%, #5B7FED 100%);
    border: none;
    color: #ffffff;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(65, 105, 225, 0.25);
  `;
  analysisBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
    <span>Market Analysis</span>
  `;
  
  analysisBtn.onmouseenter = () => {
    analysisBtn.style.background = "linear-gradient(135deg, #5B7FED 0%, #6A8EFF 100%)";
    analysisBtn.style.boxShadow = "0 3px 8px rgba(65, 105, 225, 0.35)";
  };
  analysisBtn.onmouseleave = () => {
    analysisBtn.style.background = "linear-gradient(135deg, #4169E1 0%, #5B7FED 100%)";
    analysisBtn.style.boxShadow = "0 2px 6px rgba(65, 105, 225, 0.25)";
  };

  analysisBtn.onclick = async (e) => {
    e.stopPropagation();
    const selectedText = window.lastSelectedText || market.title || "";
    await showMarketAnalysis(market, mainContainer, selectedText);
  };

  rightContainer.appendChild(analysisBtn);

  // Platform logo (Polymarket logo)
  const platformLogo = document.createElement("img");
  platformLogo.src = "/polymarket-logo.png";
  platformLogo.style.cssText = `
    width: 20px;
    height: 20px;
    object-fit: contain;
  `;
  rightContainer.appendChild(platformLogo);

  footer.appendChild(rightContainer);
  card.appendChild(footer);

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
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
  `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 20px;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    color: #9ca3af;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  `;
  closeBtn.onclick = () => modal.remove();
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = "#3a3a3a";
    closeBtn.style.borderColor = "#4a4a4a";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = "#2a2a2a";
    closeBtn.style.borderColor = "#3a3a3a";
  };

  // Title
  const title = document.createElement("h2");
  title.style.cssText = `
    color: #e5e5e5;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 6px 0;
    padding-right: 36px;
  `;
  title.textContent = "Analysis: " + (market.title || market.question || "Market");

  // Loading state
  const loadingContainer = document.createElement("div");
  loadingContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    color: #6b7280;
  `;
  loadingContainer.innerHTML = `
    <div style="width: 32px; height: 32px; border: 2px solid #2a2a2a; border-top-color: #6b7280; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
    <p style="margin: 0; font-size: 13px;">Analyzing sources and trends...</p>
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
    color: #e5e5e5;
  `;

  // Source Information Section
  if (analysis.sources && analysis.sources.length > 0) {
    // Filter sources to only show those after September 9, 2025
    const cutoffDate = new Date('2025-09-09');
    const filteredSources = analysis.sources.filter(source => {
      if (!source.date || source.date === 'N/A' || source.date.toLowerCase() === 'recent') {
        return true; // Keep sources without specific dates
      }
      try {
        const sourceDate = new Date(source.date);
        return sourceDate >= cutoffDate;
      } catch (e) {
        return true; // Keep sources with invalid dates
      }
    });

    if (filteredSources.length === 0) {
      // Skip this section if no sources pass the filter
    } else {
      const sourceSection = document.createElement("div");
      sourceSection.style.cssText = `
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        padding: 14px;
        margin-bottom: 16px;
      `;
      
      let sourcesHTML = '<h3 style="color: #e5e5e5; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">Relevant Sources</h3>';
      
      filteredSources.forEach((source, idx) => {
        sourcesHTML += `
          <div style="margin-bottom: ${idx < filteredSources.length - 1 ? '10px' : '0'}; padding-bottom: ${idx < filteredSources.length - 1 ? '10px' : '0'}; border-bottom: ${idx < filteredSources.length - 1 ? '1px solid #3a3a3a' : 'none'};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
              <strong style="color: #e5e5e5; font-size: 13px;">${source.title}</strong>
              <span style="color: #9ca3af; font-size: 11px; white-space: nowrap; margin-left: 10px;">${source.date}</span>
            </div>
            <p style="margin: 4px 0; color: #d0d0d0; font-size: 12px; line-height: 1.4;">${source.description}</p>
            <a href="${source.url}" target="_blank" style="color: #e5e5e5; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; border-bottom: 1px solid #3a3a3a;">
              Read more →
            </a>
          </div>
        `;
      });
      
      sourceSection.innerHTML = sourcesHTML;
      container.appendChild(sourceSection);
    }
  }

  // Key Insights Section
  if (analysis.insights && analysis.insights.length > 0) {
    const insightsSection = document.createElement("div");
    insightsSection.style.cssText = `
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 16px;
    `;
    
    let insightsHTML = '<h3 style="color: #e5e5e5; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">Key Insights</h3>';
    insightsHTML += '<ul style="margin: 0; padding-left: 18px; color: #d0d0d0; font-size: 13px; line-height: 1.6;">';
    
    analysis.insights.forEach(insight => {
      insightsHTML += `<li style="margin-bottom: 6px;">${insight}</li>`;
    });
    
    insightsHTML += '</ul>';
    insightsSection.innerHTML = insightsHTML;
    container.appendChild(insightsSection);
  }

  // AI Prediction Section
  if (analysis.prediction) {
    const predictionSection = document.createElement("div");
    predictionSection.style.cssText = `
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      border-radius: 6px;
      padding: 14px;
    `;
    
    predictionSection.innerHTML = `
      <h3 style="color: #e5e5e5; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">AI Prediction</h3>
      <div style="color: #d0d0d0; font-size: 13px; line-height: 1.5;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #e5e5e5;">Outcome:</strong> ${analysis.prediction.outcome}
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #e5e5e5;">Confidence:</strong> ${analysis.prediction.confidence}%
        </div>
        <div>
          <strong style="color: #e5e5e5;">Reasoning:</strong> ${analysis.prediction.reasoning}
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

  // Determine market type and format options
  const marketsList = market.markets || [market];
  const marketData = marketsList[0];
  
  let marketType = "unknown";
  let formattedOptions = "";
  
  if (marketsList.length > 1) {
    // Multiple related markets (e.g., "Which team will finish top 4?")
    marketType = "multi-market";
    formattedOptions = marketsList.map((mk, idx) => {
      let price = 0;
      if (mk.outcomePrices) {
        try {
          const prices = typeof mk.outcomePrices === 'string' ? JSON.parse(mk.outcomePrices) : mk.outcomePrices;
          price = parseFloat(prices[0] || 0);
        } catch (e) {}
      }
      const prob = Math.round(price * 100);
      return `${idx + 1}. ${mk.question} (Currently: ${prob}% YES)`;
    }).join('\n');
  } else if (marketData.outcomes && marketData.outcomePrices) {
    try {
      const outcomeNames = typeof marketData.outcomes === 'string' 
        ? JSON.parse(marketData.outcomes) 
        : marketData.outcomes;
      const outcomePrices = typeof marketData.outcomePrices === 'string'
        ? JSON.parse(marketData.outcomePrices)
        : marketData.outcomePrices;
      
      if (outcomeNames && outcomeNames.length === 2 && 
          outcomeNames.some(n => n.toLowerCase().includes('yes')) &&
          outcomeNames.some(n => n.toLowerCase().includes('no'))) {
        // Binary Yes/No market
        marketType = "binary";
        formattedOptions = "Yes or No";
      } else if (outcomeNames && outcomeNames.length > 2) {
        // Multiple choice market
        marketType = "multiple-choice";
        formattedOptions = outcomeNames.map((name, idx) => {
          const price = parseFloat(outcomePrices[idx] || 0);
          const prob = Math.round(price * 100);
          return `${idx + 1}. ${name} (Currently: ${prob}%)`;
        }).join('\n');
      } else {
        marketType = "binary";
        formattedOptions = outcomeNames ? outcomeNames.join(' or ') : "Yes or No";
      }
    } catch (e) {
      marketType = "binary";
      formattedOptions = "Yes or No";
    }
  } else {
    marketType = "binary";
    formattedOptions = "Yes or No";
  }

  const prompt = `
You are analyzing a prediction market in relation to some selected text. 

Selected Text:
"${selectedText}"

Market Information:
Title: ${market.title || market.question}
Description: ${market.description || 'N/A'}
Category: ${market.category || 'N/A'}
Market Type: ${marketType}

Available Options:
${formattedOptions}

Your task:
1. Find 2-3 key news sources that first reported or are most relevant to the SELECTED TEXT
2. Provide 3-5 bullet-point key insights about how this topic has evolved
3. Give a prediction for the most likely outcome

PREDICTION RULES BASED ON MARKET TYPE:
- If market type is "binary": Predict "Yes" or "No" 
- If market type is "multiple-choice": Predict the specific option name from the list above
- If market type is "multi-market": Predict which specific question/option is most likely YES, format as "[Question text] (YES)" or "[Question text] (NO)"

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
    "outcome": "Your prediction following the rules above",
    "confidence": 75,
    "reasoning": "One sentence explaining why this outcome is most likely"
  }
}

CRITICAL: Follow the prediction format rules strictly based on the market type.
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
    <div style="color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; line-height: 1;">${label}</div>
    <div style="color: #ffffff; font-size: 13px; font-weight: 600; line-height: 1;">${value}</div>
  `;
  return stat;
}

function createOutcomeButton(outcome, idx, market) {
  const price = outcome.price || 0;
  const probability = Math.round(price * 100);
  const outcomeName = outcome.outcome || `Option ${idx + 1}`;
  
  const isYes = outcomeName.toLowerCase().includes("yes");
  const isNo = outcomeName.toLowerCase().includes("no");
  
  let bgColor, textColor, hoverBg;
  if (isYes) {
    bgColor = "#3d7555";
    textColor = "#7ed39d";
    hoverBg = "#4a8a65";
  } else if (isNo) {
    bgColor = "#8b4d4d";
    textColor = "#e89090";
    hoverBg = "#9d5757";
  } else {
    bgColor = "#3d7555";
    textColor = "#7ed39d";
    hoverBg = "#4a8a65";
  }

  const button = document.createElement("button");
  button.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    background: ${bgColor};
    border: none;
    padding: 16px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
    height: 52px;
    font-weight: 600;
  `;

  button.innerHTML = `
    <span style="color: ${textColor}; font-size: 16px; font-weight: 600;">${outcomeName}</span>
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

  // Create row container
  const row = document.createElement("div");
  row.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  `;

  // Option text
  const optionText = document.createElement("span");
  optionText.style.cssText = `
    color: #ffffff;
    font-size: 15px;
    font-weight: 400;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  optionText.textContent = mk.question;

  // Percentage
  const percentageText = document.createElement("span");
  percentageText.style.cssText = `
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
    flex-shrink: 0;
    min-width: 55px;
    text-align: right;
  `;
  percentageText.textContent = displayProb;

  // Yes button
  const yesBtn = document.createElement("button");
  yesBtn.style.cssText = `
    background: #3d7555;
    border: none;
    color: #7ed39d;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  `;
  yesBtn.textContent = "Yes";
  yesBtn.onmouseenter = () => {
    yesBtn.style.background = "#4a8a65";
  };
  yesBtn.onmouseleave = () => {
    yesBtn.style.background = "#3d7555";
  };
  yesBtn.onclick = (e) => {
    e.stopPropagation();
    const slug = parentMarket.slug || parentMarket.ticker;
    const url = slug ? `https://polymarket.com/event/${slug}` : null;
    if (url) {
      window.open(url, "_blank");
    }
  };

  // No button
  const noBtn = document.createElement("button");
  noBtn.style.cssText = `
    background: #8b4d4d;
    border: none;
    color: #e89090;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  `;
  noBtn.textContent = "No";
  noBtn.onmouseenter = () => {
    noBtn.style.background = "#9d5757";
  };
  noBtn.onmouseleave = () => {
    noBtn.style.background = "#8b4d4d";
  };
  noBtn.onclick = (e) => {
    e.stopPropagation();
    const slug = parentMarket.slug || parentMarket.ticker;
    const url = slug ? `https://polymarket.com/event/${slug}` : null;
    if (url) {
      window.open(url, "_blank");
    }
  };

  row.appendChild(optionText);
  row.appendChild(percentageText);
  row.appendChild(yesBtn);
  row.appendChild(noBtn);

  return row;
}

function formatVolume(amount) {
  if (!amount && amount !== 0) return "N/A";
  
  const num = parseFloat(amount);
  if (isNaN(num)) return "N/A";
  
  if (num >= 1000000) {
    return "$" + (num / 1000000).toFixed(0) + "m Vol.";
  } else if (num >= 1000) {
    return "$" + (num / 1000).toFixed(0) + "k Vol.";
  } else {
    return "$" + num.toFixed(0) + " Vol.";
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
        `Tsured ${data?.events?.length || 0} markets for "${keyWord}"`
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
   - CRITICAL: Each keyword MUST be 1-2 WORDS ONLY. No more than 2 words per search string.
   - Examples of valid keywords: "Bitcoin", "Trump", "Ethereum ETF", "US election", "Fed rate", "Arsenal", "Liverpool"
   - Examples of INVALID keywords: "US presidential election 2024", "Bitcoin price above 100k" (too long)

3. **Be smart with context and reasoning.**
   - If the snippet mentions two politicians → include their names, countries, elections.
   - If it's about a company → include the company name, its stock ticker if known.
   - If it's about crypto → include cryptocurrency names, "ETF", "price", "adoption".
   - If the snippet is general → infer related global or economic prediction themes.

4. **Output format:**
   Return a JSON array of 5–10 short keyword phrases (1-2 words each) that would be good Polymarket search queries.
   MAX 10 keywords total.

---

### EXAMPLE:

**Input:**
"Recent reports suggest tension between the US and China over semiconductor exports."

**Output:**
[
  "US-China",
  "semiconductor",
  "Taiwan",
  "chip industry",
  "China economy",
  "US tech"
]

---

Now, analyze the following snippet and ONLY return your keyword list. REMEMBER: 1-2 WORDS PER KEYWORD ONLY:
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