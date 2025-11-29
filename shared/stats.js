// Statistics Calculation Functions

import { extractDomain, groupBy } from './utils.js';

/**
 * Calculate comprehensive tab statistics
 * @param {Object} tabStats - Tab statistics from storage
 * @param {Array} currentTabs - Currently open tabs from chrome.tabs.query
 * @returns {Object} - Calculated statistics
 */
export function calculateStats(tabStats, currentTabs) {
  const now = Date.now();
  const stats = {
    totalTabs: currentTabs.length,
    totalWindows: 0,
    tabsByWindow: {},
    domains: {},
    oldestTab: null,
    newestTab: null,
    mostAccessedTab: null,
    leastAccessedTab: null,
    averageAge: 0,
    averageActivations: 0,
    inactiveTabs: [],
    duplicateTabs: [],
    recommendations: []
  };
  
  // Group by window
  const windowGroups = groupBy(currentTabs, 'windowId');
  stats.totalWindows = Object.keys(windowGroups).length;
  stats.tabsByWindow = Object.entries(windowGroups).map(([windowId, tabs]) => ({
    windowId: parseInt(windowId),
    count: tabs.length,
    tabs: tabs
  }));
  
  // Analyze each tab
  let totalAge = 0;
  let totalActivations = 0;
  let analyzedCount = 0;
  
  const urlMap = new Map(); // For detecting duplicates
  
  currentTabs.forEach(tab => {
    const tabStat = tabStats[tab.id];
    
    if (tabStat) {
      const age = now - tabStat.createdAt;
      const inactiveTime = now - tabStat.lastAccessedAt;
      
      totalAge += age;
      totalActivations += tabStat.activationCount || 0;
      analyzedCount++;
      
      // Track domain
      const domain = tabStat.domain || extractDomain(tab.url);
      stats.domains[domain] = (stats.domains[domain] || 0) + 1;
      
      // Track oldest tab
      if (!stats.oldestTab || age > (now - tabStats[stats.oldestTab.id]?.createdAt || 0)) {
        stats.oldestTab = { ...tab, ...tabStat, age };
      }
      
      // Track newest tab
      if (!stats.newestTab || age < (now - tabStats[stats.newestTab.id]?.createdAt || Infinity)) {
        stats.newestTab = { ...tab, ...tabStat, age };
      }
      
      // Track most accessed
      if (!stats.mostAccessedTab || tabStat.activationCount > (tabStats[stats.mostAccessedTab.id]?.activationCount || 0)) {
        stats.mostAccessedTab = { ...tab, ...tabStat };
      }
      
      // Track least accessed
      if (!stats.leastAccessedTab || tabStat.activationCount < (tabStats[stats.leastAccessedTab.id]?.activationCount || Infinity)) {
        stats.leastAccessedTab = { ...tab, ...tabStat };
      }
      
      // Detect duplicates
      if (urlMap.has(tab.url)) {
        urlMap.get(tab.url).push({ ...tab, ...tabStat });
      } else {
        urlMap.set(tab.url, [{ ...tab, ...tabStat }]);
      }
    }
  });
  
  // Calculate averages
  if (analyzedCount > 0) {
    stats.averageAge = totalAge / analyzedCount;
    stats.averageActivations = totalActivations / analyzedCount;
  }
  
  // Find duplicates
  urlMap.forEach((tabs, url) => {
    if (tabs.length > 1 && url !== 'chrome://newtab/') {
      stats.duplicateTabs.push({
        url,
        count: tabs.length,
        tabs
      });
    }
  });
  
  return stats;
}

/**
 * Get tabs that haven't been accessed in specified days
 * @param {Object} tabStats - Tab statistics from storage
 * @param {Array} currentTabs - Currently open tabs
 * @param {number} days - Number of days threshold
 * @returns {Array} - Array of inactive tabs
 */
export function getInactiveTabs(tabStats, currentTabs, days = 7) {
  const now = Date.now();
  const threshold = days * 24 * 60 * 60 * 1000;
  
  return currentTabs
    .filter(tab => {
      const tabStat = tabStats[tab.id];
      if (!tabStat) return false;
      
      const inactiveTime = now - tabStat.lastAccessedAt;
      return inactiveTime > threshold;
    })
    .map(tab => ({
      ...tab,
      ...tabStats[tab.id],
      inactiveDuration: now - tabStats[tab.id].lastAccessedAt
    }))
    .sort((a, b) => b.inactiveDuration - a.inactiveDuration);
}

/**
 * Get tabs sorted by age
 * @param {Object} tabStats - Tab statistics from storage
 * @param {Array} currentTabs - Currently open tabs
 * @param {boolean} ascending - Sort ascending (oldest first) or descending
 * @returns {Array} - Sorted array of tabs
 */
