// Background Service Worker for Tab Stats Extension
// Tracks tab lifecycle events and persists statistics

console.log('Tab Stats service worker started');

// Get today's date key for session tracking
function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // "2024-01-15"
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Tab Stats extension installed');
  
  // Initialize storage structure
  await initializeStorage();
  
  // Track all existing tabs
  await trackExistingTabs();
});

// Initialize storage with default settings
async function initializeStorage() {
  const result = await chrome.storage.local.get(['settings', 'tabStats', 'sessionStats']);
  
  if (!result.settings) {
    await chrome.storage.local.set({
      settings: {
        trackingEnabled: true,
        dataRetentionDays: 30,
        inactivityThresholdDays: 7
      }
    });
  }
  
  if (!result.tabStats) {
    await chrome.storage.local.set({ tabStats: {} });
  }
  
  // Initialize session stats tracking
  if (!result.sessionStats) {
    await chrome.storage.local.set({ 
      sessionStats: {
        daily: {} // { "2024-01-15": { opened: 5, closed: 3 } }
      }
    });
  }
}

// Update daily session stats
async function updateSessionStats(action) {
  const todayKey = getTodayKey();
  const { sessionStats = { daily: {} } } = await chrome.storage.local.get('sessionStats');
  
  if (!sessionStats.daily[todayKey]) {
    sessionStats.daily[todayKey] = { opened: 0, closed: 0 };
  }
  
  if (action === 'opened') {
    sessionStats.daily[todayKey].opened++;
  } else if (action === 'closed') {
    sessionStats.daily[todayKey].closed++;
  }
  
  // Keep only last 30 days of session stats
  const keys = Object.keys(sessionStats.daily).sort();
  if (keys.length > 30) {
    const keysToRemove = keys.slice(0, keys.length - 30);
    keysToRemove.forEach(key => delete sessionStats.daily[key]);
  }
  
  await chrome.storage.local.set({ sessionStats });
}

// Track all currently open tabs on startup
async function trackExistingTabs() {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  
  for (const tab of tabs) {
    await trackTabCreation(tab, now);
  }
}

// Track when a new tab is created
chrome.tabs.onCreated.addListener(async (tab) => {
  await trackTabCreation(tab, Date.now());
  await updateSessionStats('opened');
});

// Track when a tab is activated (user switches to it)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await trackTabActivation(tab, Date.now());
});

// Track when a tab is updated (URL change, title change, etc.)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title) {
    await trackTabUpdate(tab, Date.now());
  }
});

// Track when a tab is removed
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  await trackTabRemoval(tabId, Date.now());
  await updateSessionStats('closed');
});

// Helper functions for tracking
async function trackTabCreation(tab, timestamp) {
  const { tabStats } = await chrome.storage.local.get('tabStats');
  
  tabStats[tab.id] = {
    id: tab.id,
    url: tab.url || '',
    title: tab.title || 'New Tab',
    windowId: tab.windowId,
    createdAt: timestamp,
    lastAccessedAt: timestamp,
    activationCount: 1,
    domain: extractDomain(tab.url || '')
  };
  
  await chrome.storage.local.set({ tabStats });
}

async function trackTabActivation(tab, timestamp) {
  const { tabStats } = await chrome.storage.local.get('tabStats');
  
  if (tabStats[tab.id]) {
    tabStats[tab.id].lastAccessedAt = timestamp;
    tabStats[tab.id].activationCount = (tabStats[tab.id].activationCount || 0) + 1;
  } else {
    // Tab wasn't tracked yet, create entry
    await trackTabCreation(tab, timestamp);
    return;
  }
  
  await chrome.storage.local.set({ tabStats });
}

async function trackTabUpdate(tab, timestamp) {
  const { tabStats } = await chrome.storage.local.get('tabStats');
  
  if (tabStats[tab.id]) {
    tabStats[tab.id].url = tab.url || tabStats[tab.id].url;
    tabStats[tab.id].title = tab.title || tabStats[tab.id].title;
    tabStats[tab.id].domain = extractDomain(tab.url || '');
  } else {
    // Tab wasn't tracked yet, create entry
    await trackTabCreation(tab, timestamp);
    return;
  }
  
  await chrome.storage.local.set({ tabStats });
}

async function trackTabRemoval(tabId, timestamp) {
  const { tabStats, closedTabs = [] } = await chrome.storage.local.get(['tabStats', 'closedTabs']);
  
  if (tabStats[tabId]) {
    // Move to closed tabs history
    const closedTab = {
      ...tabStats[tabId],
      closedAt: timestamp
    };
    
    closedTabs.push(closedTab);
    
    // Clean up old closed tabs (keep only recent ones based on retention policy)
    const { settings } = await chrome.storage.local.get('settings');
    const retentionMs = (settings?.dataRetentionDays || 30) * 24 * 60 * 60 * 1000;
    const cutoffTime = timestamp - retentionMs;
    
    const filteredClosedTabs = closedTabs.filter(tab => tab.closedAt > cutoffTime);
    
    // Remove from active stats
    delete tabStats[tabId];
    
    await chrome.storage.local.set({ 
      tabStats,
      closedTabs: filteredClosedTabs
    });
  }
}

// Extract domain from URL
function extractDomain(url) {
  if (!url) return 'unknown';
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked');
  
  // Try to open side panel (Chrome 114+)
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log('Side panel opened');
    } catch (error) {
      console.log('Side panel not supported, opening dashboard instead:', error);
      // Fallback: Open dashboard in new tab
      await chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard/dashboard.html')
      });
    }
  } else {
    // Fallback for browsers without side panel support (like Brave)
    console.log('Side panel API not available, opening dashboard');
    await chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/dashboard.html')
    });
  }
});

// Listen for messages from UI components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabStats') {
    chrome.storage.local.get(['tabStats', 'closedTabs', 'settings'], (result) => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'refreshStats') {
    trackExistingTabs().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'openSidePanel') {
    // Handle request to open side panel from UI
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        if (chrome.sidePanel && chrome.sidePanel.open) {
          try {
            await chrome.sidePanel.open({ windowId: tabs[0].windowId });
            sendResponse({ success: true, method: 'sidePanel' });
          } catch (error) {
            await chrome.tabs.create({
              url: chrome.runtime.getURL('sidepanel/sidepanel.html')
            });
            sendResponse({ success: true, method: 'newTab' });
          }
        } else {
          await chrome.tabs.create({
            url: chrome.runtime.getURL('sidepanel/sidepanel.html')
          });
          sendResponse({ success: true, method: 'newTab' });
        }
      }
    });
    return true;
  }
});

