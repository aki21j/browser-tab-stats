// Dashboard JavaScript

import { calculateStats, getInactiveTabs, getTabsByAge, getTabsByActivations, getDomainStats, generateRecommendations, calculateOverallTabHealth, getTodaySessionStats, getWeeklyTrend } from '../shared/stats.js';
import { getAllData, updateSettings, clearAllStats, exportData } from '../shared/storage.js';
import { formatDuration, formatTimestamp, getFaviconUrl, truncate, groupBy, debounce } from '../shared/utils.js';
import { keyboard } from '../shared/keyboard.js';

let currentTabs = [];
let tabStats = {};
let closedTabs = [];
let settings = {};
let sessionStats = {};
let selectedTabIds = new Set();
let currentFilter = 'all';
let currentSort = 'age-desc';
let searchQuery = '';

// Charts
let domainChart = null;
let trendChart = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  setupTabNavigation();
  setupKeyboardShortcuts();
  displayOverview();
  
  // Check for filter parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam) {
    switchTab('tabs-list');
    document.getElementById('filter-select').value = filterParam;
    currentFilter = filterParam;
    displayTabsList();
  }
});

// Load data from storage and Chrome APIs
async function loadData() {
  const data = await getAllData();
  tabStats = data.tabStats;
  closedTabs = data.closedTabs;
  settings = data.settings;
  sessionStats = data.sessionStats;
  
  currentTabs = await chrome.tabs.query({});
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  // Refresh
  keyboard.register('cmd+r', () => {
    document.getElementById('refresh-btn').click();
  }, 'Refresh statistics');

  // Export
  keyboard.register('cmd+e', () => {
    document.getElementById('export-btn').click();
  }, 'Export data');

  // Tab navigation
  keyboard.register('cmd+1', () => switchTab('overview'), 'Go to Overview');
  keyboard.register('cmd+2', () => switchTab('tabs-list'), 'Go to Tab List');
  keyboard.register('cmd+3', () => switchTab('domains'), 'Go to Domains');
  keyboard.register('cmd+4', () => switchTab('settings'), 'Go to Settings');

  // Search focus
  keyboard.register('cmd+k', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      switchTab('tabs-list');
      setTimeout(() => searchInput.focus(), 100);
    }
  }, 'Focus search');

  // Help menu
  keyboard.register('cmd+/', () => showKeyboardHelp(), 'Show keyboard shortcuts');
}

// Show keyboard shortcuts help
function showKeyboardHelp() {
  const shortcuts = keyboard.getAll();
  const helpText = shortcuts.map(s => `${s.key}: ${s.description}`).join('\n');
  alert(`Keyboard Shortcuts:\n\n${helpText}`);
}