export function getTabsByAge(tabStats, currentTabs, ascending = false) {
  const now = Date.now();
  
  const tabsWithAge = currentTabs
    .map(tab => {
      const tabStat = tabStats[tab.id];
      return {
        ...tab,
        ...tabStat,
        age: tabStat ? now - tabStat.createdAt : 0
      };
    });
  
  return tabsWithAge.sort((a, b) => 
    ascending ? a.age - b.age : b.age - a.age
  );
}

/**
 * Get tabs sorted by activation count
 * @param {Object} tabStats - Tab statistics from storage
 * @param {Array} currentTabs - Currently open tabs
 * @param {boolean} ascending - Sort ascending or descending
 * @returns {Array} - Sorted array of tabs
 */
export function getTabsByActivations(tabStats, currentTabs, ascending = false) {
  const tabsWithActivations = currentTabs
    .map(tab => {
      const tabStat = tabStats[tab.id];
      return {
        ...tab,
        ...tabStat,
        activationCount: tabStat?.activationCount || 0
      };
    });
  
  return tabsWithActivations.sort((a, b) => 
    ascending ? a.activationCount - b.activationCount : b.activationCount - a.activationCount
  );
}

/**
 * Get domain statistics
 * @param {Object} tabStats - Tab statistics from storage
 * @param {Array} currentTabs - Currently open tabs
 * @returns {Array} - Array of domain statistics sorted by count
 */
export function getDomainStats(tabStats, currentTabs) {
  const domainMap = new Map();
  
  currentTabs.forEach(tab => {
    const tabStat = tabStats[tab.id];
    const domain = tabStat?.domain || extractDomain(tab.url);
    
    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        domain,
        count: 0,
        tabs: [],
        totalActivations: 0
      });
    }
    
    const domainData = domainMap.get(domain);
    domainData.count++;
    domainData.tabs.push({ ...tab, ...tabStat });
    domainData.totalActivations += tabStat?.activationCount || 0;
  });
  
  return Array.from(domainMap.values())
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate smart recommendations for tabs to close
 * @param {Object} tabStats - Tab statistics from storage
 * @param {Array} currentTabs - Currently open tabs
 * @param {Object} settings - User settings
 * @returns {Array} - Array of recommendations
 */
export function generateRecommendations(tabStats, currentTabs, settings) {
  const recommendations = [];
  const now = Date.now();
  const inactivityThreshold = (settings.inactivityThresholdDays || 7) * 24 * 60 * 60 * 1000;
  
  // Find inactive tabs
  const inactiveTabs = getInactiveTabs(tabStats, currentTabs, settings.inactivityThresholdDays || 7);
  if (inactiveTabs.length > 0) {
    recommendations.push({
      type: 'inactive',
      priority: 'high',
      message: `${inactiveTabs.length} tab${inactiveTabs.length > 1 ? 's' : ''} not accessed in ${settings.inactivityThresholdDays || 7}+ days`,
      tabs: inactiveTabs,
      action: 'close'
    });
  }
  
  // Find duplicates
  const urlMap = new Map();
  currentTabs.forEach(tab => {
    if (!urlMap.has(tab.url)) {
      urlMap.set(tab.url, []);
    }
    urlMap.get(tab.url).push({ ...tab, ...tabStats[tab.id] });
  });
  
  const duplicates = [];
  urlMap.forEach((tabs, url) => {
    if (tabs.length > 1 && url !== 'chrome://newtab/') {
      duplicates.push({ url, tabs });
    }
  });
  
  if (duplicates.length > 0) {
    const duplicateTabCount = duplicates.reduce((sum, dup) => sum + dup.tabs.length - 1, 0);
    recommendations.push({
      type: 'duplicate',
      priority: 'medium',
      message: `${duplicateTabCount} duplicate tab${duplicateTabCount > 1 ? 's' : ''} found`,
      duplicates,
      action: 'close_duplicates'
    });
  }
  
  // Find tabs that are rarely used but old
  const rarelyUsedOldTabs = currentTabs
    .filter(tab => {
      const tabStat = tabStats[tab.id];
      if (!tabStat) return false;
      
      const age = now - tabStat.createdAt;
      const activationCount = tabStat.activationCount || 0;
      
      // Old (7+ days) but accessed less than 3 times
      return age > 7 * 24 * 60 * 60 * 1000 && activationCount < 3;
    })
    .map(tab => ({ ...tab, ...tabStats[tab.id] }));
  
  if (rarelyUsedOldTabs.length > 0) {
    recommendations.push({
      type: 'rarely_used',
      priority: 'low',
      message: `${rarelyUsedOldTabs.length} old tab${rarelyUsedOldTabs.length > 1 ? 's' : ''} rarely accessed`,
      tabs: rarelyUsedOldTabs,
      action: 'review'
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

