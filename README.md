# Torn Market Inventory Checker

Automatically checkmark items you own in Torn.com market so you don't buy duplicates.

## Installation

1. **Install Tampermonkey**
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Edge: [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **Install the Script**
   - Click on the Tampermonkey icon in your browser
   - Click "Create a new script"
   - Delete all the default code
   - Copy and paste the entire content from `torn-inventory-checker.user.js`
   - Press Ctrl+S (or Cmd+S on Mac) to save

3. **Get Your Torn API Key**
   - Go to [Torn.com](https://www.torn.com)
   - Navigate to Settings → API
   - Create a new API key with "Minimal" or "Limited" access
   - Copy the key

4. **Configure the Script**
   - Visit [Torn.com homepage](https://www.torn.com)
   - A yellow bar will appear at the top
   - Paste your API key and click "Save"
   - Done!

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