// Setup event listeners
function setupEventListeners() {
  // Header actions
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await loadData();
    refreshCurrentView();
  });
  
  document.getElementById('export-btn').addEventListener('click', async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tab-stats-${Date.now()}.json`;
    a.click();
  });
  
  // Tabs list controls
  document.getElementById('search-input').addEventListener('input', debounce((e) => {
    searchQuery = e.target.value.toLowerCase();
    displayTabsList();
  }, 300));
  
  document.getElementById('filter-select').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    displayTabsList();
  });
  
  document.getElementById('tabs-sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    displayTabsList();
  });
  
  // Bulk actions
  document.getElementById('close-inactive-btn').addEventListener('click', async () => {
    const inactiveTabs = getInactiveTabs(tabStats, currentTabs, settings.inactivityThresholdDays || 7);
    if (confirm(`Close ${inactiveTabs.length} inactive tabs?`)) {
      await closeMultipleTabs(inactiveTabs.map(t => t.id));
    }
  });
  
  document.getElementById('close-duplicates-btn').addEventListener('click', async () => {
    const duplicates = findDuplicates();
    if (duplicates.length > 0 && confirm(`Close ${duplicates.length} duplicate tabs?`)) {
      await closeMultipleTabs(duplicates);
    }
  });
  
  document.getElementById('close-selected-btn').addEventListener('click', async () => {
    if (selectedTabIds.size > 0 && confirm(`Close ${selectedTabIds.size} selected tabs?`)) {
      await closeMultipleTabs(Array.from(selectedTabIds));
    }
  });
  
  // Settings
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('clear-data-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all tab statistics? This cannot be undone.')) {
      await clearAllStats();
      await loadData();
      refreshCurrentView();
      alert('All statistics have been cleared.');
    }
  });
}

// Setup tab navigation
function setupTabNavigation() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });
}

// Switch between main tabs
function switchTab(tabName) {
  // Update button states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Update content visibility
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Load appropriate content
  switch (tabName) {
    case 'overview':
      displayOverview();
      break;
    case 'tabs-list':
      displayTabsList();
      break;
    case 'domains':
      displayDomains();
      break;
    case 'settings':
      displaySettings();
      break;
  }
}

// Refresh current view
function refreshCurrentView() {
  const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
  switchTab(activeTab);
}

// Display Overview Tab
function displayOverview() {
  const stats = calculateStats(tabStats, currentTabs);
  const healthStats = calculateOverallTabHealth(tabStats, currentTabs);
  const todayStats = getTodaySessionStats(sessionStats);
  
  // Primary stats
  document.getElementById('overview-total-tabs').textContent = stats.totalTabs;
  document.getElementById('overview-windows').textContent = stats.totalWindows;
  document.getElementById('overview-health-score').textContent = healthStats.averageHealth;
  document.getElementById('overview-efficiency').textContent = `${healthStats.efficiency}%`;
  
  // Session stats (Today's Activity)
  document.getElementById('overview-opened-today').textContent = todayStats.openedToday;
  document.getElementById('overview-closed-today').textContent = todayStats.closedToday;
  
  const netChangeEl = document.getElementById('overview-net-change');
  const netChange = todayStats.netChange;
  netChangeEl.textContent = netChange >= 0 ? `+${netChange}` : netChange;
  netChangeEl.className = `stat-value stat-value-small ${netChange > 0 ? 'positive' : netChange < 0 ? 'negative' : ''}`;
  
  // Duplicates count
  const duplicateCount = stats.duplicateTabs.reduce((sum, d) => sum + d.count - 1, 0);
  document.getElementById('overview-duplicates').textContent = duplicateCount;
  
  // Oldest tab insight
  if (stats.oldestTab) {
    const ageInDays = Math.floor(stats.oldestTab.age / (24 * 60 * 60 * 1000));
    document.getElementById('oldest-tab-age').textContent = ageInDays > 0 ? `${ageInDays}d` : formatDuration(stats.oldestTab.age);
    document.getElementById('oldest-tab-title').textContent = stats.oldestTab.title || 'Unknown';
  }
  
  // Top domain insight
  const topDomain = Object.entries(stats.domains).sort((a, b) => b[1] - a[1])[0];
  if (topDomain) {
    document.getElementById('top-domain-count').textContent = `${topDomain[1]} tabs`;
    document.getElementById('top-domain-name').textContent = topDomain[0];
  }
  
  // Display recommendations
  displayOverviewRecommendations();
  
  // Create charts
  createDomainChart(stats);
  createTrendChart();
}

// Display recommendations in overview
function displayOverviewRecommendations() {
  const recommendations = generateRecommendations(tabStats, currentTabs, settings);
  const container = document.getElementById('overview-recommendations');
  
  if (recommendations.length === 0) {
    container.innerHTML = '<p style="color: #5f6368;">No recommendations at this time. Your tabs are well managed!</p>';
    return;
  }
  
  container.innerHTML = '';
  
  recommendations.forEach(rec => {
    const card = document.createElement('div');
    card.className = `recommendation-card priority-${rec.priority}`;
    
    const tabCount = rec.tabs?.length || rec.duplicates?.reduce((sum, d) => sum + d.tabs.length - 1, 0) || 0;
    
    card.innerHTML = `
      <div class="recommendation-info">
        <h4>${rec.message}</h4>
        <p>${tabCount} tab${tabCount !== 1 ? 's' : ''} affected</p>
      </div>
      <button class="btn btn-secondary" onclick="viewRecommendation('${rec.type}')">View</button>
    `;
    
    container.appendChild(card);
  });
}

// View recommendation (global function for onclick)
window.viewRecommendation = function(type) {
  switchTab('tabs-list');
  document.getElementById('filter-select').value = type === 'inactive' ? 'inactive' : type === 'duplicate' ? 'duplicates' : 'rarely-used';
  currentFilter = document.getElementById('filter-select').value;
  displayTabsList();
};

// Create domain chart
function createDomainChart(stats) {
  const canvas = document.getElementById('domain-chart');
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  if (domainChart) {
    domainChart.destroy();
  }
  
  // Get top 10 domains
  const domainData = Object.entries(stats.domains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  domainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: domainData.map(d => d[0]),
      datasets: [{
        label: 'Number of Tabs',
        data: domainData.map(d => d[1]),
        backgroundColor: '#8B5CF6',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Create age distribution chart
function createTrendChart() {
  const canvas = document.getElementById('trend-chart');
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  if (trendChart) {
    trendChart.destroy();
  }
  
  const weeklyTrend = getWeeklyTrend(sessionStats);
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeklyTrend.map(d => d.day),
      datasets: [
        {
          label: 'Opened',
          data: weeklyTrend.map(d => d.opened),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Closed',
          data: weeklyTrend.map(d => d.closed),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Display Tabs List Tab
function displayTabsList() {
  let filteredTabs = [...currentTabs];
  
  // Apply filter
  switch (currentFilter) {
    case 'inactive':
      filteredTabs = getInactiveTabs(tabStats, currentTabs, settings.inactivityThresholdDays || 7);
      break;
    case 'rarely-used':
      filteredTabs = currentTabs.filter(tab => {
        const tabStat = tabStats[tab.id];
        return tabStat && (tabStat.activationCount || 0) < 3;
      });
      break;
    case 'duplicates':
      const duplicateIds = new Set(findDuplicates());
      filteredTabs = currentTabs.filter(tab => duplicateIds.has(tab.id));
      break;
  }
  
  // Apply search
  if (searchQuery) {
    filteredTabs = filteredTabs.filter(tab => {
      const title = (tab.title || '').toLowerCase();
      const url = (tab.url || '').toLowerCase();
      return title.includes(searchQuery) || url.includes(searchQuery);
    });
  }
  
  // Apply sort
  filteredTabs = sortTabs(filteredTabs, currentSort);
  
  // Render table
  renderTabsTable(filteredTabs);
}

// Sort tabs
function sortTabs(tabs, sortType) {
  switch (sortType) {
    case 'age-desc':
      return getTabsByAge(tabStats, tabs, false);
    case 'age-asc':
      return getTabsByAge(tabStats, tabs, true);
    case 'activations-desc':
      return getTabsByActivations(tabStats, tabs, false);
    case 'activations-asc':
      return getTabsByActivations(tabStats, tabs, true);
    case 'title':
      return tabs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    default:
      return tabs;
  }
}

// Render tabs table
function renderTabsTable(tabs) {
  const container = document.getElementById('tabs-table-container');
  
  if (tabs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No tabs found</div>
        <div class="empty-state-message">Try adjusting your filters or search query</div>
      </div>
    `;
    return;
  }
  
  const now = Date.now();
  
  const tableHTML = `
    <table class="tabs-table">
      <thead>
        <tr>
          <th><input type="checkbox" id="select-all-checkbox"></th>
          <th>Tab</th>
          <th>Domain</th>
          <th>Age</th>
          <th>Last Access</th>
          <th>Activations</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${tabs.map(tab => {
          const tabStat = tabStats[tab.id];
          const age = tabStat ? formatDuration(now - tabStat.createdAt) : 'Unknown';
          const lastAccess = tabStat ? formatTimestamp(tabStat.lastAccessedAt) : 'Unknown';
          const activations = tabStat?.activationCount || 0;
          const domain = tabStat?.domain || 'unknown';
          
          return `
            <tr data-tab-id="${tab.id}">
              <td><input type="checkbox" class="tab-row-checkbox" data-tab-id="${tab.id}"></td>
              <td>
                <img class="tab-row-favicon" src="${getFaviconUrl(tab.url)}" alt="">
                <span class="tab-row-title" data-tab-id="${tab.id}">${truncate(tab.title || 'Untitled', 60)}</span>
              </td>
              <td class="tab-row-domain">${domain}</td>
              <td>${age}</td>
              <td>${lastAccess}</td>
              <td>${activations}</td>
              <td><button class="tab-row-action" data-tab-id="${tab.id}">Close</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = tableHTML;
  
  // Setup event listeners
  document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
    document.querySelectorAll('.tab-row-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
      if (e.target.checked) {
        selectedTabIds.add(parseInt(cb.dataset.tabId));
      } else {
        selectedTabIds.delete(parseInt(cb.dataset.tabId));
      }
    });
    updateSelectedCount();
  });
  
  document.querySelectorAll('.tab-row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const tabId = parseInt(e.target.dataset.tabId);
      if (e.target.checked) {
        selectedTabIds.add(tabId);
      } else {
        selectedTabIds.delete(tabId);
      }
      updateSelectedCount();
    });
  });
  
  document.querySelectorAll('.tab-row-title').forEach(title => {
    title.addEventListener('click', async (e) => {
      const tabId = parseInt(e.target.dataset.tabId);
      const tab = currentTabs.find(t => t.id === tabId);
      if (tab) {
        await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    });
  });
  
  document.querySelectorAll('.tab-row-action').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tabId = parseInt(e.target.dataset.tabId);
      await chrome.tabs.remove(tabId);
      await loadData();
      displayTabsList();
    });
  });
}

