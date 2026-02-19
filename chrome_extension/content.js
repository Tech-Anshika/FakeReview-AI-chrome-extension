// chrome_extension/content.js

// --------------------------------------------------------------------------
// 1. GLOBAL CONFIGURATION (Must be defined first)
// --------------------------------------------------------------------------
const SITE_CONFIG = {
  "amazon": {
    selectors: "div[data-hook='review-body'] span, .review-text-content span",
    poll: false,
    card: "div[data-hook='review'], .review",
    metadata: {
      rating: "i[data-hook='review-star-rating'] span, i.a-icon-star span",
      verified: "span[data-hook='avp-badge']",
      date: "span[data-hook='review-date']",
      helpful: "span[data-hook='helpful-vote-statement']",
      reviewer: "span.a-profile-name"
    }
  },
  "flipkart": {
    selectors: "div._2-N8zT, div._6K-7Co, div.t-ZTKy",
    poll: true,
    card: "div.col-12-12, div._27M-vq, div._1AtVbE", // Parent containers
    metadata: {
      rating: "div._3LWZlK",
      verified: "p._2mcZGG, div._1e9_Tou, span._2_R_DZ",
      date: "p._2sc7ZR", // Often combined with name in different elements, using approximate
      helpful: "div._1LJS6T, span._3cPx5, div._27M-vq div._1LJS6T",
      reviewer: "p._2sc7ZR, span._2sc7ZR" // Wrapper often contains name
    }
  },
  "myntra": {
    selectors: ".user-review-reviewTextWrapper",
    poll: true, // Enable polling for SPA
    card: ".user-review-reviewCard",
    metadata: {
      rating: ".user-review-starRating",
      verified: ".user-review-verified",
      date: ".user-review-date",
      helpful: ".user-review-helpful",
      reviewer: ".user-review-reviewerName"
    }
  }
};

// --------------------------------------------------------------------------
// 2. GLOBAL: Force Enable Context Menu (for Myntra)
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// 1. GLOBAL: Force Enable Context Menu & SPA Monitor
// --------------------------------------------------------------------------
document.addEventListener("contextmenu", (e) => {
  e.stopImmediatePropagation();
}, true);

// SPA NAVIGATION MONITOR
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.hostname.includes("flipkart.com")) {
      console.log("[FakeReview-AI] Flipkart SPA navigation detected");
      setTimeout(() => {
        handleBatchAnalysis(); // re-run batch detection
      }, 1500);
    }
  }
}).observe(document, { subtree: true, childList: true });

function initFlipkartBatchMode() {
  console.log("Flipkart SPA detected");
  // We can reset any necessary state here if needed
}

// --------------------------------------------------------------------------
// 2. LISTENERS: Handle Context Menu, FAB, & Batch Actions
// --------------------------------------------------------------------------

// Combined Message Listener
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

  // A. Existing Manual Check (Context Menu)
  if (msg.action === "checkReview") {
    runCheck(msg.text);
    return;
  }

  // B. New Batch Analysis (Analyze All Page)
  if (msg.action === "analyzeAll") {
    handleBatchAnalysis(sendResponse);
    return true; // Async response
  }
});
// ... (rest of the file until handleBatchAnalysis) ...
/**
 * Main Entry Point for "Analyze All"
 */
