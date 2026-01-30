// Side Panel JavaScript

import { calculateStats, getInactiveTabs, getTabsByAge, getTabsByActivations, generateRecommendations } from '../shared/stats.js';
import { getAllData } from '../shared/storage.js';
import { formatDuration, formatTimestamp, getFaviconUrl, truncate } from '../shared/utils.js';

let currentTabs = [];
let tabStats = {};
let settings = {};
let currentSort = 'age-desc';

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadAndDisplayData();
  setupEventListeners();
  
  // Refresh every 30 seconds
  setInterval(loadAndDisplayData, 30000);
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await loadAndDisplayData();
  });
  
  document.getElementById('dashboard-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });
  
  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    displayTabs();
  });
}

// Load and display all data
async function loadAndDisplayData() {
  try {
    // Get data from storage
    const data = await getAllData();
    tabStats = data.tabStats;
    settings = data.settings;
    
    // Get current tabs
    currentTabs = await chrome.tabs.query({});
    
    // Calculate and display stats
    displaySummary();
    displayRecommendations();
    displayTabs();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Display summary statistics
function displaySummary() {
  const stats = calculateStats(tabStats, currentTabs);
  
  document.getElementById('total-tabs').textContent = stats.totalTabs;
  document.getElementById('total-windows').textContent = stats.totalWindows;
  
  const inactiveTabs = getInactiveTabs(tabStats, currentTabs, settings.inactivityThresholdDays || 7);
  document.getElementById('inactive-count').textContent = inactiveTabs.length;
}

// Display recommendations
function displayRecommendations() {
  const recommendations = generateRecommendations(tabStats, currentTabs, settings);
  const section = document.getElementById('recommendations-section');
  const list = document.getElementById('recommendations-list');
  
  if (recommendations.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  list.innerHTML = '';
  
  recommendations.forEach(rec => {
    const item = document.createElement('div');
    item.className = `recommendation-item priority-${rec.priority}`;
    
    item.innerHTML = `
      <div class="recommendation-message">${rec.message}</div>
      <button class="recommendation-action" data-type="${rec.type}" title="View details">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    `;
    
    item.querySelector('.recommendation-action').addEventListener('click', () => {
      handleRecommendationAction(rec);
    });
    
    list.appendChild(item);
  });
}

// Handle recommendation action
function handleRecommendationAction(recommendation) {
  // Open dashboard with specific filter
  chrome.tabs.create({ 
    url: chrome.runtime.getURL(`dashboard/dashboard.html?filter=${recommendation.type}`)
  });
}

// Display tabs list
function displayTabs() {
  const container = document.getElementById('tabs-container');
  
  if (currentTabs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📑</div>
        <div class="empty-state-message">No tabs open</div>
      </div>
    `;
    return;
  }
  
  // Sort tabs based on selection
  let sortedTabs = [...currentTabs];
  
  switch (currentSort) {
    case 'age-desc':
      sortedTabs = getTabsByAge(tabStats, currentTabs, false);
      break;
    case 'age-asc':
      sortedTabs = getTabsByAge(tabStats, currentTabs, true);
      break;
    case 'activations-desc':
      sortedTabs = getTabsByActivations(tabStats, currentTabs, false);
      break;
    case 'activations-asc':
      sortedTabs = getTabsByActivations(tabStats, currentTabs, true);
      break;
    case 'inactive':
      const inactiveTabs = getInactiveTabs(tabStats, currentTabs, settings.inactivityThresholdDays || 7);
      const inactiveIds = new Set(inactiveTabs.map(t => t.id));
      sortedTabs = [
        ...inactiveTabs,
        ...currentTabs.filter(t => !inactiveIds.has(t.id))
      ];
      break;
  }
  
  container.innerHTML = '';
  
  sortedTabs.forEach(tab => {
    const tabElement = createTabElement(tab);
    container.appendChild(tabElement);
  });
}

// Create tab element
function createTabElement(tab) {
  const div = document.createElement('div');
  div.className = 'tab-item';
  
  const tabStat = tabStats[tab.id];
  const now = Date.now();
  const age = tabStat ? formatDuration(now - tabStat.createdAt) : 'Unknown';
  const lastAccess = tabStat ? formatTimestamp(tabStat.lastAccessedAt) : 'Unknown';
  const activations = tabStat?.activationCount || 0;
  
  div.innerHTML = `
    <img class="tab-favicon" src="${getFaviconUrl(tab.url)}" alt="">
    <div class="tab-info">
      <div class="tab-title">${truncate(tab.title || 'Untitled', 50)}</div>
      <div class="tab-meta">
        <span title="Age">📅 ${age}</span>
        <span title="Last accessed">🕒 ${lastAccess}</span>
        <span title="Times accessed">👆 ${activations}×</span>
      </div>
    </div>
    <div class="tab-actions">
      <button class="tab-action-btn close-tab-btn" data-tab-id="${tab.id}">✕</button>
    </div>
  `;
  
  // Make tab clickable to switch to it
  div.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-action-btn')) {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
  
  // Close button handler
  div.querySelector('.close-tab-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    await chrome.tabs.remove(tab.id);
    await loadAndDisplayData();
  });
  
  return div;
}