// Update selected count
function updateSelectedCount() {
  const btn = document.getElementById('close-selected-btn');
  btn.textContent = `Close Selected (${selectedTabIds.size})`;
  btn.disabled = selectedTabIds.size === 0;
}

// Find duplicate tabs
function findDuplicates() {
  const urlMap = new Map();
  currentTabs.forEach(tab => {
    if (!urlMap.has(tab.url)) {
      urlMap.set(tab.url, []);
    }
    urlMap.get(tab.url).push(tab.id);
  });
  
  const duplicateIds = [];
  urlMap.forEach((tabIds, url) => {
    if (tabIds.length > 1 && url !== 'chrome://newtab/') {
      // Keep the first one, mark others as duplicates
      duplicateIds.push(...tabIds.slice(1));
    }
  });
  
  return duplicateIds;
}

// Close multiple tabs
async function closeMultipleTabs(tabIds) {
  await chrome.tabs.remove(tabIds);
  await loadData();
  selectedTabIds.clear();
  refreshCurrentView();
}

// Display Domains Tab
function displayDomains() {
  const domainStats = getDomainStats(tabStats, currentTabs);
  const container = document.getElementById('domains-list');
  
  if (domainStats.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌐</div>
        <div class="empty-state-title">No domains found</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  
  domainStats.forEach(domain => {
    const card = document.createElement('div');
    card.className = 'domain-card';
    
    card.innerHTML = `
      <div class="domain-header">
        <div class="domain-name">${domain.domain}</div>
        <div class="domain-count">${domain.count} tab${domain.count !== 1 ? 's' : ''}</div>
      </div>
      <div class="domain-tabs">
        ${domain.tabs.map(tab => `
          <div class="domain-tab-item">
            <span class="domain-tab-title" data-tab-id="${tab.id}">${truncate(tab.title || 'Untitled', 60)}</span>
            <button class="tab-row-action" data-tab-id="${tab.id}">Close</button>
          </div>
        `).join('')}
      </div>
    `;
    
    container.appendChild(card);
  });
  
  // Setup event listeners
  document.querySelectorAll('.domain-tab-title').forEach(title => {
    title.addEventListener('click', async (e) => {
      const tabId = parseInt(e.target.dataset.tabId);
      const tab = currentTabs.find(t => t.id === tabId);
      if (tab) {
        await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    });
  });
  
  document.querySelectorAll('.tab-row-action').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tabId = parseInt(e.target.dataset.tabId);
      await chrome.tabs.remove(tabId);
      await loadData();
      displayDomains();
    });
  });
}

// Display Settings Tab
function displaySettings() {
  document.getElementById('tracking-enabled').checked = settings.trackingEnabled !== false;
  document.getElementById('data-retention').value = settings.dataRetentionDays || 30;
  document.getElementById('inactivity-threshold').value = settings.inactivityThresholdDays || 7;
  document.getElementById('show-notifications').checked = settings.showNotifications !== false;
}

// Save settings
async function saveSettings() {
  const newSettings = {
    trackingEnabled: document.getElementById('tracking-enabled').checked,
    dataRetentionDays: parseInt(document.getElementById('data-retention').value),
    inactivityThresholdDays: parseInt(document.getElementById('inactivity-threshold').value),
    showNotifications: document.getElementById('show-notifications').checked
  };
  
  await updateSettings(newSettings);
  settings = newSettings;
  alert('Settings saved successfully!');
}