async function handleBatchAnalysis(sendResponse) {
  const domain = window.location.hostname;
  console.log(`[FakeReview-AI] Analysis requested for: ${domain}`);
  if (sendResponse) sendResponse({ status: "started" }); // Ack immediately if triggered by message

  showGlobalToast("Analyzing page content...");
  // ...

  // Step 1: Detect Site & Try Site-Specific Extraction
  const siteKey = detectSite(domain);
  let reviews = [];

  if (siteKey) {
    console.log(`[FakeReview-AI] Detected known site: ${siteKey}`);
    reviews = await extractSiteSpecific(siteKey);
  }

  // Step 2: Fallback to Universal Parser (Retry logic added)
  if (reviews.length === 0) {
    // Retry detection for a few seconds if initial check failed (Prevent Early API Call)
    if (siteKey) {
      console.warn(`[FakeReview-AI] No reviews found initially for ${siteKey}. Retrying...`);
      // Simple retry delay - actually extractSiteSpecific handles polling, 
      // but if that returned 0, we can try universals or final check.
      // Given implementation of extractSiteSpecific, if it returns 0, it already tried wait.
    }

    console.warn("[FakeReview-AI] No site-specific reviews found. Activating Universal Parser...");
    showGlobalToast("Standard extraction failed. Trying Universal Parser...");
    reviews = extractUniversal();
  }

  // Step 3: Process or Manual Fallback
  if (reviews.length > 0) {
    console.log(`[FakeReview-AI] Processing ${reviews.length} reviews.`);
    console.log("Reviews found:", reviews.length);
    startBatchProcessing(reviews);
  } else {
    console.warn("[FakeReview-AI] Universal parser failed. Enabling Manual Mode.");
    enableManualMode();
  }
}

function detectSite(domain) {
  for (const key in SITE_CONFIG) {
    if (domain.includes(key)) return key;
  }
  return null;
}

function waitForFlipkartReviews() {
  return new Promise(resolve => {
    let interval = setInterval(() => {
      let nodes = document.querySelectorAll("div._2-N8zT, div._6K-7Co, div.t-ZTKy");
      if (nodes.length > 3) {
        console.log("[FakeReview-AI] Flipkart nodes detected:", nodes.length);
        clearInterval(interval);
        resolve(nodes);
      }
    }, 500);

    // Safety timeout after 10s
    setTimeout(() => { clearInterval(interval); resolve(document.querySelectorAll("div._2-N8zT, div._6K-7Co, div.t-ZTKy")); }, 10000);
  });
}

/**
 * Site Specific Extraction (with Polling support)
 */
async function extractSiteSpecific(siteKey) {
  const config = SITE_CONFIG[siteKey];
  const selector = config.selectors;

  // Dedicated Flipkart Wait & Universal Extraction
  if (siteKey === "flipkart") {
    await waitForFlipkartReviews(); // Wait for content load

    // Semantic Detection Strategy (Class-Independent)
    const candidates = Array.from(document.querySelectorAll("div, span, p"));
    const nodes = candidates.filter(el => {
      const text = el.innerText?.trim();
      if (!text) return false;

      // Filter Logic:
      // 1. Minimum length and word count typical of reviews
      // 2. Not interactive elements (buttons, navs)
      // 3. Not hidden or headers
      return (
        text.length > 40 &&
        text.split(/\s+/).length > 6 &&
        !el.closest("button, a, nav, header, footer, script, style") &&
        el.children.length === 0 // Leaf nodes only (prevent duplicates)
      );
    });

    console.log(`[FakeReview-AI] Flipkart Semantic Detection found: ${nodes.length} candidates`);
    if (nodes.length > 0) return Array.from(nodes).map(node => normalizeReview(node, "site-specific", siteKey));
  }

  // Try immediate
  let nodes = document.querySelectorAll(selector);
  if (nodes.length > 0) return Array.from(nodes).map(node => normalizeReview(node, "site-specific", siteKey));

  // Poll if configured (e.g. Myntra)
  if (config.poll) {
    console.log("[FakeReview-AI] Polling for dynamic content...");
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        nodes = document.querySelectorAll(selector);
        if (nodes.length > 0) {
          clearInterval(interval);
          resolve(Array.from(nodes).map(node => normalizeReview(node, "site-specific", siteKey)));
        } else if (attempts >= 8) { // 4 seconds
          clearInterval(interval);
          resolve([]);
        }
      }, 500);
    });
  }

  return [];
}

/**
 * Universal Parser (Heuristic Based)
 */
