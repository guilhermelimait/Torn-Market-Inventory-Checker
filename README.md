# Torn Market Shopping List & Price Alert

A Tampermonkey userscript that helps you track items you want to buy on Torn.com with automatic price drop alerts.

## Features

- 🛒 **Shopping List**: Add items you want to buy
- 📉 **Price Tracking**: Monitors both Item Market and Bazaar prices
- 🔔 **Price Drop Alerts**: Get notifications when prices drop
- 📊 **Price History**: Tracks lowest prices seen for each item
- 🔄 **Auto-Refresh**: Checks prices every 5 minutes automatically
- 💰 **Best Deal Finder**: Shows the lowest price between Item Market and Bazaar

## Installation

### Step 1: Install Tampermonkey
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Edge: [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### Step 2: Install the Script (Simple 4 Steps!)

1. Open [torn-inventory-checker.user.js](https://github.com/guilhermelimait/Torn-Market-Inventory-Checker/blob/main/torn-inventory-checker.user.js)
2. Click the **"Raw"** button (top right of the code)
3. Press **Ctrl+A** (select all) then **Ctrl+C** (copy)
4. Click Tampermonkey icon → **"Create a new script"** → Delete everything → **Ctrl+V** (paste) → **Ctrl+S** (save)

Done! The script is installed.

## Setup

1. **Get Your Torn API Key**
   - Go to [Torn.com Settings](https://www.torn.com/preferences.php#tab=api)
   - Click "Create API key" (use Minimal or Limited access for reading)
   - Copy the key

2. **First Use**
   - Visit any Torn.com page
   - You'll be prompted to enter your API key
   - Paste your key and click OK

## How to Use

### Adding Items to Your Shopping List

1. Click **"🛒 Shopping List & Alerts"** in the left sidebar
2. Search for an item by name (e.g., "xanax", "blood bag", "ecstasy")
3. Click "Add to List"
4. Prices will be fetched automatically from both Item Market and Bazaar

### Managing Your List

- **Refresh Price**: Click 🔄 button next to any item to update prices
- **Remove Item**: Click 🗑️ button to remove from list
- **LOWEST! badge**: Appears when current price equals the lowest price ever seen

### Understanding Price Alerts

- The script checks prices every 5 minutes automatically
- When a price drops below the previous lowest, you'll get a notification in the top-right corner
- Notifications show:
  - Item name
  - Which market (Item Market or Bazaar)
  - New price
  - Percentage drop

### Example Notification

```
🔔 Price Drop: Xanax
Item Market: $2,500 (-15.2%)
```

## API Key Permissions

Your API key needs minimal permissions:
- **Read access only** to fetch public item data and market prices
- No special permissions required

## Settings

- **🔑 Set API Key**: Click in sidebar to update your API key anytime
- **🛒 Shopping List & Alerts**: Opens the shopping list modal

## How It Works

1. **You add items** to your shopping list by searching for them
2. **Script tracks prices** from both Item Market and Bazaar every 5 minutes
3. **Price history** is stored locally to detect drops
4. **Notifications appear** when prices drop below previous lowest
5. **All data** is stored in your browser (localStorage)

## Storage Breakdown

- `torn_api_key`: Your API key (encrypted by browser)
- `torn_shopping_list`: Items you're tracking with current prices
- `torn_price_history`: Lowest prices seen for each item
- `torn_item_database`: Torn's item database (refreshed every 24 hours)

## Troubleshooting

**No prices showing?**
- Check your API key is valid in Torn.com settings
- Make sure the item has active listings on Item Market or Bazaar
- Some items may not be available for purchase

**Notifications not appearing?**
- Keep at least one Torn.com tab open in your browser
- Price drops only trigger when price goes below the **lowest price ever seen**
- Check if the item's price actually dropped

**Item not found when searching?**
- Try searching by partial name (e.g., "xan" for "xanax")
- Item names are case-insensitive
- Item database updates every 24 hours

**Prices show "Checking prices..."**
- Wait a few seconds for the API call to complete
- If it persists, click the 🔄 refresh button
- Check your API key is valid

## Limitations

- Prices are checked every 5 minutes (configurable in code: `PRICE_CHECK_INTERVAL`)
- Only tracks items you manually add to the shopping list
- Requires an open Torn.com tab for background price checks
- Torn API rate limits apply (script is optimized to minimize calls)
- Bazaar prices may fluctuate rapidly

## Privacy & Security

✅ **All data is stored locally** in your browser  
✅ **No external servers** - only communicates with Torn's official API  
✅ **Open source** - you can review the entire code  
✅ **No tracking** or analytics

## Advanced Configuration

Edit these constants in the script to customize behavior:

```javascript
const PRICE_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes (in milliseconds)
const DB_CACHE_DURATION = 24 * 60 * 60 * 1000; // Item database cache: 24 hours
```

## Version History

- **v6.0** (Current): Complete rewrite - Shopping list with automatic price drop alerts
- v5.0: Inventory checker (deprecated due to Torn API changes)

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify API key is valid
3. Try refreshing the page
4. Clear localStorage and reconfigure

## Contributing

Feel free to fork, modify, and submit pull requests!

## License

Open source - use freely!
