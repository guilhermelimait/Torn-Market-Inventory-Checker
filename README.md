# Torn Market Inventory Checker

Automatically checkmark items you own in Torn.com market so you don't buy duplicates.

## Installation

### Quick Install (One Click!)

1. **Install Tampermonkey** (if you haven't already)
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Edge: [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **Click to Install** → [**Install torn-inventory-checker.user.js**](https://github.com/guilhermelimait/Torn-Market-Inventory-Checker/raw/main/torn-inventory-checker.user.js)
   - The script will automatically open in Tampermonkey
   - Just click the **"Install"** button
   - That's it! No copy-paste needed

### Manual Install (If needed)

If the automatic install doesn't work:
   - Open [torn-inventory-checker.user.js](torn-inventory-checker.user.js)
   - Copy the code
   - Tampermonkey icon → "Create a new script"
   - Paste and save (Ctrl+S)

## Setup

1. **Get Your Torn API Key**
   - Go to [Torn.com Settings](https://www.torn.com/preferences.php#tab=api)
   - Click "Create API key" (use Minimal or Limited access)
   - Copy the key

2. **Configure**
   - Visit any Torn.com page
   - You'll see a **yellow bar at the top** asking for your API key
   - Paste your key and click "Save"
   - Done! The script is now active

## Usage

- The script automatically checks your inventory when you visit Torn.com pages
- Items you own will show a **✓ OWNED** checkmark and highlighted background
- To change your API key later, click the **⚙️ API Settings** button (top right)

## Features

- ✓ Automatic inventory checking
- ✓ Visual checkmarks on owned items
- ✓ 5-minute cache to reduce API calls
- ✓ Easy API key management
- ✓ Works on all Torn.com pages

## Notes

- The script caches your inventory for 5 minutes to avoid excessive API calls
- If you acquire new items, wait 5 minutes or refresh with new API key to update
- The script is safe and only reads your inventory data