function extractUniversal() {
  const candidates = [];
  console.log("[FakeReview-AI] Running Universal Heuristics...");

  // Configurable thresholds
  const MIN_TEXT_LEN = 30;

  // Strategy: Find text blocks, check context
  const validTags = ['P', 'DIV', 'SPAN', 'LI', 'BLOCKQUOTE'];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (!validTags.includes(node.tagName)) return NodeFilter.FILTER_SKIP;
        // Skip hidden or tiny text
        if (node.innerText.length < MIN_TEXT_LEN) return NodeFilter.FILTER_SKIP;
        // Skip script/style containers
        if (node.closest('script, style, nav, footer, header, noscript')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.innerText.trim();

    // Heuristic 1: Length check (already done in filter mostly)
    if (text.length < MIN_TEXT_LEN) continue;

    // Heuristic 2: Leaf Node Check (Prevent duplicates from parents)
    // If the node contains other block elements, it's likely a container, not the review text itself.
    if (node.querySelector('p, div, article, blockquote, li')) continue;

    // Attempt extract metadata from surroundings (No site key, strictly heuristic)
    const metadata = extractMetadata(node, null);

    // Push candidate
    candidates.push({
      element: node,
      text: text,
      metadata: metadata,
      source: "universal"
    });
  }

  // Return limited candidates to avoid spamming API
  return candidates.slice(0, 50);
}

/**
 * Extract Metadata (Rating, Verified, Date, Helpful, Reviewer)
 * Scoped strictly to the review card to avoid global contamination.
 */
