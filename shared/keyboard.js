/**
 * Keyboard Shortcuts Manager
 * Handles global keyboard shortcuts for the extension
 */

export class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - Key combination (e.g., 'cmd+r', 'ctrl+k')
   * @param {Function} callback - Function to execute
   * @param {string} description - Description for help menu
   */
  register(key, callback, description = '') {
    const normalizedKey = this.normalizeKey(key);
    this.shortcuts.set(normalizedKey, { callback, description });
  }

  /**
   * Normalize key combination for cross-platform support
   */
  normalizeKey(key) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return key
      .toLowerCase()
      .replace('cmd', isMac ? 'meta' : 'ctrl')
      .replace('⌘', isMac ? 'meta' : 'ctrl');
  }

  /**
   * Handle keypress events
   */
  handleKeyPress(e) {
    // Build key combination string
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.metaKey) parts.push('meta');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    
    // Add the actual key
    const key = e.key.toLowerCase();
    if (!['control', 'meta', 'alt', 'shift'].includes(key)) {
      parts.push(key);
    }

    const combination = parts.join('+');
    const shortcut = this.shortcuts.get(combination);

    if (shortcut) {
      e.preventDefault();
      e.stopPropagation();
      shortcut.callback(e);
    }
  }

  /**
   * Get all registered shortcuts (for help menu)
   */
  getAll() {
    return Array.from(this.shortcuts.entries()).map(([key, data]) => ({
      key: this.formatKeyForDisplay(key),
      description: data.description
    }));
  }

  /**
   * Format key combination for display
   */
  formatKeyForDisplay(key) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return key
      .replace('meta', isMac ? '⌘' : 'Ctrl')
      .replace('ctrl', 'Ctrl')
      .replace('alt', isMac ? '⌥' : 'Alt')
      .replace('shift', '⇧')
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join(isMac ? '' : '+');
  }
}

// Global instance
export const keyboard = new KeyboardShortcuts();
