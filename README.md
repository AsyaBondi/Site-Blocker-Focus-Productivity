🌟 Features
Smart Blocking System
🟢 Enabled: Immediate website blocking

🟡 Disabled with Delay: 60-second countdown before unblocking

🔴 Fully Disabled: Complete website accessibility

User Interface
Clean Popup Interface with real-time controls

Visual Status Indicators (color-coded badges)

Live Countdown Timers for delayed unblocking

Quick Add/Remove functionality

Statistics Dashboard showing blocking status

Technical Features
Network-level Blocking using Chrome's declarativeNetRequest API

No Custom Pages - shows standard browser errors

Settings Synchronization across browser instances

Local Storage - no data collection or tracking

🚀 Installation
Manual Installation
Download or clone this repository

Open Chrome and navigate to chrome://extensions/

Enable "Developer mode" in the top-right corner

Click "Load unpacked" and select the extension folder

The extension icon will appear in your toolbar

File Structure
text
site-blocker/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
📖 How to Use
Adding Websites
Click the extension icon in the toolbar

Enter a domain name (e.g., youtube.com, facebook.com)

Click "Add Site" or press Enter

Managing Blocking
Toggle Switch: Click to enable/disable blocking

Status Badges:

🟢 "on" - Website is blocked

🟡 "60s" - Countdown to unblocking

🔴 "off" - Website is accessible

Remove Button (×): Delete website from list

Blocking Behavior
Enabled: Website loads with browser network error

Disabled: 60-second delay, then website becomes accessible

During Countdown: Toggle is disabled until countdown completes

🛠 Technical Details
APIs Used
declarativeNetRequest - Network-level blocking

storage - Settings persistence

host_permissions - Website access

Blocking Rules
Blocks main frame and sub-resources

Works on all URL schemes (HTTP/HTTPS)

Includes subdomains automatically

Data Storage
All data stored locally in Chrome sync storage

No external servers or data collection

Complete privacy protection

🔧 Development
Code Structure
Popup Interface: popup.html, popup.js, styles.css

Background Service: background.js

Manifest: manifest.json (Manifest V3)

Key Functions
sitesToRules() - Converts site list to blocking rules

updateBlockRules() - Applies blocking rules

disableSiteWithDelay() - Implements 60-second delay

toggleSite() - Handles enable/disable toggles

Building from Source
Ensure all files are in the project directory

Update version in manifest.json if needed

Load as unpacked extension in Chrome

🤝 Contributing
This project was developed with AI assistance from DeepSeek. Contributions are welcome!

Areas for Improvement
Additional blocking modes

Custom delay durations

Scheduling features

Export/import settings

Enhanced statistics

📝 License
This project is open source and available under the MIT License.

🐛 Troubleshooting
Common Issues
Extension not loading: Check Chrome version supports Manifest V3

Websites not blocking: Verify domain format and refresh page

Settings not saving: Check Chrome sync storage permissions

Support
For issues and feature requests, please check the project repository.

📊 Statistics
The extension provides real-time statistics:

Total: Number of websites in list

Blocked: Currently active blocking

In Delay: Countdown in progress

Available: Fully accessible websites

Developed with AI assistance from DeepSeek 🤖

Take control of your browsing habits and boost your productivity with intelligent website blocking!