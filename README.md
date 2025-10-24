# Site Blocker - Browser Extension

A powerful browser extension that helps you stay focused and productive by blocking distracting websites with an intelligent delay-based system.
![Version](https://img.shields.io/badge/Version-1.0-blue) ![Platform](https://img.shields.io/badge/Platform-Chrome%20Extension-orange) ![Manifest](https://img.shields.io/badge/Manifest-V3-green)
## 🌟 Features

### Smart Blocking System
- **🟢 Enabled**: Website is blocked - shows custom blocked page
- **🟡 Disabled with Delay**: 60-second countdown before unblocking with visual timer
- **🔴 Fully Disabled**: Website is accessible

### Advanced Functionality
- **Real-time Countdown**: Live timer updates across all tabs
- **Subdomain Support**: Blocks all subdomains automatically (e.g., ru.youtube.com for youtube.com)
- **Multi-tab Synchronization**: Status updates propagate to all open tabs
- **Persistent Timers**: Countdowns continue even after browser restart
- **Auto-reload**: Pages automatically refresh when unblocked

### User Interface
- Clean popup interface with real-time controls
- Visual status indicators (color-coded badges)
- Live countdown timers for delayed unblocking
- Quick add/remove functionality
- Statistics dashboard showing blocking status
- **🌐 Multi-language Support**: English and Russian localization

### Technical Features
- Content script injection for custom blocking pages
- Chrome storage API for data persistence
- Cross-tab messaging for real-time updates
- Background service worker for timer management
- Local storage - no data collection or tracking

## 🚀 Installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **"Developer mode"** in the top-right corner
4. Click **"Load unpacked"** and select the extension folder
5. The extension icon will appear in your toolbar

### File Structure

- **manifest.json**
- **popup.html**
- **popup.js**
- **background.js**
- **styles.css**
- **_locales/** (Localization files)
  - **en/** (English)
    - **messages.json**
  - **ru/** (Russian)
    - **messages.json**
- **icons/**
  - 🟢 **icon48.png**


## 📖 How to Use

### Adding Websites
1. Click the extension icon in the toolbar
2. Enter a domain name (e.g., `youtube.com`, `facebook.com`)
3. Click **"Add Site"** or press Enter

### Managing Blocking
- **Toggle Switch**: Click to enable/disable blocking
- **Status Badges**:
  - 🟢 **"on"** - Website is blocked (shows blocked page)
  - 🟡 **"60s"** - Countdown to unblocking (shows timer)
  - 🔴 **"off"** - Website is accessible
- **Remove Button** (×): Delete website from list

### Blocking Behavior
- **Enabled**: Shows custom blocked page with information
- **Disabled with Delay**: Shows countdown page with progress bar
- **Fully Disabled**: Website loads normally
- **Subdomains**: All subdomains are automatically blocked/unblocked with main domain

### Language Selection
- Use the dropdown in the popup to switch between English and Russian
- Interface text updates immediately
- Settings are saved for future sessions

## 🛠 Technical Details

### Architecture
- **Background Script**: Manages timers, storage, and cross-tab communication
- **Content Script**: Injects blocking pages and handles real-time updates
- **Popup Interface**: Provides user controls and site management
- **Service Worker**: Handles background operations and persistence

### Key Components
- `background.js` - Core logic, timer management, storage operations
- `content.js` - Page blocking, countdown display, real-time updates
- `popup.js` - User interface, site management, localization
- `blocked-page.js` - Countdown timer for delayed unblocking pages

### APIs Used
- `chrome.storage` - Settings persistence
- `chrome.tabs` - Tab management and messaging
- `chrome.runtime` - Extension communication
- `chrome.i18n` - Internationalization

### Data Storage
- All data stored locally in Chrome sync storage
- Sites list with domains, enabled status, and timer information
- Language preferences
- No external servers or data collection

## 🔧 Development

### Adding New Languages
1. Create new directory in `_locales/` (e.g., `es` for Spanish)
2. Add `messages.json` with translated strings following the existing format
3. Update language selector in `popup.html` and `popup.js`
4. Test localization in browser

### Key Functions
- `disableSiteWithDelay()` - Implements 60-second delay with countdown
- `enableSite()` - Immediately blocks site
- `completeSiteDelay()` - Finalizes unblocking process
- `updateCountdownInTabs()` - Synchronizes timers across tabs
- `initializeTimers()` - Restores timers on extension startup

### Message Types
- `toggleSite` - Enable/disable site blocking
- `updateCountdown` - Update countdown timer display
- `siteBlocked`/`siteUnblocked` - Notify tabs of status changes
- `getSiteStatus` - Retrieve current blocking status

## 📝 License

This project is open source and available under the MIT License.

## 🐛 Troubleshooting

### Common Issues
- **Websites not blocking**: Verify domain format and refresh page
- **Timer not updating**: Check if multiple tabs are open for the same domain
- **Settings not saving**: Verify Chrome sync storage permissions
- **Extension not loading**: Check Chrome version supports Manifest V3

### Performance Notes
- Timers are efficiently managed with `setInterval`/`setTimeout`
- Cross-tab messaging is optimized to only affect relevant domains
- Storage operations are asynchronous to prevent UI blocking

---

**Developed with AI assistance from DeepSeek** 🤖

*Take control of your browsing habits and boost your productivity with intelligent website blocking!*