function extractMetadata(element, siteKey = null) {
  // 1. Identify Container / Scope (Priority: Semantic Card > Block Parent)
  // Try to find a distinct review card container first
  let container = element.closest('article, li, [data-hook="review"], .review, .user-review-reviewCard, ._27M-vq, .col-12-12');

  // ⭐ AMAZON SPECIFIC: Force detection of main review card
  if (window.location.hostname.includes("amazon")) {
    container = element.closest('div[data-hook="review"]');
  }

  // Fallback: Closest block if no specific card found
  if (!container) {
    container = element.closest('div, section');
  }

  // Safety: Limit scope to avoid selecting the whole page/body
  if (!container || container === document.body || container.innerText.length > 5000) {
    container = element.parentElement;
  }

  if (!container) return { rating: null, verified: false, date: null, helpful: 0, reviewer: null };

  // 2. Prepare Clean Context (Remove extension artifacts & scripts)
  const clone = container.cloneNode(true);
  const badSelectors = [
    '.fake-review-batch-badge',
    '.fake-review-toast',
    '.genuine-badge',
    '.fake-review-badge',
    '[data-ai-label]',
    'script',
    'style',
    'noscript',
    '#fake-review-overlay'
  ];
  badSelectors.forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));

  const contextText = clone.innerText;
  const html = clone.innerHTML;

  let rating = null;
  let verified = false;
  let date = null;
  let helpful = 0;
  let reviewer = null;

  // ---------------------------------------------------------
  // A. Site-Specific Extraction (If configuration exists)
  // ---------------------------------------------------------
  // Note: For site-specific, we still use the original container for selector matching reliability,
  // but we should check if those selectors accidentally point to injected elements (unlikely given specific classes).
  if (siteKey && SITE_CONFIG[siteKey].metadata) {
    const metaConfig = SITE_CONFIG[siteKey].metadata;

    // ... (generic logic is here, but we will override for Amazon below) ...

    // Rating
    if (metaConfig.rating) {
      const ratingEl = clone.querySelector(metaConfig.rating) || container.querySelector(metaConfig.rating);
      if (ratingEl) {
        const ratingText = ratingEl.innerText || ratingEl.getAttribute("aria-label") || "";
        const match = ratingText.match(/(\d(\.\d)?)/);
        if (match) rating = parseFloat(match[1]);
      }
    }

    // Verified
    if (metaConfig.verified) {
      const verifiedEl = clone.querySelector(metaConfig.verified) || container.querySelector(metaConfig.verified);
      if (verifiedEl) verified = true;
    }

    // Date
    if (metaConfig.date) {
      const dateEl = clone.querySelector(metaConfig.date) || container.querySelector(metaConfig.date);
      if (dateEl) date = dateEl.innerText.trim();
    }

    // Helpful Vote
    if (metaConfig.helpful) {
      const helpfulEl = clone.querySelector(metaConfig.helpful) || container.querySelector(metaConfig.helpful);
      if (helpfulEl) {
        const hText = helpfulEl.innerText.replace(/,/g, "");
        const hMatch = hText.match(/(\d+)/);
        if (hMatch) helpful = parseInt(hMatch[1]);
      }
    }

    // Reviewer Name
    if (metaConfig.reviewer) {
      const revEl = clone.querySelector(metaConfig.reviewer) || container.querySelector(metaConfig.reviewer);
      if (revEl) reviewer = revEl.innerText.trim();
    }
  }

  // ⭐ AMAZON SPECIFIC OVERRIDES (Required for metadata accuracy)
  if (siteKey === "amazon") {
    // Verified Purchase
    verified = container.querySelector("[data-hook='avp-badge']") ? 1 : 0;

    // Rating
    const ratingText = container.querySelector("[data-hook='review-star-rating'] span")?.innerText || "";
    const ratingMatch = ratingText.match(/([0-9.]+)/);
    rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    // Review Date
    date = container.querySelector("[data-hook='review-date']")?.innerText || "";
  }

  // ---------------------------------------------------------
  // B. Heuristic Fallback (Use Clean Context)
  // ---------------------------------------------------------

  // 1. Rating Detection
  if (!rating) {
    const starMatch = html.match(/(\d(\.\d)?)\s?(?:out of|stars|sta|rtng)/i) ||
      contextText.match(/(\d(\.\d)?)\s?\/\s?5/);
    if (starMatch) rating = parseFloat(starMatch[1]);
  }

  // 2. Verified Purchase
  // Scoped strictly to the card text
  if (!verified) {
    const verifiedKeywords = ["Verified Purchase", "Certified Buyer", "Verified Customer", "Verified"];
    verified = verifiedKeywords.some(kw => contextText.includes(kw));
  }

  // 3. Date Extraction
  if (!date) {
    const dateMatch = contextText.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4})/) ||
      contextText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) date = dateMatch[0];
  }

  // 4. Helpful Votes Heuristic
  if (!helpful && helpful !== 0) {
    const helpfulMatch = contextText.match(/(\d+)\s+(?:people\s+)?found this helpful/i);
    if (helpfulMatch) helpful = parseInt(helpfulMatch[1]);
  }

  // 5. Reviewer Name Heuristic
  if (!reviewer) {
    if (clone.childElementCount < 20) {
      // Search in clean clone
      const possibleName = clone.querySelector('[class*="name" i], [class*="user" i], [class*="author" i], strong, b');
      if (possibleName && possibleName.innerText && possibleName.innerText.length > 2 && possibleName.innerText.length < 30) {
        // Avoid obvious false positives
        const badNames = ["verified", "certified", "review", "stars", "rating", "buy"];
        if (!badNames.some(bn => possibleName.innerText.toLowerCase().includes(bn))) {
          reviewer = possibleName.innerText.trim();
        }
      }
    }
  }

  // Calibrate: Disable Verified Purchase for Myntra (No reliable badge exposed in current UI)
  if (window.location.hostname.includes("myntra")) {
    verified = false;
  }

  const data = { rating, verified, date, helpful, reviewer };

  // Debug Log for Myntra Metadata
  if (window.location.hostname.includes("myntra")) {
    console.log("Clean Myntra Metadata:", data);
  }

  return data;
}

/**
 * Normalizer
 */
function normalizeReview(element, source, siteKey = null) {
  return {
    element: element,
    text: element.innerText.trim(),
    metadata: extractMetadata(element, siteKey),
    source: source
  };
}

/**
 * Manual Mode Fallback
 */
function enableManualMode() {
  showGlobalToast("No reviews auto-detected. Please select text manually.");
  // Listeners are already active in global scope.
}


/**
 * Batch Processor
 */
