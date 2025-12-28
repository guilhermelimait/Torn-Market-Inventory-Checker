// ==UserScript==
// @name         Torn Market Inventory Checker
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Checkmark items you own in Torn.com market
// @author       You
// @match        *://www.torn.com/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // Create a VERY visible test box
    const testBox = document.createElement('div');
    testBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: lime;
        color: black;
        padding: 30px;
        font-size: 24px;
        font-weight: bold;
        border: 5px solid darkgreen;
        z-index: 999999;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
    `;
    testBox.textContent = 'TORN INVENTORY SCRIPT IS WORKING!';
    document.body.appendChild(testBox);
    
    console.log('[Torn Inventory] ===== SCRIPT IS RUNNING =====');

    const API_KEY_STORAGE = 'torn_api_key';
    const INVENTORY_CACHE = 'torn_inventory_cache';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Add styles
    GM_addStyle(`
        .torn-api-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffd700;
            padding: 10px;
            text-align: center;
            z-index: 99999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .torn-api-bar input {
            padding: 5px 10px;
            margin: 0 10px;
            border: 1px solid #ccc;
            border-radius: 3px;
            width: 300px;
        }
        .torn-api-bar button {
            padding: 5px 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .torn-api-bar button:hover {
            background: #45a049;
        }
        .torn-api-bar .close-btn {
            background: #f44336;
            margin-left: 10px;
        }
        .torn-api-bar .close-btn:hover {
            background: #da190b;
        }
        .torn-api-settings {
            position: fixed;
            top: 50px;
            right: 10px;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            z-index: 9999;
            font-size: 12px;
        }
        .torn-api-settings:hover {
            background: #555;
        }
        .owned-item-check {
            color: #4CAF50;
            font-weight: bold;
            margin-left: 5px;
        }
        .item-owned {
            background: rgba(76, 175, 80, 0.1) !important;
        }
    `);

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
                for (const item of data.inventory) {
                    itemIds.add(item.ID);
                }
            }

            const result = Array.from(itemIds);
            console.log('[Torn Inventory] fetchInventory: Found', result.length, 'unique items');
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
            <span>${message}</span>
            <input type="text" id="torn-api-input" placeholder="Enter API key here" />
            <button id="torn-api-save">Save</button>
            <button class="close-btn" id="torn-api-close">Cancel</button>
        `;

        document.body.insertBefore(bar, document.body.firstChild);

        document.getElementById('torn-api-save').addEventListener('click', async () => {
            const apiKey = document.getElementById('torn-api-input').value.trim();
            if (apiKey) {
                saveApiKey(apiKey);
                bar.remove();
                alert('API key saved! Refreshing inventory...');
                await loadInventoryAndMark();
            }
        });

        document.getElementById('torn-api-close').addEventListener('click', () => {
            bar.remove();
        });

        // Enter key to save
        document.getElementById('torn-api-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('torn-api-save').click();
            }
        });
    }

    // Add settings button to change API key
    function addSettingsButton() {
        const settingsBtn = document.createElement('div');
        settingsBtn.className = 'torn-api-settings';
        settingsBtn.textContent = '⚙️ API Settings';
        settingsBtn.addEventListener('click', () => {
            showApiBar('Update your Torn API key:');
        });
        document.body.appendChild(settingsBtn);
    }

    // Mark items as owned
    function markOwnedItems(inventoryIds) {
        if (!inventoryIds || inventoryIds.length === 0) {
            console.log('[Torn Inventory] markOwnedItems: No inventory items to mark');
            return;
        }

        console.log('[Torn Inventory] markOwnedItems: Checking page elements for', inventoryIds.length, 'owned items');
        // Market pages
        const itemElements = document.querySelectorAll('[class*="item"]');
        console.log('[Torn Inventory] markOwnedItems: Found', itemElements.length, 'potential item elements');
        
        let markedCount = 0;
        itemElements.forEach(element => {
            const itemId = extractItemId(element);
            if (itemId && inventoryIds.includes(itemId)) {
                if (!element.querySelector('.owned-item-check')) {
                    const checkmark = document.createElement('span');
                    checkmark.className = 'owned-item-check';
                    checkmark.textContent = '✓ OWNED';
                    checkmark.title = 'You already own this item';
                    element.classList.add('item-owned');
                    element.appendChild(checkmark);
                    markedCount++;
                    console.log('[Torn Inventory] Marked item ID:', itemId, 'as owned');
                }
            }
        });
        console.log('[Torn Inventory] markOwnedItems: Marked', markedCount, 'items as owned');
    }

    // Extract item ID from element (you may need to adjust this based on Torn's actual HTML structure)
    function extractItemId(element) {
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

        if (inventory) {
            markOwnedItems(inventory);
            
            // Set up observer to mark items when page content changes
            const observer = new MutationObserver(() => {
                markOwnedItems(inventory);
            });

            observer.observe(document.body, {
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
