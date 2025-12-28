// ==UserScript==
// @name         Torn Market Inventory Checker
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Checkmark items you own in Torn.com market
// @author       You
// @match        *://www.torn.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const API_KEY_STORAGE = 'torn_api_key';
    const INVENTORY_CACHE = 'torn_inventory_cache';
    const ITEM_DB_CACHE = 'torn_item_database';
    const CACHE_DURATION = 30 * 1000; // 30 seconds
    const DB_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // Add styles using standard DOM method
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .torn-api-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
            padding: 10px 20px;
            z-index: 99999;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border-bottom: 2px solid rgba(255,255,255,0.1);
        }
        .torn-api-bar-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .torn-api-bar-text {
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .torn-api-bar input {
            padding: 8px 12px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            width: 280px;
            font-size: 13px;
            background: white;
            transition: all 0.2s;
            outline: none;
        }
        .torn-api-bar input:focus {
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
        }
        .torn-api-bar button {
            padding: 8px 16px;
            background: white;
            color: #1e3a8a;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
        }
        .torn-api-bar button:hover {
            background: #f0f9ff;
            transform: translateY(-1px);
        }
        .torn-api-bar .close-btn {
            background: #dc2626;
            color: white;
        }
        .torn-api-bar .close-btn:hover {
            background: #b91c1c;
        }
        .owned-item-check {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #4CAF50;
            color: white;
            font-weight: bold;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            pointer-events: none;
        }
        .item-owned {
            position: relative;
            border: 2px solid #4CAF50 !important;
            box-shadow: 0 0 8px rgba(76, 175, 80, 0.4) !important;
        }
    `;
    document.head.appendChild(styleElement);

    // Get stored API key
    function getApiKey() {
        const key = localStorage.getItem(API_KEY_STORAGE);
        console.log('[Torn Inventory] getApiKey:', key ? 'Found' : 'Not found');
        return key;
    }

    // Save API key
    function saveApiKey(key) {
        console.log('[Torn Inventory] saveApiKey: Saving API key');
        localStorage.setItem(API_KEY_STORAGE, key);
    }

    // Get cached inventory
    function getCachedInventory() {
        const cached = localStorage.getItem(INVENTORY_CACHE);
        if (!cached) {
            console.log('[Torn Inventory] getCachedInventory: No cache found');
            return null;
        }

        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp > CACHE_DURATION) {
            console.log('[Torn Inventory] getCachedInventory: Cache expired');
            return null;
        }
        console.log('[Torn Inventory] getCachedInventory: Using cached inventory with', data.inventory.length, 'items');
        return data.inventory;
    }

    // Save inventory to cache
    function saveInventoryCache(inventory) {
        console.log('[Torn Inventory] saveInventoryCache: Caching', inventory.length, 'items');
        const data = {
            inventory: inventory,
            timestamp: Date.now()
        };
        localStorage.setItem(INVENTORY_CACHE, JSON.stringify(data));
    }

    // Get cached item database
    function getCachedItemDB() {
        const cached = localStorage.getItem(ITEM_DB_CACHE);
        if (!cached) {
            console.log('[Torn Inventory] getCachedItemDB: No cache found');
            return null;
        }

        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp > DB_CACHE_DURATION) {
            console.log('[Torn Inventory] getCachedItemDB: Cache expired');
            return null;
        }
        console.log('[Torn Inventory] getCachedItemDB: Using cached database with', Object.keys(data.items).length, 'items');
        return data.items;
    }

    // Save item database to cache
    function saveItemDBCache(items) {
        console.log('[Torn Inventory] saveItemDBCache: Caching', Object.keys(items).length, 'items');
        const data = {
            items: items,
            timestamp: Date.now()
        };
        localStorage.setItem(ITEM_DB_CACHE, JSON.stringify(data));
    }

    // Fetch item database from Torn API
    async function fetchItemDatabase(apiKey) {
        console.log('[Torn Inventory] fetchItemDatabase: Starting API call...');
        try {
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
            console.log('[Torn Inventory] fetchItemDatabase: Response status:', response.status);
            const data = await response.json();

            if (data.error) {
                console.error('[Torn Inventory] Torn API Error:', data.error);
                return null;
            }

            if (data.items) {
                // Create name->ID mapping
                const nameToId = {};
                for (const [id, item] of Object.entries(data.items)) {
                    const itemName = item.name.toLowerCase();
                    nameToId[itemName] = parseInt(id);
                }
                console.log('[Torn Inventory] fetchItemDatabase: Created mapping for', Object.keys(nameToId).length, 'items');
                return nameToId;
            }

            return null;
        } catch (error) {
            console.error('[Torn Inventory] Error fetching item database:', error);
            return null;
        }
    }

    // Fetch user inventory from API
    async function fetchInventory(apiKey) {
        console.log('[Torn Inventory] fetchInventory: Starting API call...');
        try {
            const response = await fetch(`https://api.torn.com/user/?selections=inventory&key=${apiKey}`);
            console.log('[Torn Inventory] fetchInventory: Response status:', response.status);
            const data = await response.json();
            console.log('[Torn Inventory] fetchInventory: Data received:', data);

            if (data.error) {
                console.error('[Torn Inventory] Torn API Error:', data.error);
                alert('API Error: ' + data.error.error);
                return null;
            }

            const itemIds = new Set();
            if (data.inventory) {
                console.log('[Torn Inventory] Raw inventory data:', data.inventory);
                for (const item of data.inventory) {
                    if (item.ID) {
                        itemIds.add(item.ID);
                    } else {
                        console.log('[Torn Inventory] Skipping item with no ID:', item);
                    }
                }
            }

            const result = Array.from(itemIds);
            console.log('[Torn Inventory] fetchInventory: Found', result.length, 'unique items:', result);
            return result;
        } catch (error) {
            console.error('[Torn Inventory] Error fetching inventory:', error);
            return null;
        }
    }

    // Show API key input bar
    function showApiBar(message = 'Enter your Torn API key to enable inventory checking:') {
        console.log('[Torn Inventory] showApiBar: Displaying API input bar');
        // Remove existing bar if any
        const existingBar = document.querySelector('.torn-api-bar');
        if (existingBar) existingBar.remove();

        const bar = document.createElement('div');
        bar.className = 'torn-api-bar';
        bar.innerHTML = `
            <div class="torn-api-bar-content">
                <span class="torn-api-bar-text">${message}</span>
                <input type="text" id="torn-api-input" placeholder="Paste your API key here..." />
                <button id="torn-api-save">💾 Save</button>
                <button class="close-btn" id="torn-api-close">✕ Close</button>
            </div>
        `;

        document.body.insertBefore(bar, document.body.firstChild);
        // Push page content down to avoid overlap
        document.body.style.paddingTop = '45px';

        document.getElementById('torn-api-save').addEventListener('click', async () => {
            const apiKey = document.getElementById('torn-api-input').value.trim();
            if (apiKey) {
                saveApiKey(apiKey);
                bar.remove();
                document.body.style.paddingTop = '0';
                alert('API key saved! Refreshing inventory...');
                await loadInventoryAndMark();
            }
        });

        document.getElementById('torn-api-close').addEventListener('click', () => {
            bar.remove();
            document.body.style.paddingTop = '0';
        });

        // Enter key to save
        document.getElementById('torn-api-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('torn-api-save').click();
            }
        });
    }

    // Add settings button to left navigation bar
    function addSettingsButton() {
        console.log('[Torn Inventory] addSettingsButton: Starting...');
        
        // Find the left sidebar navigation - try multiple selectors
        let sidebar = document.querySelector('#sidebar');
        if (!sidebar) {
            sidebar = document.querySelector('aside');
        }
        if (!sidebar) {
            sidebar = document.querySelector('[class*="sidebar"]');
        }
        
        if (!sidebar) {
            console.log('[Torn Inventory] Sidebar not found, checking document structure...');
            console.log('[Torn Inventory] Body children:', document.body.children);
            setTimeout(addSettingsButton, 1000);
            return;
        }
        
        console.log('[Torn Inventory] Sidebar found:', sidebar);

        // Check if already added
        if (document.querySelector('#torn-inventory-settings')) {
            console.log('[Torn Inventory] Settings button already added');
            return;
        }

        // Try to find navigation lists
        const navLists = sidebar.querySelectorAll('ul');
        console.log('[Torn Inventory] Found', navLists.length, 'navigation lists in sidebar');
        
        if (navLists.length === 0) {
            console.log('[Torn Inventory] No navigation lists found, retrying...');
            setTimeout(addSettingsButton, 1000);
            return;
        }

        // Create the settings link matching Torn's style
        const settingsItem = document.createElement('li');
        settingsItem.id = 'torn-inventory-settings';
        settingsItem.style.cursor = 'pointer';
        settingsItem.innerHTML = `
            <a style="display: block; padding: 8px; cursor: pointer;">
                <span>📦 Market Inventory Checker</span>
            </a>
        `;
        
        // Add click handler
        settingsItem.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Torn Inventory] Settings button clicked');
            showApiBar('Update your Torn API key:');
        });

        // Create refresh button
        const refreshItem = document.createElement('li');
        refreshItem.id = 'torn-inventory-refresh';
        refreshItem.style.cursor = 'pointer';
        refreshItem.innerHTML = `
            <a style="display: block; padding: 8px; cursor: pointer; color: #4CAF50;">
                <span>🔄 Refresh Inventory</span>
            </a>
        `;
        
        // Add refresh click handler
        refreshItem.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('[Torn Inventory] Refresh button clicked');
            localStorage.removeItem(INVENTORY_CACHE);
            refreshItem.innerHTML = `<a style="display: block; padding: 8px; cursor: pointer; color: #FFA500;"><span>⏳ Refreshing...</span></a>`;
            await loadInventoryAndMark();
            refreshItem.innerHTML = `<a style="display: block; padding: 8px; cursor: pointer; color: #4CAF50;"><span>🔄 Refresh Inventory</span></a>`;
        });

        // Add to the first navigation list that looks like it has menu items
        let added = false;
        navLists.forEach((list, index) => {
            if (!added && list.querySelectorAll('li').length > 0) {
                console.log('[Torn Inventory] Adding to navigation list', index);
                list.appendChild(settingsItem);
                list.appendChild(refreshItem);
                added = true;
                console.log('[Torn Inventory] Settings and refresh buttons successfully added to sidebar');
            }
        });
        
        if (!added) {
            console.log('[Torn Inventory] Could not find suitable navigation list');
        }
    }

    // Mark items as owned
    function markOwnedItems(inventoryIds, itemDatabase) {
        if (!inventoryIds || inventoryIds.length === 0) {
            console.log('[Torn Inventory] markOwnedItems: No inventory items to mark');
            return;
        }
        
        if (!itemDatabase) {
            console.log('[Torn Inventory] markOwnedItems: No item database available');
            return;
        }

        // Market pages - focus on actual market items
        const selectors = [
            '[aria-label*="item"]',
        ];
        
        let allElements = [];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // Filter out empty elements AND navigation items
                const nonEmptyElements = Array.from(elements).filter(el => {
                    // Exclude menu items and navigation
                    if (el.classList.contains('menu-item-link') || 
                        el.closest('.menu') || 
                        el.closest('[class*="nav"]')) {
                        return false;
                    }
                    return el.textContent.trim().length > 0 || el.children.length > 0;
                });
                allElements.push(...nonEmptyElements);
            }
        });
        
        // Remove duplicates
        const itemElements = [...new Set(allElements)];
        
        let markedCount = 0;
        itemElements.forEach(element => {
            const itemId = extractItemId(element, itemDatabase);
            
            if (itemId && inventoryIds.includes(itemId)) {
                // Find the parent item container (the card/tile that contains the item)
                let itemContainer = element.closest('li, [class*="item"], [class*="Item"]');
                if (!itemContainer || itemContainer.classList.contains('menu-item-link')) {
                    // If no suitable container, use the element itself
                    itemContainer = element;
                }
                
                if (!itemContainer.querySelector('.owned-item-check')) {
                    const checkmark = document.createElement('div');
                    checkmark.className = 'owned-item-check';
                    checkmark.textContent = '✓ OWNED';
                    checkmark.title = 'You already own this item';
                    itemContainer.classList.add('item-owned');
                    itemContainer.style.position = 'relative'; // Ensure positioning context
                    itemContainer.appendChild(checkmark);
                    markedCount++;
                }
            }
        });
        
        if (markedCount > 0) {
            console.log('[Torn Inventory] ✓ Marked', markedCount, 'owned items');
        }
    }

    // Extract item ID from element using item database
    function extractItemId(element, itemDatabase) {
        // Try aria-label first (for buttons like "View info for item eCPU" or "Buy item eCPU, $290...")
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && itemDatabase) {
            // Match patterns like "View info for item NAME" or "Buy item NAME, $..."
            const match = ariaLabel.match(/(?:View info for item|Buy item)\s+([^,]+)/i);
            if (match) {
                const itemName = match[1].trim().toLowerCase();
                const itemId = itemDatabase[itemName];
                if (itemId) {
                    return itemId;
                }
            }
        }
        
        // Try to find item ID in data attributes
        if (element.dataset && element.dataset.item) {
            return parseInt(element.dataset.item);
        }
        
        // Try to find in ID attribute
        const id = element.id;
        if (id) {
            const match = id.match(/item-?(\d+)/i);
            if (match) return parseInt(match[1]);
        }

        // Try to find in class names
        const classes = element.className;
        if (classes) {
            const match = classes.match(/item-?(\d+)/i);
            if (match) return parseInt(match[1]);
        }

        // Try to find in child elements or links
        const link = element.querySelector('a[href*="item.php"]');
        if (link) {
            const match = link.href.match(/[?&]ID=(\d+)/);
            if (match) return parseInt(match[1]);
        }
        
        // Try to find in href if element itself is a link
        if (element.href && element.href.includes('item.php')) {
            const match = element.href.match(/[?&]ID=(\d+)/);
            if (match) return parseInt(match[1]);
        }

        return null;
    }

    // Load inventory and mark items
    async function loadInventoryAndMark() {
        const apiKey = getApiKey();
        if (!apiKey) return;

        // Try to use cached inventory first
        let inventory = getCachedInventory();
        
        if (!inventory) {
            inventory = await fetchInventory(apiKey);
            if (inventory) {
                saveInventoryCache(inventory);
            }
        }

        // Try to use cached item database
        let itemDatabase = getCachedItemDB();
        
        if (!itemDatabase) {
            itemDatabase = await fetchItemDatabase(apiKey);
            if (itemDatabase) {
                saveItemDBCache(itemDatabase);
            }
        }

        if (inventory && itemDatabase) {
            markOwnedItems(inventory, itemDatabase);
            
            // Set up debounced observer to mark items when page content changes
            let markTimeout;
            const debouncedMark = () => {
                clearTimeout(markTimeout);
                markTimeout = setTimeout(() => {
                    markOwnedItems(inventory, itemDatabase);
                }, 500); // Wait 500ms after last change before re-marking
            };
            
            const observer = new MutationObserver(debouncedMark);
            
            // Only observe the main content area, not the entire body
            const mainContent = document.querySelector('#mainContainer, main, [class*="app-content"], [class*="mainContainer"]') || document.body;
            
            observer.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }
    }

    // Initialize
    function init() {
        console.log('[Torn Inventory] Initializing...');
        const apiKey = getApiKey();
        console.log('[Torn Inventory] API Key exists:', !!apiKey);

        // Show API bar if no key is stored
        if (!apiKey) {
            console.log('[Torn Inventory] No API key found, showing input bar');
            setTimeout(() => showApiBar(), 500);
        }

        // Always add settings button
        console.log('[Torn Inventory] Adding settings button');
        addSettingsButton();

        // Load and mark items
        if (apiKey) {
            console.log('[Torn Inventory] Loading inventory...');
            loadInventoryAndMark();
        }
    }

    // Start when page is ready
    console.log('[Torn Inventory] Document ready state:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('[Torn Inventory] Waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('[Torn Inventory] Document ready, initializing now');
        init();
    }
})();
