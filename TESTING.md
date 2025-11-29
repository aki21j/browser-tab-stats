# Testing Guide

Quick checklist for testing Tab Stats extension features.

## Installation Test

- [ ] Extension loads in Chrome without errors
- [ ] Extension loads in Brave without errors
- [ ] Icon appears in toolbar
- [ ] No console errors in service worker

## Basic Functionality

### Side Panel (Chrome) / Dashboard (Brave)
- [ ] Clicking icon opens interface
- [ ] Summary statistics display correctly
- [ ] Tab list populates with current tabs
- [ ] Tab favicons load
- [ ] Clicking tab switches to it

### Statistics Accuracy
- [ ] Total tab count is correct
- [ ] Window count is correct
- [ ] Age tracking works for new tabs
- [ ] Activation count increments on tab switch
- [ ] Last access time updates

## Dashboard Features

### Overview Tab
- [ ] Domain chart displays
- [ ] Age distribution chart displays
- [ ] Summary cards show correct data
- [ ] Recommendations appear when applicable

### Tab List Tab
- [ ] Search filters tabs by title/URL
- [ ] All filter options work
- [ ] All sort options work
- [ ] Checkbox selection works
- [ ] "Select All" works
- [ ] Bulk close actions work (with confirmation)
- [ ] Individual close buttons work

### Domains Tab
- [ ] Tabs grouped by domain correctly
- [ ] Domain counts are accurate
- [ ] Can switch to tabs from list
- [ ] Can close tabs from list

### Settings Tab
- [ ] Settings load current values
- [ ] Settings save successfully
- [ ] Export data works
- [ ] Clear data works (with confirmation)

## Smart Features

### Recommendations
- [ ] Inactive tabs detected (after 7+ days)
- [ ] Duplicate tabs detected
- [ ] Rarely used tabs identified
- [ ] Priorities assigned correctly

### Bulk Actions
- [ ] Close inactive tabs works
- [ ] Close duplicates works
- [ ] Close selected works

## Edge Cases

- [ ] Works with 100+ tabs
- [ ] Chrome internal pages (chrome://) handled gracefully
- [ ] Very long tab titles truncated properly
- [ ] No favicon shows placeholder
- [ ] Closed tabs removed from list
- [ ] Browser restart preserves data

## Performance

- [ ] Interface loads quickly (< 1 second)
- [ ] No UI freezing with many tabs
- [ ] Real-time updates work smoothly
- [ ] Charts render without lag

## Quick Test Routine

1. **Install** extension
2. **Open 10-20 tabs**
3. **Click extension icon** → Interface opens
4. **Switch between tabs** → Activation counts increase
5. **Open dashboard** → Charts display
6. **Search tabs** → Filtering works
7. **Close a tab** → List updates
8. **Reload extension** → Data persists

## Known Issues

- Initial tracking shows current time for existing tabs (browser API limitation)
- Side panel only works in Chrome 114+, not in Brave
- Incognito tabs not tracked (by design)

---

**Found a bug?** Open an issue with:
- Browser version
- Steps to reproduce
- Console errors (if any)
