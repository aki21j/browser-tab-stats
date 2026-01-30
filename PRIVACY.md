# Privacy Policy for Tab Stats

**Last Updated:** January 30, 2026

## Overview

Tab Stats is a browser extension that helps you track and manage your browser tabs. We are committed to protecting your privacy.

## Data Collection

**Tab Stats does NOT collect, transmit, or share any personal data.**

All data is stored locally on your device using Chrome's `storage.local` API and never leaves your browser.

## What Data is Stored Locally

The extension stores the following information **only on your device**:

- Tab metadata (titles, URLs, window IDs)
- Tab timestamps (when opened, last accessed)
- Usage statistics (activation counts)
- Your extension settings/preferences

## Data Sharing

**We do not share any data with third parties.** 

- No analytics services
- No tracking pixels
- No external API calls
- No data transmission of any kind

## Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `tabs` | To read tab titles and URLs for statistics |
| `storage` | To save your statistics locally on your device |
| `sidePanel` | To display the side panel interface |
| `<all_urls>` | Only to fetch favicon images for visual display |

## Data Retention

- Data for open tabs is kept as long as the tab exists
- Data for closed tabs is retained based on your settings (default: 30 days)
- You can clear all data at any time via Settings → "Clear All Data"

## Open Source

Tab Stats is open source. You can review the entire codebase at:
https://github.com/aki21j/browser-tab-stats

## Contact

For privacy concerns or questions, please open an issue on GitHub:
https://github.com/aki21j/browser-tab-stats/issues

## Changes to This Policy

Any changes to this privacy policy will be reflected in this document with an updated date.
