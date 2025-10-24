# Site Blocker - Browser Extension

A powerful browser extension that helps you stay focused and productive by blocking distracting websites with an intelligent delay-based system.

![Version](https://img.shields.io/badge/Version-1.0-blue) ![Platform](https://img.shields.io/badge/Platform-Chrome%20Extension-orange) ![Manifest](https://img.shields.io/badge/Manifest-V3-green)

## 🌟 Features

### Smart Blocking System
- **🟢 Enabled**: Immediate website blocking
- **🟡 Disabled with Delay**: 60-second countdown before unblocking
- **🔴 Fully Disabled**: Complete website accessibility

### User Interface
- Clean popup interface with real-time controls
- Visual status indicators (color-coded badges)
- Live countdown timers for delayed unblocking
- Quick add/remove functionality
- Statistics dashboard showing blocking status
- **🌐 Multi-language Support**: English and Russian localization

### Technical Features
- Network-level blocking using Chrome's declarativeNetRequest API
- No custom pages - shows standard browser errors
- Settings synchronization across browser instances
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
  - 🟢 **"on"** - Website is blocked
  - 🟡 **"60s"** - Countdown to unblocking
  - 🔴 **"off"** - Website is accessible
- **Remove Button** (×): Delete website from list

### Language Selection
- The extension automatically detects your browser language
- Supports English (default) and Russian
- Manual language switching available in extension settings

### Blocking Behavior
- **Enabled**: Website loads with browser network error
- **Disabled**: 60-second delay, then website becomes accessible
- **During Countdown**: Toggle is disabled until countdown completes

## 🛠 Technical Details

### APIs Used
- `declarativeNetRequest` - Network-level blocking
- `storage` - Settings persistence
- `host_permissions` - Website access
- `i18n` - Internationalization and localization

### Localization Implementation
- Chrome i18n API for string localization
- Fallback to English for unsupported languages
- Easy to add new languages by creating additional message files

### Blocking Rules
- Blocks main frame and sub-resources
- Works on all URL schemes (HTTP/HTTPS)
- Includes subdomains automatically

### Data Storage
- All data stored locally in Chrome sync storage
- No external servers or data collection
- Complete privacy protection

## 🔧 Development

### Code Structure
- **Popup Interface**: `popup.html`, `popup.js`, `styles.css`
- **Background Service**: `background.js`
- **Manifest**: `manifest.json` (Manifest V3)
- **Localization**: `_locales/` directory with language-specific message files

### Key Functions
- `sitesToRules()` - Converts site list to blocking rules
- `updateBlockRules()` - Applies blocking rules
- `disableSiteWithDelay()` - Implements 60-second delay
- `toggleSite()` - Handles enable/disable toggles
- Localized string access via `chrome.i18n.getMessage()`

### Adding New Languages
1. Create new directory in `_locales/` (e.g., `es` for Spanish)
2. Add `messages.json` with translated strings
3. Update `manifest.json` to include the new locale
4. Test localization in browser with corresponding language setting

## 📝 License

This project is open source and available under the MIT License.

## 🐛 Troubleshooting

### Common Issues
- **Extension not loading**: Check Chrome version supports Manifest V3
- **Websites not blocking**: Verify domain format and refresh page
- **Settings not saving**: Check Chrome sync storage permissions
- **Text not displaying correctly**: Verify localization files are properly formatted

---

**Developed with AI assistance from DeepSeek** 🤖

*Take control of your browsing habits and boost your productivity with intelligent website blocking!*