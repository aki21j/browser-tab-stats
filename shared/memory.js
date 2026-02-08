// Memory Estimation Module
// Uses heuristic-based estimation by injecting a lightweight script into tabs

const MEMORY_WEIGHTS = {
  base: 30,              // Base memory per tab (MB)
  perDomNode: 0.002,     // MB per DOM node
  perImage: 0.5,         // MB per image element
  perIframe: 10,         // MB per iframe
  perScript: 1,          // MB per script element
  perStylesheet: 0.5,    // MB per stylesheet
  perVideo: 50,          // MB per video element
  perAudio: 5,           // MB per audio element
  nonInjectableBase: 20  // Fallback for chrome:// etc.
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const INJECT_TIMEOUT = 5000; // 5 seconds per tab
const memoryCache = new Map();

/**
 * Self-contained function injected into tabs to gather DOM metrics.
 * Must not reference any outer scope variables.
 */
function gatherTabMetrics() {
  return {
    domNodes: document.querySelectorAll('*').length,
    images: document.querySelectorAll('img, picture, svg').length,
    iframes: document.querySelectorAll('iframe').length,
    scripts: document.querySelectorAll('script').length,
    stylesheets: document.querySelectorAll('link[rel="stylesheet"], style').length,
    videos: document.querySelectorAll('video').length,
    audios: document.querySelectorAll('audio').length
  };
}

/**
 * Apply heuristic weights to metrics to produce an MB estimate
 */
function calculateMemoryFromMetrics(metrics) {
  return MEMORY_WEIGHTS.base
    + metrics.domNodes * MEMORY_WEIGHTS.perDomNode
    + metrics.images * MEMORY_WEIGHTS.perImage
    + metrics.iframes * MEMORY_WEIGHTS.perIframe
    + metrics.scripts * MEMORY_WEIGHTS.perScript
    + metrics.stylesheets * MEMORY_WEIGHTS.perStylesheet
    + metrics.videos * MEMORY_WEIGHTS.perVideo
    + metrics.audios * MEMORY_WEIGHTS.perAudio;
}

/**
 * Check if a URL can be injected into (http, https, file protocols)
 */
function isInjectableUrl(url) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://');
}

/**
 * Race a promise against a timeout
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Script injection timed out')), ms))
  ]);
}

/**
 * Build a fallback result for a tab
 */
function fallbackResult(tabId) {
  return {
    tabId,
    estimateMB: MEMORY_WEIGHTS.nonInjectableBase,
    metrics: null,
    source: 'fallback',
    timestamp: Date.now()
  };
}

/**
 * Estimate memory for a single tab.
 * Uses cache if available and not expired.
 */
export async function estimateTabMemory(tabId, tabUrl) {
  // Check cache
  const cached = memoryCache.get(tabId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached;
  }

  // Non-injectable tabs get immediate fallback
  if (!isInjectableUrl(tabUrl)) {
    const result = fallbackResult(tabId);
    memoryCache.set(tabId, result);
    return result;
  }

  // Check that chrome.scripting is available
  if (!chrome?.scripting?.executeScript) {
    console.warn('chrome.scripting.executeScript not available');
    const result = fallbackResult(tabId);
    memoryCache.set(tabId, result);
    return result;
  }

  let estimateMB = MEMORY_WEIGHTS.nonInjectableBase;
  let metrics = null;
  let source = 'fallback';

  try {
    const results = await withTimeout(
      chrome.scripting.executeScript({
        target: { tabId },
        func: gatherTabMetrics
      }),
      INJECT_TIMEOUT
    );

    if (results && results[0] && results[0].result) {
      metrics = results[0].result;
      estimateMB = calculateMemoryFromMetrics(metrics);
      source = 'measured';
    }
  } catch (err) {
    // Tab may be crashed, suspended, timed out, or otherwise unavailable
    console.debug(`Memory estimation failed for tab ${tabId}:`, err?.message || err);
  }

  const result = {
    tabId,
    estimateMB: Math.round(estimateMB * 10) / 10,
    metrics,
    source,
    timestamp: Date.now()
  };

  memoryCache.set(tabId, result);
  return result;
}

/**
 * Estimate memory for all tabs in parallel
 */
export async function estimateAllTabsMemory(tabs) {
  const results = await Promise.allSettled(
    tabs.map(tab => estimateTabMemory(tab.id, tab.url))
  );

  const estimates = {};
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      estimates[result.value.tabId] = result.value;
    }
  });

  return estimates;
}

/**
 * Calculate aggregate memory statistics
 */
export function calculateMemoryStats(memoryEstimates) {
  const entries = Object.values(memoryEstimates);
  if (entries.length === 0) {
    return { totalMB: 0, averageMB: 0, heaviestTabId: null, heaviestMB: 0 };
  }

  let totalMB = 0;
  let heaviestTabId = null;
  let heaviestMB = 0;

  entries.forEach(entry => {
    totalMB += entry.estimateMB;
    if (entry.estimateMB > heaviestMB) {
      heaviestMB = entry.estimateMB;
      heaviestTabId = entry.tabId;
    }
  });

  return {
    totalMB: Math.round(totalMB * 10) / 10,
    averageMB: Math.round((totalMB / entries.length) * 10) / 10,
    heaviestTabId,
    heaviestMB: Math.round(heaviestMB * 10) / 10
  };
}

/**
 * Clear the memory cache (for manual refresh)
 */
export function clearMemoryCache() {
  memoryCache.clear();
}