function startBatchProcessing(reviewItems) {
  injectCSS();
  showGlobalToast(`AI Analyzying ${reviewItems.length} reviews...`);
  console.log(`[FakeReview-AI] Processing ${reviewItems.length} reviews...`);

  // Pre-process for Bursts (Repeated Reviewers)
  const reviewerCounts = {};
  reviewItems.forEach(item => {
    const name = item.metadata.reviewer;
    if (name) {
      reviewerCounts[name] = (reviewerCounts[name] || 0) + 1;
    }
  });

  reviewItems.forEach((item, index) => {
    // Clean Text
    let cleanText = item.text.replace(/READ MORE/g, "").trim();
    if (cleanText.length < 10) return;

    // Burst Detection
    const name = item.metadata.reviewer;
    const isBurst = name && reviewerCounts[name] > 1;

    // Prepare Payload
    const payload = {
      action: "analyzeText",
      text: cleanText,
      rating: item.metadata.rating,
      verified_purchase: item.metadata.verified,
      review_time: item.metadata.date,
      helpful_vote: item.metadata.helpful || 0,
      user_review_burst: isBurst ? 1 : 0, // Sending Int 1 for Burst
      domain: window.location.hostname
    };

    console.log("Payload Sent:", payload);

    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.error("API Error", chrome.runtime.lastError);
        return;
      }
      if (response && response.success) {
        attachBatchBadge(item.element, response.data);
      }
    });
  });
}

function attachBatchBadge(element, data) {
  const isFake = data.prediction === "Fake";
  const label = isFake ? "Fake Review" : "Genuine Review";
  const color = isFake ? "#dc2626" : "#16a34a"; // Red/Green
  const bg = isFake ? "#fee2e2" : "#dcfce7";
  const border = isFake ? "#fca5a5" : "#86efac";

  injectLabel(element, label, color, bg, border);
}

function injectLabel(textElement, label, color, bg, border) {
  if (!textElement) return;

  // Universal Container Detection (Amazon, Flipkart, Myntra)
  let container =
    textElement.closest("[data-hook='review']") ||   // Amazon
    textElement.closest(".user-review-reviewCard") || // Myntra
    textElement.closest("div.col-12-12") ||         // Flipkart (Standard)
    textElement.closest("._1AtVbE") ||              // Flipkart (Alt)
    textElement.closest("article") ||               // Generic Semantic
    textElement.parentElement;                      // Fallback

  // Specific Fallback for Flipkart Semantic Nodes
  if (!container && window.location.hostname.includes("flipkart")) {
    container = textElement.closest('div._1AtVbE') || textElement.parentElement?.parentElement;
  }

  // Safety Check
  if (!container) return;

  // Debug Injection
  if (window.location.hostname.includes("flipkart") || window.location.hostname.includes("amazon") || window.location.hostname.includes("myntra")) {
    console.log("[FakeReview-AI] Injecting badge into:", container);
  }

  // Prevent Duplicate Injection
  const old = container.querySelector('.fake-ai-badge');
  if (old) old.remove();

  // Create Badge Element
  const badge = document.createElement("span");
  badge.className = "fake-ai-badge";
  badge.innerText = label;

  // Badge Styling (Universal)
  Object.assign(badge.style, {
    display: "inline-block",
    marginTop: "6px",
    marginLeft: "8px", // Spacing from text if appended
    fontSize: "12px",
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "4px",
    color: color,
    backgroundColor: bg,
    border: `1px solid ${border}`,
    zIndex: "9999",
    position: "relative"
  });

  // Insert Logic: Try to insert after the text element first (better flow), else append to container
  if (container.contains(textElement)) {
    textElement.insertAdjacentElement('afterend', badge);
  } else {
    container.appendChild(badge);
  }
}

function showGlobalToast(msg) {
  // Use a unique ID to avoid class conflicts
  const existing = document.getElementById("fake-review-global-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "fake-review-global-toast";
  toast.innerText = msg;

  // Robust styling with !important to prevent page CSS bleeding
  toast.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: auto !important;
    height: auto !important;
    max-width: 300px !important;
    min-width: 200px !important;
    padding: 12px 16px !important;
    background: #1a1a1a !important;
    color: #ffffff !important;
    border-radius: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    z-index: 2147483647 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    display: block !important;
    line-height: 1.4 !important;
    text-align: left !important;
    margin: 0 !important;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}

function injectCSS() {
  if (document.getElementById("fake-review-style")) return;

  const style = document.createElement("style");
  style.id = "fake-review-style";
  style.innerHTML = `     .fake-review-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a1a1a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 2147483647;
      width: auto;
      max-width: 220px;
      height: auto;
      display: inline-block;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
  `;
  document.head.appendChild(style);
}

// --------------------------------------------------------------------------
// 3. MANUAL SELECTION MAGNIFIER (Restored Feature)
// --------------------------------------------------------------------------

document.addEventListener("mouseup", () => {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText || selectedText.length < 20) return;
  showManualMagnifier(selectedText);
});

