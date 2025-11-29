# Tab Stats - Smart Tab Manager 🗂️

> Because 147 tabs is too many. Track, analyze, and actually manage your browser tabs with stats, insights, and smart cleanup recommendations.

A Chrome/Brave extension that helps you understand and control your tab chaos with detailed statistics, usage insights, and intelligent recommendations.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/browser-tab-stats)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

### 📊 Comprehensive Statistics
- **Tab counts** - Total tabs and per-window breakdown
- **Age tracking** - How long each tab has been open
- **Usage frequency** - Times each tab has been accessed
- **Last access time** - When you last viewed each tab
- **Domain analysis** - Tabs grouped by website

### 🎯 Smart Recommendations
- **Inactive tabs** - Not accessed in 7+ days (configurable)
- **Duplicate detection** - Same URL open multiple times
- **Rarely used** - Old tabs with minimal interaction
- **Priority levels** - High/medium/low urgency

### 🚀 Two Interfaces

**Side Panel** (Chrome) / **Dashboard** (Brave)
- Quick access stats
- Sortable tab lists
- One-click tab management
- Real-time updates

**Full Dashboard** (Both browsers)
- Beautiful charts and visualizations
- Advanced search and filtering
- Bulk actions (close inactive, remove duplicates)
- Domain-based analysis
- Customizable settings

### 💡 Smart Actions
- Close all inactive tabs at once
- Remove duplicate tabs automatically
- Select and close specific tabs
- Export statistics as JSON

## 🚀 Quick Start

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/browser-tab-stats.git
```

2. Open Chrome/Brave and navigate to:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`

3. Enable **Developer mode** (toggle in top-right)

4. Click **Load unpacked**

5. Select the `browser-tab-stats` folder

6. Done! Click the Tab Stats icon to start

### First Use

**Chrome:** Click the icon → Side panel opens  
**Brave:** Click the icon → Dashboard opens in new tab

Browse your tabs, check recommendations, try bulk actions!

## 📖 Usage

### View Statistics
- See total tabs, windows, inactive count
- Browse tabs sorted by age, usage, or activity
- Click any tab to switch to it instantly

### Find Tabs Fast
- Search by title or URL in dashboard
- Filter by: all, inactive, rarely used, duplicates
- Sort by: age, frequency, or title

### Clean Up Tabs
1. Open dashboard → Tab List
2. Use filters to find candidates
3. Try bulk actions:
   - **Close Inactive Tabs** - Remove tabs unused for 7+ days
   - **Close Duplicates** - Keep one, remove others
   - **Close Selected** - Check specific tabs

### Analyze by Domain
- Dashboard → Domains tab
- See which sites have most tabs
- Manage all tabs from a domain at once

### Customize Settings
- Dashboard → Settings
- Change inactivity threshold (default: 7 days)
- Set data retention period (default: 30 days)
- Export your data as JSON

## 🎨 Screenshots

### Side Panel (Chrome)
Quick access to tab statistics with sortable lists and instant actions.

### Dashboard Overview
Beautiful charts showing domain distribution and tab age visualization.

### Tab Management
Advanced filtering, search, and bulk actions for efficient tab cleanup.

## 🔧 Technical Details

- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js** - Beautiful data visualizations
- **Chrome APIs** - tabs, storage, sidePanel, windows
- **Local Storage** - All data stored on your device

## 🔐 Privacy & Security

✅ **100% Local** - All data stored on your device  
✅ **No Tracking** - Zero analytics or telemetry  
✅ **No Network** - No external requests  
✅ **Open Source** - Audit the code yourself  
✅ **Minimal Permissions** - Only what's necessary  

### Required Permissions
- `tabs` - Read tab information (title, URL)
- `storage` - Store statistics locally
- `sidePanel` - Display side panel in Chrome
- `<all_urls>` - Access favicons for visual display

## 🎯 Use Cases

- **Tab Hoarders** - Finally understand your tab chaos
- **Productivity** - Close distractions, keep what matters
- **Research** - Track which tabs you actually use
- **Memory Management** - Reduce browser memory usage
- **Digital Minimalism** - Maintain a clean workspace

## 🛠️ Development

### Project Structure
```
browser-tab-stats/
├── manifest.json          # Extension configuration
├── background/            # Service worker (tab tracking)
├── sidepanel/            # Quick view interface
├── dashboard/            # Full analytics dashboard
├── shared/               # Utilities, stats, storage
├── assets/icons/         # Extension icons
└── lib/                  # Chart.js library
```

### Making Changes
1. Edit source files
2. Go to `chrome://extensions/`
3. Click reload button on Tab Stats
4. Test your changes

### Browser Support
- **Chrome 109+** ✅ (Side Panel + Full Dashboard)
- **Brave** ✅ (Dashboard only - Side Panel not supported)
- **Edge** 🔄 (Should work, untested)
- **Firefox** ❌ (Future - needs WebExtensions adaptation)

## 📝 Known Limitations

- **Initial tracking**: Tabs opened before extension install show current time as creation time (browser API limitation)
- **Incognito tabs**: Not tracked by design (privacy)
- **Chrome internal pages**: Limited tracking for `chrome://` URLs
- **Side Panel**: Only available in Chrome 114+, not in Brave

## 🗺️ Roadmap

- [ ] Firefox & Edge support
- [ ] Session management (save/restore tabs)
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Tab grouping suggestions
- [ ] Productivity insights over time
- [ ] Scheduled auto-cleanup

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Acknowledgments

- Built with Chrome Extension APIs
- Visualizations powered by [Chart.js](https://www.chartjs.org/)
- Inspired by tab management frustrations everywhere

## 📬 Support

Found a bug? Have a feature request?

- Open an issue on GitHub
- Check existing issues first
- Include browser version and error messages

---

**Made with ❤️ for better tab management**

Stop pretending you'll go back to those 47-day-old tabs. Track them, analyze them, close them. 🚀
