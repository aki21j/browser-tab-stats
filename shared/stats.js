// Statistics Calculation Functions

import { extractDomain, groupBy } from './utils.js';

/**
 * Calculate Tab Health Score (0-100) for a single tab
 * Higher score = healthier tab (used recently and frequently)
 * @param {Object} tabStat - Tab statistics
 * @param {number} now - Current timestamp
 * @returns {number} - Health score 0-100
 */
export function calculateTabHealthScore(tabStat, now = Date.now()) {
  if (!tabStat) return 0;
  
  // Factors:
  // 1. Recency (when was it last accessed?) - 40 points
  // 2. Frequency (how often is it used?) - 30 points
  // 3. Age appropriateness (old but unused = bad) - 30 points
  
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Recency Score (40 points max)
  // Last accessed within 1 hour = 40, within 1 day = 30, within 7 days = 15, older = 5
  const hoursSinceAccess = (now - tabStat.lastAccessedAt) / (60 * 60 * 1000);
  let recencyScore;
  if (hoursSinceAccess < 1) recencyScore = 40;
  else if (hoursSinceAccess < 24) recencyScore = 30;
  else if (hoursSinceAccess < 24 * 7) recencyScore = 15;
  else recencyScore = 5;
  
  // Frequency Score (30 points max)
  // 10+ activations = 30, 5-9 = 20, 2-4 = 10, 1 = 5
  const activations = tabStat.activationCount || 1;
  let frequencyScore;
  if (activations >= 10) frequencyScore = 30;
  else if (activations >= 5) frequencyScore = 20;
  else if (activations >= 2) frequencyScore = 10;
  else frequencyScore = 5;
  
  // Age Appropriateness Score (30 points max)
  // Newer tabs get benefit of doubt, old unused tabs penalized
  const ageInDays = (now - tabStat.createdAt) / dayMs;
  const usageRatio = activations / Math.max(ageInDays, 1); // activations per day
  let ageScore;
  if (ageInDays < 1) ageScore = 30; // New tab
  else if (usageRatio >= 1) ageScore = 30; // Used at least once per day
  else if (usageRatio >= 0.5) ageScore = 20;
  else if (usageRatio >= 0.1) ageScore = 10;
  else ageScore = 5;
  
  return Math.round(recencyScore + frequencyScore + ageScore);
}

/**
 * Calculate aggregate Tab Health for all tabs
 * @param {Object} tabStats - All tab statistics
 * @param {Array} currentTabs - Currently open tabs
 * @returns {Object} - { averageHealth, healthyCount, unhealthyCount, distribution }
 */
export function calculateOverallTabHealth(tabStats, currentTabs) {
  const now = Date.now();
  let totalScore = 0;
  let healthyCount = 0; // Score >= 50
  let unhealthyCount = 0; // Score < 50
  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  
  currentTabs.forEach(tab => {
    const tabStat = tabStats[tab.id];
    if (tabStat) {
      const score = calculateTabHealthScore(tabStat, now);
      totalScore += score;
      
      if (score >= 50) healthyCount++;
      else unhealthyCount++;
      
      if (score >= 75) distribution.excellent++;
      else if (score >= 50) distribution.good++;
      else if (score >= 25) distribution.fair++;
      else distribution.poor++;
    }
  });
  
  const count = currentTabs.length || 1;
  return {
    averageHealth: Math.round(totalScore / count),
    healthyCount,
    unhealthyCount,
    distribution,
    efficiency: Math.round((healthyCount / count) * 100)
  };
}

/**
 * Get session stats for today
 * @param {Object} sessionStats - Session stats from storage
 * @returns {Object} - { openedToday, closedToday, netChange }
 */
export function getTodaySessionStats(sessionStats) {
  const todayKey = new Date().toISOString().split('T')[0];
  const today = sessionStats?.daily?.[todayKey] || { opened: 0, closed: 0 };
  
  return {
    openedToday: today.opened,
    closedToday: today.closed,
    netChange: today.opened - today.closed
  };
}

/**
 * Get weekly trend data
 * @param {Object} sessionStats - Session stats from storage
 * @returns {Array} - Array of { date, opened, closed, net } for last 7 days
 */
export function getWeeklyTrend(sessionStats) {
  const trend = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    const dayStats = sessionStats?.daily?.[key] || { opened: 0, closed: 0 };
    
    trend.push({
      date: key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      opened: dayStats.opened,
      closed: dayStats.closed,
      net: dayStats.opened - dayStats.closed
    });
  }
  
  return trend;
}

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