function showManualMagnifier(text) {
  let btn = document.getElementById("fakeReviewManualBtn");
  if (btn) btn.remove();

  btn = document.createElement("div");
  btn.id = "fakeReviewManualBtn";
  btn.innerText = "🔎";

  // Inline styles for safety
  Object.assign(btn.style, {
    position: "absolute",
    zIndex: "2147483647",
    background: "#2563eb",
    color: "#fff",
    padding: "6px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "14px",
    width: "30px",
    height: "30px",
    textAlign: "center",
    lineHeight: "18px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
  });

  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    btn.style.top = (window.scrollY + rect.top - 40) + "px";
    btn.style.left = (window.scrollX + rect.right) + "px";
  }

  btn.onclick = (e) => {
    e.stopPropagation();
    runManualAnalysis(text);
    btn.remove();
  };

  document.body.appendChild(btn);

  // Auto-remove after 4s if not clicked
  setTimeout(() => {
    if (btn && btn.parentNode) btn.remove();
  }, 4000);
}

function runManualAnalysis(selectedText) {

  if (!selectedText || selectedText.trim().length < 5) {
    console.warn("Manual text too small");
    return;
  }

  const cleanText = selectedText.trim();

  showGlobalToast("Analyzing selection...");

  chrome.runtime.sendMessage({
    action: "analyzeText",
    text: cleanText,
    rating: 0,
    verified_purchase: 0,
    review_time: null,
    helpful_vote: 0,
    user_review_burst: 0,
    domain: window.location.hostname
  }, (response) => {

    if (chrome.runtime.lastError) {
      console.error("Manual Mode Error:", chrome.runtime.lastError);
      showGlobalToast("Analysis failed");
      return;
    }

    if (response && response.success) {
      showResultPopup(response.data);
    }
  });
}

function showResultPopup(data) {

  const old = document.getElementById("fakeManualResult");
  if (old) old.remove();

  const box = document.createElement("div");
  box.id = "fakeManualResult";

  box.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px; color: #333;">
           Analysis Result
        </div>
        <div style="margin-bottom: 8px; display: flex; align-items: center;">
           <span style="font-size: 12px; color: #666; width: 80px;">Verdict:</span>
           <span style="font-weight: 700; font-size: 14px; color: ${data.prediction === 'Fake' ? '#d32f2f' : '#2e7d32'};">
              ${data.prediction === "Fake" ? "Fake Review" : "Genuine Review"}
           </span>
        </div>
        <div style="margin-bottom: 4px; display: flex; align-items: center;">
           <span style="font-size: 12px; color: #666; width: 80px;">Confidence:</span>
           <span style="font-size: 13px; color: #333;">${data.confidence?.toFixed(1) || 0}%</span>
        </div>
        <div style="display: flex; align-items: center;">
           <span style="font-size: 12px; color: #666; width: 80px;">Risk Score:</span>
           <span style="font-size: 13px; color: #333;">${data.fake_probability?.toFixed(1) || 0}%</span>
        </div>
      </div>
  `;

  Object.assign(box.style, {
    position: "fixed",
    top: "90px",
    right: "20px",
    background: "#fff",
    color: "#111",
    padding: "12px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: "2147483647",
    fontSize: "13px",
    width: "220px"
  });

  document.body.appendChild(box);

  setTimeout(() => {
    if (box) box.remove();
  }, 5000);
}

// Restore missing helper if needed
function runCheck(text) {
  runManualAnalysis(text);
}
