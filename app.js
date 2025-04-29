/**
 * Main application logic for the web navigation app
 */

document.addEventListener('DOMContentLoaded', () => {
    // App state
    const state = {
        websites: loadFromLocalStorage('websites', [
            { id: 'default1', name: 'GitHub', url: 'https://github.com' },
            { id: 'default2', name: 'Google', url: 'https://google.com' },
            { id: 'default3', name: 'YouTube', url: 'https://youtube.com' },
            { id: 'default4', name: 'Reddit', url: 'https://reddit.com' },
            { id: 'default5', name: 'Twitter', url: 'https://twitter.com' }
        ]),
        searchEngines: loadFromLocalStorage('searchEngines', [
            { id: 'default1', name: 'Google', url: 'https://google.com/search?q=%s' },
            { id: 'default2', name: 'Bing', url: 'https://bing.com/search?q=%s' },
            { id: 'default3', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
            { id: 'default4', name: 'Yahoo', url: 'https://search.yahoo.com/search?p=%s' },
        ]),
        activeSearchEngineId: loadFromLocalStorage('activeSearchEngineId', 'default1')
    };
    
    // Elements
    const elements = {
        searchInput: document.getElementById('search-input'),
        searchEngineIcon: document.getElementById('search-engine-icon'),
        searchEngineButton: document.getElementById('search-engine-button'),
        searchEngineDropdown: document.getElementById('search-engine-dropdown'),
        searchEngineList: document.getElementById('search-engine-list'),
        websiteCards: document.getElementById('website-cards'),
        addWebsiteCard: document.getElementById('add-website-card'),
        contextMenu: document.getElementById('context-menu'),
        editWebsiteButton: document.getElementById('edit-website-button'),
        
        // Website modal
        addWebsiteModal: document.getElementById('add-website-modal'),
        websiteModalTitle: document.getElementById('website-modal-title'),
        closeWebsiteModal: document.getElementById('close-website-modal'),
        websiteForm: document.getElementById('website-form'),
        websiteId: document.getElementById('website-id'),
        websiteUrl: document.getElementById('website-url'),
        websiteName: document.getElementById('website-name'),
        deleteWebsite: document.getElementById('delete-website'),
        saveWebsite: document.getElementById('save-website'),
    };
    
    // Current context
    let contextMenuWebsiteId = null;
    let isSearchEngineDropdownOpen = false;

    // Initialize app
    function init() {
        renderWebsites();
        updateSearchEngineDropdown();
        
        // Set active search engine
        const activeEngine = state.searchEngines.find(engine => engine.id === state.activeSearchEngineId);
        if (activeEngine) {
            elements.searchEngineIcon.src = getFaviconUrl(getDomain(activeEngine.url));
            elements.searchEngineIcon.alt = activeEngine.name;
        }
        
        attachEventListeners();
    }

    // Render website cards
    function renderWebsites() {
        // Clear existing cards (except add card)
        const websiteCards = elements.websiteCards.querySelectorAll('.website-card:not(#add-website-card)');
        websiteCards.forEach(card => card.remove());
        
        // Render websites before the add card
        state.websites.forEach(website => {
            const domain = getDomain(website.url);
            const card = document.createElement('div');
            card.className = 'website-card flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer bg-white transition-all h-[100px] shadow-sm';
            card.dataset.id = website.id;
            card.innerHTML = `
                <img src="${getFaviconUrl(domain)}" alt="${website.name}" class="w-6 h-6 mb-2">
                <span class="text-xs font-medium text-gray-600 text-center truncate w-full">${website.name}</span>
            `;
            
            card.addEventListener('click', () => {
                window.open(website.url, '_blank');
            });
            
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                contextMenuWebsiteId = website.id;
                showContextMenu(elements.contextMenu, e.pageX, e.pageY);
            });
            
            elements.websiteCards.insertBefore(card, elements.addWebsiteCard);
        });
        
        // Enable drag sorting
        enableDragSort(elements.websiteCards, '.website-card:not(#add-website-card)', onWebsitesReordered);
    }

    // Update search engine dropdown
    function updateSearchEngineDropdown() {
        elements.searchEngineList.innerHTML = '';
        
        state.searchEngines.forEach(engine => {
            const domain = getDomain(engine.url);
            const isActive = engine.id === state.activeSearchEngineId;
            
            const item = document.createElement('div');
            item.className = `search-engine-item ${isActive ? 'selected' : ''}`;
            item.dataset.id = engine.id;
            item.innerHTML = `
                <img src="${getFaviconUrl(domain)}" alt="${engine.name}" class="w-5 h-5 mr-3">
                <span class="text-sm">${engine.name}</span>
                ${isActive ? '<svg class="ml-auto" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="blue" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            `;
            
            item.addEventListener('click', () => {
                setActiveSearchEngine(engine.id);
                hideSearchEngineDropdown();
            });
            
            elements.searchEngineList.appendChild(item);
        });
    }

    // Set active search engine
    function setActiveSearchEngine(engineId) {
        const engine = state.searchEngines.find(e => e.id === engineId);
        if (engine) {
            state.activeSearchEngineId = engineId;
            elements.searchEngineIcon.src = getFaviconUrl(getDomain(engine.url));
            elements.searchEngineIcon.alt = engine.name;
            saveToLocalStorage('activeSearchEngineId', engineId);
            updateSearchEngineDropdown();
        }
    }

    // Show search engine dropdown
    function showSearchEngineDropdown() {
        isSearchEngineDropdownOpen = true;
        elements.searchEngineDropdown.classList.remove('hidden');
    }

    // Hide search engine dropdown
    function hideSearchEngineDropdown() {
        isSearchEngineDropdownOpen = false;
        elements.searchEngineDropdown.classList.add('hidden');
    }

    // Perform search
    function performSearch(query) {
        if (!query.trim()) return;
        
        const activeEngine = state.searchEngines.find(engine => engine.id === state.activeSearchEngineId);
        if (activeEngine) {
            const searchUrl = activeEngine.url.replace('%s', encodeURIComponent(query));
            window.open(searchUrl, '_blank');
        }
    }

    // Show add/edit website modal
    function showWebsiteModal(websiteId = null) {
        const isEditing = !!websiteId;
        
        elements.websiteModalTitle.textContent = isEditing ? 'Edit Website' : 'Add Website';
        elements.deleteWebsite.classList.toggle('hidden', !isEditing);
        
        if (isEditing) {
            const website = state.websites.find(site => site.id === websiteId);
            if (website) {
                elements.websiteId.value = website.id;
                elements.websiteUrl.value = website.url;
                elements.websiteName.value = website.name;
            }
        } else {
            elements.websiteId.value = '';
            elements.websiteUrl.value = '';
            elements.websiteName.value = '';
        }
        
        elements.addWebsiteModal.classList.remove('hidden');
    }

    // Hide website modal
    function hideWebsiteModal() {
        elements.addWebsiteModal.classList.add('hidden');
        elements.websiteForm.reset();
    }

    // Fetch website details from URL
    async function fetchWebsiteDetails(url) {
        const domain = getDomain(url);
        return {
            name: domain.replace(/^www\./, ''),
            faviconUrl: getFaviconUrl(domain)
        };
    }

    // Save website
    function saveWebsite(websiteData) {
        const { id, url, name } = websiteData;
        
        if (id) {
            // Update existing website
            const index = state.websites.findIndex(site => site.id === id);
            if (index !== -1) {
                state.websites[index] = { id, url, name };
            }
        } else {
            // Add new website
            const newWebsite = {
                id: generateId(),
                url,
                name
            };
            state.websites.push(newWebsite);
        }
        
        saveToLocalStorage('websites', state.websites);
        renderWebsites();
    }

    // Delete website
    function deleteWebsite(websiteId) {
        state.websites = state.websites.filter(site => site.id !== websiteId);
        saveToLocalStorage('websites', state.websites);
        renderWebsites();
    }

    // Handle websites reordering
    function onWebsitesReordered(newOrder) {
        // Update state based on the new order
        const newWebsites = [];
        newOrder.forEach(item => {
            const id = item.dataset.id;
            const website = state.websites.find(site => site.id === id);
            if (website) {
                newWebsites.push(website);
            }
        });
        
        state.websites = newWebsites;
        saveToLocalStorage('websites', state.websites);
    }

    // Attach event listeners
    function attachEventListeners() {
        // Search input
        elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
                e.target.value = '';
            } else if (e.key === 'Escape') {
                hideSearchEngineDropdown();
            } else if (e.key === '/') {
                if (e.target.value === '') {
                    e.preventDefault();
                    showSearchEngineDropdown();
                }
            } else if (isSearchEngineDropdownOpen) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    
                    const items = elements.searchEngineList.querySelectorAll('.search-engine-item');
                    const activeItemIndex = Array.from(items).findIndex(
                        item => item.dataset.id === state.activeSearchEngineId
                    );
                    
                    let nextIndex;
                    if (e.key === 'ArrowDown') {
                        nextIndex = activeItemIndex < items.length - 1 ? activeItemIndex + 1 : 0;
                    } else {
                        nextIndex = activeItemIndex > 0 ? activeItemIndex - 1 : items.length - 1;
                    }
                    
                    setActiveSearchEngine(items[nextIndex].dataset.id);
                }
            }
        });
        
        // Show dropdown when typing /
        elements.searchInput.addEventListener('input', (e) => {
            if (e.target.value === '/') {
                showSearchEngineDropdown();
                e.target.value = '';
            }
        });
        
        // Search engine button
        elements.searchEngineButton.addEventListener('click', () => {
            if (isSearchEngineDropdownOpen) {
                hideSearchEngineDropdown();
            } else {
                showSearchEngineDropdown();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (isSearchEngineDropdownOpen &&
                !elements.searchEngineDropdown.contains(e.target) &&
                !elements.searchEngineButton.contains(e.target) &&
                e.target !== elements.searchInput) {
                hideSearchEngineDropdown();
            }
        });
        
        // Add website card
        elements.addWebsiteCard.addEventListener('click', () => {
            showWebsiteModal();
        });
        
        // Close website modal
        elements.closeWebsiteModal.addEventListener('click', hideWebsiteModal);
        
        // Website form submit
        elements.websiteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = elements.websiteId.value;
            const url = elements.websiteUrl.value;
            const name = elements.websiteName.value;
            
            saveWebsite({ id, url, name });
            hideWebsiteModal();
        });
        
        // Auto-fill website details
        elements.websiteUrl.addEventListener('blur', async (e) => {
            if (!elements.websiteName.value && e.target.value) {
                try {
                    const details = await fetchWebsiteDetails(e.target.value);
                    elements.websiteName.value = details.name;
                } catch (error) {
                    console.error('Error fetching website details:', error);
                }
            }
        });
        
        // Delete website button
        elements.deleteWebsite.addEventListener('click', () => {
            const id = elements.websiteId.value;
            if (id) {
                deleteWebsite(id);
                hideWebsiteModal();
            }
        });
        
        // Context menu edit button
        elements.editWebsiteButton.addEventListener('click', () => {
            showWebsiteModal(contextMenuWebsiteId);
            hideContextMenu(elements.contextMenu);
        });
        
        // Setup context menu listeners
        setupContextMenuCloseListener(elements.contextMenu);
        
        // Close context menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideContextMenu(elements.contextMenu);
                if (isSearchEngineDropdownOpen) {
                    hideSearchEngineDropdown();
                }
            }
        });
    }
    
    // Initialize the app
    init();
});
