// ==UserScript==
// @name         Torn Market Shopping List & Price Alert
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  Shopping list with price drop alerts for Torn.com Item Market & Bazaar
// @author       You
// @match        *://www.torn.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const API_KEY_STORAGE = 'torn_api_key';
    const SHOPPING_LIST_STORAGE = 'torn_shopping_list';
    const PRICE_HISTORY_STORAGE = 'torn_price_history';
    const ITEM_DB_CACHE = 'torn_item_database';
    const DB_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const PRICE_CHECK_INTERVAL = 5 * 60 * 1000; // Check prices every 5 minutes

    // Add styles using standard DOM method
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .torn-shopping-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 100000;
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .torn-shopping-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99999;
        }
        .torn-shopping-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .torn-shopping-header h2 {
            margin: 0;
            font-size: 20px;
        }
        .torn-shopping-close {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s;
        }
        .torn-shopping-close:hover {
            background: rgba(255,255,255,0.3);
        }
        .torn-shopping-content {
            padding: 20px;
            overflow-y: auto;
            max-height: calc(80vh - 140px);
        }
        .torn-shopping-add {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            position: relative;
        }
        .torn-shopping-add input {
            flex: 1;
            padding: 10px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 14px;
        }
        .torn-shopping-add input:focus {
            outline: none;
            border-color: #1e3a8a;
        }
        .torn-autocomplete {
            position: absolute;
            top: 100%;
            left: 0;
            right: 120px;
            background: white;
            border: 2px solid #1e3a8a;
            border-top: none;
            border-radius: 0 0 6px 6px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .torn-autocomplete-item {
            padding: 10px;
            cursor: pointer;
            border-bottom: 1px solid #e5e7eb;
            transition: background 0.2s;
        }
        .torn-autocomplete-item:hover {
            background: #f3f4f6;
        }
        .torn-autocomplete-item:last-child {
            border-bottom: none;
        }
        .torn-autocomplete-name {
            font-weight: 600;
            color: #1f2937;
        }
        .torn-autocomplete-id {
            font-size: 12px;
            color: #6b7280;
            margin-left: 5px;
        }
        .torn-shopping-add button {
            padding: 10px 20px;
            background: #1e3a8a;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        .torn-shopping-add button:hover {
            background: #312e81;
        }
        .torn-shopping-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .torn-shopping-item {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .torn-shopping-item-info {
            flex: 1;
        }
        .torn-shopping-item-name {
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 5px;
            color: #1f2937;
        }
        .torn-shopping-item-prices {
            display: flex;
            gap: 15px;
            font-size: 13px;
            color: #6b7280;
        }
        .price-item-market {
            color: #2563eb;
        }
        .price-bazaar {
            color: #059669;
        }
        .price-drop {
            background: #dcfce7;
            color: #166534;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .torn-shopping-item-actions {
            display: flex;
            gap: 5px;
        }
        .torn-shopping-item-actions button {
            background: transparent;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        .torn-shopping-item-actions button:hover {
            background: #f3f4f6;
        }
        .btn-remove {
            color: #dc2626;
            border-color: #dc2626 !important;
        }
        .btn-remove:hover {
            background: #fee2e2 !important;
        }
        .torn-shopping-empty {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
        }
        .price-checking {
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
        }
        .torn-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-left: 4px solid #059669;
            border-radius: 8px;
            padding: 15px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 100001;
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
        }
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .torn-notification-title {
            font-weight: 600;
            margin-bottom: 5px;
            color: #1f2937;
        }
        .torn-notification-body {
            font-size: 14px;
            color: #6b7280;
        }
    `;
    document.head.appendChild(styleElement);

    // Storage functions
    function getApiKey() {
        return localStorage.getItem(API_KEY_STORAGE);
    }

    function saveApiKey(key) {
        localStorage.setItem(API_KEY_STORAGE, key);
    }

    function getShoppingList() {
        const list = localStorage.getItem(SHOPPING_LIST_STORAGE);
        return list ? JSON.parse(list) : [];
    }

    function saveShoppingList(list) {
        localStorage.setItem(SHOPPING_LIST_STORAGE, JSON.stringify(list));
    }

    function getPriceHistory() {
        const history = localStorage.getItem(PRICE_HISTORY_STORAGE);
        return history ? JSON.parse(history) : {};
    }

    function savePriceHistory(history) {
        localStorage.setItem(PRICE_HISTORY_STORAGE, JSON.stringify(history));
    }

    function getCachedItemDB() {
        const cached = localStorage.getItem(ITEM_DB_CACHE);
        if (!cached) return null;

        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp > DB_CACHE_DURATION) return null;
        
        return data.items;
    }

    function saveItemDBCache(items) {
        const data = {
            items: items,
            timestamp: Date.now()
        };
        localStorage.setItem(ITEM_DB_CACHE, JSON.stringify(data));
    }

    // API functions
    async function fetchItemDatabase(apiKey) {
        try {
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
            const data = await response.json();

            if (data.error) {
                console.error('[Torn Shopping] API Error:', data.error);
                return null;
            }

            if (data.items) {
                return data.items;
            }

            return null;
        } catch (error) {
            console.error('[Torn Shopping] Error fetching item database:', error);
            return null;
        }
    }

    async function fetchItemPrice(itemId, apiKey) {
        console.log('[Torn Shopping] Fetching price for item ID:', itemId);
        try {
            // Fetch both Item Market and Bazaar prices
            const marketResponse = await fetch(`https://api.torn.com/v2/market/${itemId}/itemmarket?key=${apiKey}`);
            const marketData = await marketResponse.json();
            console.log('[Torn Shopping] Market data:', JSON.stringify(marketData, null, 2));

            const bazaarResponse = await fetch(`https://api.torn.com/v2/market/${itemId}/bazaar?key=${apiKey}`);
            const bazaarData = await bazaarResponse.json();
            console.log('[Torn Shopping] Bazaar data:', JSON.stringify(bazaarData, null, 2));

            let lowestMarket = null;
            let lowestBazaar = null;

            // Get lowest Item Market price
            if (marketData.itemmarket && marketData.itemmarket.listings && !marketData.error) {
                const listings = marketData.itemmarket.listings;
                if (listings.length > 0) {
                    lowestMarket = Math.min(...listings.map(l => l.price));
                }
            }

            // Get lowest Bazaar price
            if (bazaarData.bazaar && Array.isArray(bazaarData.bazaar) && !bazaarData.error) {
                const listings = bazaarData.bazaar;
                if (listings.length > 0) {
                    lowestBazaar = Math.min(...listings.map(l => l.price));
                }
            }

            const result = {
                itemMarket: lowestMarket,
                bazaar: lowestBazaar,
                timestamp: Date.now()
            };
            console.log('[Torn Shopping] Final prices:', result);
            return result;
        } catch (error) {
            console.error('[Torn Shopping] Error fetching price for item', itemId, error);
            return null;
        }
    }

    // Notification function
    function showNotification(title, body) {
        const notification = document.createElement('div');
        notification.className = 'torn-notification';
        notification.innerHTML = `
            <div class="torn-notification-title">🔔 ${title}</div>
            <div class="torn-notification-body">${body}</div>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Check prices and detect drops
    async function checkPrices(apiKey) {
        const shoppingList = getShoppingList();
        if (shoppingList.length === 0) return;

        const itemDatabase = getCachedItemDB() || await fetchItemDatabase(apiKey);
        if (!itemDatabase) return;

        const priceHistory = getPriceHistory();

        for (const item of shoppingList) {
            const prices = await fetchItemPrice(item.id, apiKey);
            if (!prices) continue;

            const itemName = itemDatabase[item.id] || `Item ${item.id}`;
            
            // Initialize price history for this item if it doesn't exist
            if (!priceHistory[item.id]) {
                priceHistory[item.id] = {
                    lowestMarket: prices.itemMarket,
                    lowestBazaar: prices.bazaar,
                    lastCheck: prices.timestamp
                };
            } else {
                // Check for price drops
                const history = priceHistory[item.id];
                let dropDetected = false;
                let dropMessage = '';

                if (prices.itemMarket && history.lowestMarket && prices.itemMarket < history.lowestMarket) {
                    const dropPercent = ((history.lowestMarket - prices.itemMarket) / history.lowestMarket * 100).toFixed(1);
                    dropMessage = `Item Market: $${prices.itemMarket.toLocaleString()} (-${dropPercent}%)`;
                    dropDetected = true;
                    history.lowestMarket = prices.itemMarket;
                }

                if (prices.bazaar && history.lowestBazaar && prices.bazaar < history.lowestBazaar) {
                    const dropPercent = ((history.lowestBazaar - prices.bazaar) / history.lowestBazaar * 100).toFixed(1);
                    if (dropMessage) dropMessage += '\n';
                    dropMessage += `Bazaar: $${prices.bazaar.toLocaleString()} (-${dropPercent}%)`;
                    dropDetected = true;
                    history.lowestBazaar = prices.bazaar;
                }

                if (dropDetected) {
                    showNotification(`Price Drop: ${itemName}`, dropMessage);
                }

                history.lastCheck = prices.timestamp;
            }

            // Update item in shopping list with current prices
            item.currentPrices = prices;
        }

        savePriceHistory(priceHistory);
        saveShoppingList(shoppingList);
    }

    // Shopping list UI
    function showShoppingListModal() {
        // Remove existing modal if any
        document.querySelectorAll('.torn-shopping-overlay, .torn-shopping-modal').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'torn-shopping-overlay';

        const modal = document.createElement('div');
        modal.className = 'torn-shopping-modal';
        modal.innerHTML = `
            <div class="torn-shopping-header">
                <h2>🛒 Shopping List & Price Alerts</h2>
                <button class="torn-shopping-close">✕</button>
            </div>
            <div class="torn-shopping-content">
                <div class="torn-shopping-add">
                    <input type="text" id="item-search" placeholder="Type item name (e.g. 'CPU', 'xanax', 'blood bag')..." autocomplete="off" />
                    <div id="item-autocomplete" class="torn-autocomplete" style="display: none;"></div>
                    <button id="add-item-btn">Add to List</button>
                </div>
                <ul class="torn-shopping-list" id="shopping-list-items"></ul>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Close handlers
        overlay.addEventListener('click', () => {
            overlay.remove();
            modal.remove();
        });
        modal.querySelector('.torn-shopping-close').addEventListener('click', () => {
            overlay.remove();
            modal.remove();
        });

        // Render shopping list
        renderShoppingList();

        // Setup autocomplete
        setupAutocomplete();

        // Add item handler
        document.getElementById('add-item-btn').addEventListener('click', async () => {
            await addItemToList();
        });

        document.getElementById('item-search').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await addItemToList();
            }
        });
    }

    async function setupAutocomplete() {
        const searchInput = document.getElementById('item-search');
        const autocompleteDiv = document.getElementById('item-autocomplete');
        
        const apiKey = getApiKey();
        if (!apiKey) return;

        const itemDatabase = getCachedItemDB() || await fetchItemDatabase(apiKey);
        if (!itemDatabase) return;

        let selectedIndex = -1;
        let matchingItems = [];

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            
            if (searchTerm.length < 2) {
                autocompleteDiv.style.display = 'none';
                return;
            }

            // Find matching items
            matchingItems = [];
            for (const [itemName, itemId] of Object.entries(itemDatabase)) {
                if (itemName && itemName.toLowerCase().includes(searchTerm)) {
                    matchingItems.push({ id: itemId, name: itemName });
                    if (matchingItems.length >= 15) break; // Limit to 15 results
                }
            }

            if (matchingItems.length === 0) {
                autocompleteDiv.style.display = 'none';
                return;
            }

            // Render autocomplete items
            autocompleteDiv.innerHTML = matchingItems.map((item, index) => `
                <div class="torn-autocomplete-item" data-index="${index}" data-id="${item.id}" data-name="${item.name}">
                    <span class="torn-autocomplete-name">${item.name}</span>
                    <span class="torn-autocomplete-id">#${item.id}</span>
                </div>
            `).join('');

            autocompleteDiv.style.display = 'block';
            selectedIndex = -1;

            // Add click handlers
            autocompleteDiv.querySelectorAll('.torn-autocomplete-item').forEach(el => {
                el.addEventListener('click', () => {
                    searchInput.value = el.dataset.name;
                    searchInput.dataset.selectedId = el.dataset.id;
                    searchInput.dataset.selectedName = el.dataset.name;
                    autocompleteDiv.style.display = 'none';
                });
            });
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const items = autocompleteDiv.querySelectorAll('.torn-autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelection(items, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(items, selectedIndex);
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                items[selectedIndex].click();
            } else if (e.key === 'Escape') {
                autocompleteDiv.style.display = 'none';
            }
        });

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
                autocompleteDiv.style.display = 'none';
            }
        });

        function updateSelection(items, index) {
            items.forEach((item, i) => {
                if (i === index) {
                    item.style.background = '#e0e7ff';
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.style.background = '';
                }
            });
        }
    }

    async function addItemToList() {
        const searchInput = document.getElementById('item-search');
        const autocompleteDiv = document.getElementById('item-autocomplete');
        
        // Check if item was selected from autocomplete
        let foundItemId = null;
        let foundItemName = null;
        
        if (searchInput.dataset.selectedId) {
            foundItemId = parseInt(searchInput.dataset.selectedId);
            foundItemName = searchInput.dataset.selectedName;
            
            // Clear selection data
            delete searchInput.dataset.selectedId;
            delete searchInput.dataset.selectedName;
        } else {
            // Fallback to search
            const searchTerm = searchInput.value.trim().toLowerCase();
            
            if (!searchTerm) return;

            const apiKey = getApiKey();
            if (!apiKey) {
                alert('Please set your API key first!');
                return;
            }

            const itemDatabase = getCachedItemDB() || await fetchItemDatabase(apiKey);
            if (!itemDatabase) {
                alert('Failed to load item database');
                return;
            }

            // Search for exact match first, then partial
            for (const [itemName, itemId] of Object.entries(itemDatabase)) {
                if (itemName && itemName.toLowerCase() === searchTerm) {
                    foundItemId = itemId;
                    foundItemName = itemName;
                    break;
                }
            }
            
            // If no exact match, try partial
            if (!foundItemId) {
                for (const [itemName, itemId] of Object.entries(itemDatabase)) {
                    if (itemName && itemName.toLowerCase().includes(searchTerm)) {
                        foundItemId = itemId;
                        foundItemName = itemName;
                        break;
                    }
                }
            }

            if (!foundItemId) {
                alert(`Item "${searchTerm}" not found. Try typing at least 2 characters to see suggestions.`);
                return;
            }
        }

        const apiKey = getApiKey();
        if (!apiKey) return;

        const shoppingList = getShoppingList();
        
        // Check if already in list
        if (shoppingList.find(item => item.id === foundItemId)) {
            alert('Item already in shopping list');
            return;
        }

        // Add to list
        shoppingList.push({
            id: foundItemId,
            name: foundItemName,
            addedAt: Date.now()
        });

        saveShoppingList(shoppingList);
        searchInput.value = '';
        autocompleteDiv.style.display = 'none';
        
        // Fetch initial price
        const prices = await fetchItemPrice(foundItemId, apiKey);
        if (prices) {
            const item = shoppingList.find(i => i.id === foundItemId);
            item.currentPrices = prices;
            saveShoppingList(shoppingList);
            
            // Initialize price history
            const priceHistory = getPriceHistory();
            priceHistory[foundItemId] = {
                lowestMarket: prices.itemMarket,
                lowestBazaar: prices.bazaar,
                lastCheck: prices.timestamp
            };
            savePriceHistory(priceHistory);
        }

        renderShoppingList();
    }

    function removeItemFromList(itemId) {
        let shoppingList = getShoppingList();
        shoppingList = shoppingList.filter(item => item.id !== itemId);
        saveShoppingList(shoppingList);
        
        // Remove from price history
        const priceHistory = getPriceHistory();
        delete priceHistory[itemId];
        savePriceHistory(priceHistory);
        
        renderShoppingList();
    }

    async function refreshItemPrice(itemId) {
        const apiKey = getApiKey();
        if (!apiKey) return;

        const btn = document.querySelector(`button[data-item-id="${itemId}"]`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳';
        }

        const prices = await fetchItemPrice(itemId, apiKey);
        if (prices) {
            const shoppingList = getShoppingList();
            const item = shoppingList.find(i => i.id === itemId);
            if (item) {
                item.currentPrices = prices;
                saveShoppingList(shoppingList);
            }
        }

        renderShoppingList();
    }

    function renderShoppingList() {
        const listContainer = document.getElementById('shopping-list-items');
        if (!listContainer) return;

        const shoppingList = getShoppingList();
        
        if (shoppingList.length === 0) {
            listContainer.innerHTML = `
                <div class="torn-shopping-empty">
                    <p>📝 Your shopping list is empty</p>
                    <p>Search for items above to start tracking prices</p>
                </div>
            `;
            return;
        }

        const priceHistory = getPriceHistory();

        listContainer.innerHTML = shoppingList.map(item => {
            const history = priceHistory[item.id];
            let priceDisplay = '<span class="price-checking">Checking prices...</span>';
            
            if (item.currentPrices) {
                const prices = item.currentPrices;
                const parts = [];
                
                if (prices.itemMarket) {
                    let marketHtml = `<span class="price-item-market">Item Market: $${prices.itemMarket.toLocaleString()}</span>`;
                    if (history && history.lowestMarket && prices.itemMarket === history.lowestMarket) {
                        marketHtml += ' <span class="price-drop">LOWEST!</span>';
                    }
                    parts.push(marketHtml);
                }
                
                if (prices.bazaar) {
                    let bazaarHtml = `<span class="price-bazaar">Bazaar: $${prices.bazaar.toLocaleString()}</span>`;
                    if (history && history.lowestBazaar && prices.bazaar === history.lowestBazaar) {
                        bazaarHtml += ' <span class="price-drop">LOWEST!</span>';
                    }
                    parts.push(bazaarHtml);
                }
                
                if (parts.length > 0) {
                    priceDisplay = parts.join(' | ');
                } else {
                    priceDisplay = '<span style="color: #dc2626;">No listings found</span>';
                }
            }

            return `
                <li class="torn-shopping-item">
                    <div class="torn-shopping-item-info">
                        <div class="torn-shopping-item-name">${item.name}</div>
                        <div class="torn-shopping-item-prices">${priceDisplay}</div>
                    </div>
                    <div class="torn-shopping-item-actions">
                        <button class="btn-refresh" data-item-id="${item.id}">🔄</button>
                        <button class="btn-remove" data-item-id="${item.id}">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
        
        // Add event listeners for buttons
        listContainer.querySelectorAll('.btn-refresh').forEach(btn => {
            btn.addEventListener('click', () => {
                refreshItemPrice(parseInt(btn.dataset.itemId));
            });
        });
        
        listContainer.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                removeItemFromList(parseInt(btn.dataset.itemId));
            });
        });
    }

    // Add sidebar button
    let sidebarRetries = 0;
    const MAX_RETRIES = 10;
    
    function addSidebarButton() {
        console.log('[Torn Shopping] addSidebarButton attempt', ++sidebarRetries);
        
        // Try specific selectors for Torn's actual sidebar (not body!)
        let sidebar = document.querySelector('#sidebar');
        if (!sidebar) sidebar = document.querySelector('aside.sidebar');
        if (!sidebar) sidebar = document.querySelector('[class*="Sidebar___"]');
        if (!sidebar) sidebar = document.querySelector('div.sidebar');
        if (!sidebar) sidebar = document.querySelector('[data-testid="sidebar"]');
        
        // Fallback: find element with class containing "sidebar" but NOT body
        if (!sidebar) {
            const candidates = document.querySelectorAll('[class*="sidebar"]');
            for (const candidate of candidates) {
                if (candidate.tagName !== 'BODY') {
                    sidebar = candidate;
                    break;
                }
            }
        }
        
        console.log('[Torn Shopping] Sidebar element:', sidebar?.tagName, sidebar?.className);
        
        if (!sidebar || sidebar.tagName === 'BODY') {
            if (sidebarRetries < MAX_RETRIES) {
                console.log('[Torn Shopping] Real sidebar not found, retrying...');
                setTimeout(addSidebarButton, 1000);
            } else {
                console.error('[Torn Shopping] Could not find real sidebar after', MAX_RETRIES, 'attempts');
                // Add floating button as fallback
                addFloatingButton();
            }
            return;
        }

        if (document.querySelector('#torn-shopping-btn')) {
            console.log('[Torn Shopping] Buttons already added');
            return;
        }

        const navLists = sidebar.querySelectorAll('ul');
        console.log('[Torn Shopping] Found', navLists.length, 'navigation lists');
        
        if (navLists.length === 0) {
            if (sidebarRetries < MAX_RETRIES) {
                console.log('[Torn Shopping] No nav lists found, retrying...');
                setTimeout(addSidebarButton, 1000);
            } else {
                console.error('[Torn Shopping] No navigation lists found after', MAX_RETRIES, 'attempts');
                addFloatingButton();
            }
            return;
        }

        const shoppingButton = document.createElement('li');
        shoppingButton.id = 'torn-shopping-btn';
        shoppingButton.style.cursor = 'pointer';
        shoppingButton.innerHTML = `
            <a style="display: block; padding: 8px; cursor: pointer;">
                <span>🛒 Shopping List & Alerts</span>
            </a>
        `;
        
        shoppingButton.addEventListener('click', (e) => {
            e.preventDefault();
            showShoppingListModal();
        });

        // Add API key button
        const apiButton = document.createElement('li');
        apiButton.id = 'torn-api-settings-btn';
        apiButton.style.cursor = 'pointer';
        apiButton.innerHTML = `
            <a style="display: block; padding: 8px; cursor: pointer;">
                <span>🔑 Set API Key</span>
            </a>
        `;
        
        apiButton.addEventListener('click', (e) => {
            e.preventDefault();
            const key = prompt('Enter your Torn API key:');
            if (key) {
                saveApiKey(key);
                alert('API key saved! You can now add items to your shopping list.');
            }
        });

        let added = false;
        navLists.forEach((list, index) => {
            if (!added && list.querySelectorAll('li').length > 0) {
                console.log('[Torn Shopping] Adding buttons to nav list', index);
                list.appendChild(shoppingButton);
                list.appendChild(apiButton);
                added = true;
                console.log('[Torn Shopping] ✓ Sidebar buttons successfully added!');
            }
        });
        
        if (!added) {
            console.error('[Torn Shopping] Could not add buttons to any nav list');
            addFloatingButton();
        }
    }
    
    // Fallback: Add floating button if sidebar not found
    function addFloatingButton() {
        if (document.querySelector('#torn-shopping-float-btn')) return;
        
        console.log('[Torn Shopping] Adding floating button as fallback');
        
        const floatButton = document.createElement('div');
        floatButton.id = 'torn-shopping-float-btn';
        floatButton.innerHTML = '🛒';
        floatButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 99998;
            transition: transform 0.2s;
        `;
        
        floatButton.addEventListener('mouseenter', () => {
            floatButton.style.transform = 'scale(1.1)';
        });
        
        floatButton.addEventListener('mouseleave', () => {
            floatButton.style.transform = 'scale(1)';
        });
        
        floatButton.addEventListener('click', () => {
            showShoppingListModal();
        });
        
        floatButton.title = 'Shopping List & Price Alerts - Click to open';
        
        document.body.appendChild(floatButton);
        console.log('[Torn Shopping] ✓ Floating button added');
    }

    // Initialize
    async function init() {
        console.log('[Torn Shopping] Initializing...');
        
        // Add sidebar button
        addSidebarButton();

        // Check if API key exists
        const apiKey = getApiKey();
        if (!apiKey) {
            setTimeout(() => {
                const key = prompt('Welcome to Torn Shopping List & Price Alerts!\n\nEnter your Torn API key to get started:');
                if (key) {
                    saveApiKey(key);
                }
            }, 1000);
            return;
        }

        // Load item database
        let itemDatabase = getCachedItemDB();
        if (!itemDatabase) {
            itemDatabase = await fetchItemDatabase(apiKey);
            if (itemDatabase) {
                saveItemDBCache(itemDatabase);
            }
        }

        // Start periodic price checking
        setInterval(() => {
            checkPrices(apiKey);
        }, PRICE_CHECK_INTERVAL);

        // Check prices immediately
        setTimeout(() => {
            checkPrices(apiKey);
        }, 2000);
    }

    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
