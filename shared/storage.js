// Storage Helper Functions

/**
 * Get all tab statistics from storage
 * @returns {Promise<Object>} - Object containing tabStats, closedTabs, and settings
 */
export async function getAllData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['tabStats', 'closedTabs', 'settings'], (result) => {
      resolve({
        tabStats: result.tabStats || {},
        closedTabs: result.closedTabs || [],
        settings: result.settings || getDefaultSettings()
      });
    });
  });
}

/**
 * Get tab statistics only
 * @returns {Promise<Object>} - Tab statistics object
 */
export async function getTabStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get('tabStats', (result) => {
      resolve(result.tabStats || {});
    });
  });
}

/**
 * Get closed tabs history
 * @returns {Promise<Array>} - Array of closed tab objects
 */
export async function getClosedTabs() {
  return new Promise((resolve) => {
    chrome.storage.local.get('closedTabs', (result) => {
      resolve(result.closedTabs || []);
    });
  });
}

/**
 * Get settings
 * @returns {Promise<Object>} - Settings object
 */
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      resolve(result.settings || getDefaultSettings());
    });
  });
}

/**
 * Update settings
 * @param {Object} newSettings - New settings to merge
 * @returns {Promise<void>}
 */
export async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: updatedSettings }, resolve);
  });
}

/**
 * Clear all statistics (but keep settings)
 * @returns {Promise<void>}
 */
export async function clearAllStats() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 
      tabStats: {},
      closedTabs: []
    }, resolve);
  });
}

/**
 * Get default settings
 * @returns {Object} - Default settings object
 */
function getDefaultSettings() {
  return {
    trackingEnabled: true,
    dataRetentionDays: 30,
    inactivityThresholdDays: 7,
    showNotifications: true,
    autoCloseEnabled: false
  };
}

/**
 * Export data as JSON
 * @returns {Promise<string>} - JSON string of all data
 */
export async function exportData() {
  const data = await getAllData();
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON
 * @param {string} jsonData - JSON string to import
 * @returns {Promise<boolean>} - Success status
 */
export async function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve(true);
      });
    });
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}

