# Changelog

All notable changes to Tab Stats will be documented in this file.

## [1.0.0] - 2024-11-29

### 🎉 Initial Release

#### Core Features
- Tab statistics tracking (age, usage frequency, last accessed)
- Background service worker for continuous tracking
- Side panel interface (Chrome 114+)
- Full dashboard with analytics
- Local data persistence with chrome.storage

#### Statistics & Analytics
- Total tab count and per-window breakdown
- Tab age calculation and tracking
- Activation count (usage frequency)
- Domain-based grouping and analysis
- Historical data for closed tabs

#### Smart Recommendations
- Inactive tab detection (7+ days configurable)
- Duplicate tab identification
- Rarely used tab flagging
- Priority-based recommendations (high/medium/low)

#### User Interface
- **Side Panel** (Chrome): Quick access, real-time stats
- **Dashboard**: Comprehensive analytics with 4 tabs
  - Overview: Charts and key metrics
  - Tab List: Search, filter, sort, bulk actions
  - Domains: Domain-based analysis
  - Settings: User preferences

#### Management Actions
- Individual tab close
- Bulk close inactive tabs
- Bulk close duplicates
- Selective close with checkboxes
- Quick tab switching

#### Visualizations
- Domain distribution bar chart (top 10)
- Tab age distribution doughnut chart
- Summary statistics cards

#### Data Management
- Configurable data retention (1-365 days)
- Configurable inactivity threshold (1-90 days)
- Export data as JSON
- Clear all statistics option

#### Browser Support
- Chrome 109+ (full support with side panel)
- Brave (dashboard only, side panel fallback)
- Chromium-based browsers (with side panel API)

#### Technical
- Manifest V3 compliance
- Vanilla JavaScript (no dependencies)
- Chart.js for visualizations
- Modular code architecture
- Debounced operations for performance
- Real-time event-driven updates

### Privacy & Security
- All data stored locally
- No external network requests
- No tracking or analytics
- Minimal required permissions
- Open source code

### Documentation
- Comprehensive README
- Installation guide
- Quick start guide
- Detailed changelog

### Known Issues
- Initial tracking shows current time for existing tabs (browser API limitation)
- Side panel not available in Brave (API limitation)

---

## [Unreleased]

### Planned Features
- Firefox support via WebExtensions
- Microsoft Edge compatibility testing
- Session management (save/restore tabs)
- Keyboard shortcuts
- Dark mode / custom themes
- Tab grouping suggestions
- Productivity insights over time
- Scheduled auto-cleanup
- More chart types
- Tab preview on hover

### Potential Improvements
- Pagination for 500+ tabs
- Virtual scrolling optimization
- More granular filtering options
- Undo for bulk actions
- CSV export format
- Bookmark integration

---

## Version History

- **1.0.0** (2024-11-29): Initial release

---

**Note**: This project follows [Semantic Versioning](https://semver.org/).
