document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Initialize the application
    initApp();
});

function initApp() {
    // Load data from store
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize the UI
    initializeUI();
}

function loadData() {
    // Load sites, search engines, and settings from the store
    Store.loadAll();
}

function setupEventListeners() {
    // Search functionality
    setupSearchFunctionality();
    
    // Sites management
    setupSitesManagement();
    
    // Settings functionality
    setupSettingsManagement();
    
    // Modal events
    setupModalEvents();
    
    // Drag and drop
    setupDragAndDrop();
}

function initializeUI() {
    // Render sites grid
    renderSites();
    
    // Render search engine dropdown
    renderSearchEngineDropdown();
    
    // Set current search engine
    updateCurrentSearchEngine();
    
    // Initialize background settings
    initBackgroundSettings();
}

function setupSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const searchEngineIcon = document.getElementById('search-engine-icon');
    const searchEngineDropdown = document.getElementById('search-engine-dropdown');
    
    // Handle search form submission
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                const currentEngine = Store.data.searchEngines.find(engine => engine.id === Store.data.settings.currentSearchEngine);
                if (currentEngine) {
                    const searchUrl = currentEngine.url.replace('%s', encodeURIComponent(query));
                    window.open(searchUrl, '_blank');
                }
            }
        }
    });
    
    // Handle search engine dropdown toggle
    searchEngineIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        searchEngineDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        searchEngineDropdown.classList.add('hidden');
    });
    
    // Prevent dropdown from closing when clicking inside it
    searchEngineDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function setupSitesManagement() {
    const addSiteCard = document.getElementById('add-site-card');
    const addSiteModal = document.getElementById('add-site-modal');
    const addSiteForm = document.getElementById('add-site-form');
    const siteUrlInput = document.getElementById('site-url');
    const siteNameInput = document.getElementById('site-name');
    const siteFaviconPreview = document.getElementById('site-favicon-preview');
    const siteNamePreview = document.getElementById('site-name-preview');
    const previewContainer = document.querySelector('#add-site-modal .preview-container');
    
    // Open add site modal
    addSiteCard.addEventListener('click', () => {
        openModal(addSiteModal);
        siteUrlInput.value = '';
        siteNameInput.value = '';
        previewContainer.classList.add('hidden');
    });
    
    // Handle URL input for auto-detection
    siteUrlInput.addEventListener('input', debounce(async () => {
        const url = siteUrlInput.value.trim();
        if (isValidUrl(url)) {
            try {
                const { domain, name, favicon } = await getSiteInfo(url);
                siteNameInput.value = name;
                siteFaviconPreview.src = favicon;
                siteNamePreview.textContent = name;
                previewContainer.classList.remove('hidden');
            } catch (error) {
                console.error('Error fetching site info:', error);
                previewContainer.classList.add('hidden');
            }
        } else {
            previewContainer.classList.add('hidden');
        }
    }, 500));
    
    // Handle add site form submission
    addSiteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = siteUrlInput.value.trim();
        if (!isValidUrl(url)) {
            showToast('Please enter a valid URL');
            return;
        }
        
        let name = siteNameInput.value.trim();
        if (!name) {
            try {
                const siteInfo = await getSiteInfo(url);
                name = siteInfo.name;
            } catch (error) {
                name = new URL(url).hostname.replace('www.', '');
            }
        }
        
        const { domain, favicon } = getDomainAndFavicon(url);
        
        const newSite = {
            id: generateId(),
            url,
            name,
            favicon,
            domain
        };
        
        Store.addSite(newSite);
        renderSites();
        closeModal(addSiteModal);
    });
    
    // Setup edit site functionality
    setupEditSiteFunctionality();
}

function setupEditSiteFunctionality() {
    const editSiteModal = document.getElementById('edit-site-modal');
    const editSiteForm = document.getElementById('edit-site-form');
    const editSiteIdInput = document.getElementById('edit-site-id');
    const editSiteUrlInput = document.getElementById('edit-site-url');
    const editSiteNameInput = document.getElementById('edit-site-name');
    const editSiteFaviconPreview = document.getElementById('edit-site-favicon-preview');
    const editSiteNamePreview = document.getElementById('edit-site-name-preview');
    const deleteSiteBtn = document.getElementById('delete-site-btn');
    
    // Handle edit site form submission
    editSiteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = editSiteIdInput.value;
        const url = editSiteUrlInput.value.trim();
        let name = editSiteNameInput.value.trim();
        
        if (!isValidUrl(url)) {
            showToast('Please enter a valid URL');
            return;
        }
        
        if (!name) {
            try {
                const siteInfo = await getSiteInfo(url);
                name = siteInfo.name;
            } catch (error) {
                name = new URL(url).hostname.replace('www.', '');
            }
        }
        
        const { domain, favicon } = getDomainAndFavicon(url);
        
        const updatedSite = {
            id,
            url,
            name,
            favicon,
            domain
        };
        
        Store.updateSite(updatedSite);
        renderSites();
        closeModal(editSiteModal);
    });
    
    // Handle URL input for auto-detection in edit mode
    editSiteUrlInput.addEventListener('input', debounce(async () => {
        const url = editSiteUrlInput.value.trim();
        if (isValidUrl(url)) {
            try {
                const { domain, name, favicon } = await getSiteInfo(url);
                editSiteNameInput.value = name;
                editSiteFaviconPreview.src = favicon;
                editSiteNamePreview.textContent = name;
            } catch (error) {
                console.error('Error fetching site info:', error);
            }
        }
    }, 500));
    
    // Handle delete site
    deleteSiteBtn.addEventListener('click', () => {
        const id = editSiteIdInput.value;
        const site = Store.data.sites.find(site => site.id === id);
        
        if (confirm(`Are you sure you want to delete "${site.name}"?`)) {
            Store.deleteSite(id);
            renderSites();
            closeModal(editSiteModal);
        }
    });
}

function setupSettingsManagement() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const backgroundUrlInput = document.getElementById('background-url');
    const backgroundOpacityInput = document.getElementById('background-opacity');
    const backgroundBlurInput = document.getElementById('background-blur');
    const opacityValueEl = document.getElementById('opacity-value');
    const blurValueEl = document.getElementById('blur-value');
    const backgroundPreview = document.getElementById('background-preview');
    const addSearchEngineBtn = document.getElementById('add-search-engine');
    const addSearchEngineModal = document.getElementById('add-search-engine-modal');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file');
    
    // Open settings modal
    settingsBtn.addEventListener('click', () => {
        openModal(settingsModal);
        renderSearchEnginesSettings();
    });
    
    // Background settings
    backgroundUrlInput.addEventListener('input', debounce(() => {
        const url = backgroundUrlInput.value.trim();
        if (url) {
            backgroundPreview.style.backgroundImage = `url(${url})`;
        } else {
            backgroundPreview.style.backgroundImage = 'none';
        }
        
        Store.updateSettings({
            ...Store.data.settings,
            background: {
                ...Store.data.settings.background,
                url
            }
        });
        
        applyBackgroundSettings();
    }, 500));
    
    backgroundOpacityInput.addEventListener('input', () => {
        const opacity = backgroundOpacityInput.value;
        opacityValueEl.textContent = opacity;
        backgroundPreview.style.opacity = opacity;
        
        Store.updateSettings({
            ...Store.data.settings,
            background: {
                ...Store.data.settings.background,
                opacity
            }
        });
        
        applyBackgroundSettings();
    });
    
    backgroundBlurInput.addEventListener('input', () => {
        const blur = backgroundBlurInput.value;
        blurValueEl.textContent = `${blur}px`;
        backgroundPreview.style.filter = `blur(${blur}px)`;
        
        Store.updateSettings({
            ...Store.data.settings,
            background: {
                ...Store.data.settings.background,
                blur
            }
        });
        
        applyBackgroundSettings();
    });
    
    // Add search engine button
    addSearchEngineBtn.addEventListener('click', () => {
        openModal(addSearchEngineModal);
        document.getElementById('search-engine-url').value = '';
        document.getElementById('search-engine-name').value = '';
        document.querySelector('#add-search-engine-modal .preview-container').classList.add('hidden');
    });
    
    // Setup search engine management
    setupSearchEngineManagement();
    
    // Export data
    exportDataBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(Store.data);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'navigator-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });
    
    // Import data
    importDataBtn.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    Store.importData(importedData);
                    
                    // Refresh the UI
                    renderSites();
                    renderSearchEngineDropdown();
                    updateCurrentSearchEngine();
                    initBackgroundSettings();
                    renderSearchEnginesSettings();
                    
                    showToast('Data imported successfully');
                } catch (error) {
                    console.error('Error importing data:', error);
                    showToast('Error importing data');
                }
            };
            reader.readAsText(file);
        }
    });
}

function setupSearchEngineManagement() {
    const addSearchEngineForm = document.getElementById('add-search-engine-form');
    const searchEngineUrlInput = document.getElementById('search-engine-url');
    const searchEngineNameInput = document.getElementById('search-engine-name');
    const searchEngineFaviconPreview = document.getElementById('search-engine-favicon-preview');
    const searchEngineNamePreview = document.getElementById('search-engine-name-preview');
    const previewContainer = document.querySelector('#add-search-engine-modal .preview-container');
    
    const editSearchEngineModal = document.getElementById('edit-search-engine-modal');
    const editSearchEngineForm = document.getElementById('edit-search-engine-form');
    const editSearchEngineIdInput = document.getElementById('edit-search-engine-id');
    const editSearchEngineUrlInput = document.getElementById('edit-search-engine-url');
    const editSearchEngineNameInput = document.getElementById('edit-search-engine-name');
    const editSearchEngineFaviconPreview = document.getElementById('edit-search-engine-favicon-preview');
    const editSearchEngineNamePreview = document.getElementById('edit-search-engine-name-preview');
    const deleteSearchEngineBtn = document.getElementById('delete-search-engine-btn');
    
    // Handle URL input for auto-detection
    searchEngineUrlInput.addEventListener('input', debounce(() => {
        const url = searchEngineUrlInput.value.trim();
        if (url && url.includes('%s')) {
            try {
                const { domain, favicon, name } = getSearchEngineDomainInfo(url);
                searchEngineNameInput.value = name;
                searchEngineFaviconPreview.src = favicon;
                searchEngineNamePreview.textContent = name;
                previewContainer.classList.remove('hidden');
            } catch (error) {
                console.error('Error parsing search engine URL:', error);
                previewContainer.classList.add('hidden');
            }
        } else {
            previewContainer.classList.add('hidden');
        }
    }, 500));
    
    // Handle add search engine form submission
    addSearchEngineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const url = searchEngineUrlInput.value.trim();
        if (!url || !url.includes('%s')) {
            showToast('Please enter a valid search URL with %s placeholder');
            return;
        }
        
        let name = searchEngineNameInput.value.trim();
        if (!name) {
            try {
                const { name: detectedName } = getSearchEngineDomainInfo(url);
                name = detectedName;
            } catch (error) {
                name = 'Custom Search';
            }
        }
        
        const { domain, favicon } = getSearchEngineDomainInfo(url);
        
        const newSearchEngine = {
            id: generateId(),
            url,
            name,
            favicon,
            domain
        };
        
        Store.addSearchEngine(newSearchEngine);
        renderSearchEnginesSettings();
        closeModal(document.getElementById('add-search-engine-modal'));
    });
    
    // Handle edit search engine URL input
    editSearchEngineUrlInput.addEventListener('input', debounce(() => {
        const url = editSearchEngineUrlInput.value.trim();
        if (url && url.includes('%s')) {
            try {
                const { domain, favicon, name } = getSearchEngineDomainInfo(url);
                editSearchEngineNameInput.value = name;
                editSearchEngineFaviconPreview.src = favicon;
                editSearchEngineNamePreview.textContent = name;
            } catch (error) {
                console.error('Error parsing search engine URL:', error);
            }
        }
    }, 500));
    
    // Handle edit search engine form submission
    editSearchEngineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = editSearchEngineIdInput.value;
        const url = editSearchEngineUrlInput.value.trim();
        let name = editSearchEngineNameInput.value.trim();
        
        if (!url || !url.includes('%s')) {
            showToast('Please enter a valid search URL with %s placeholder');
            return;
        }
        
        if (!name) {
            try {
                const { name: detectedName } = getSearchEngineDomainInfo(url);
                name = detectedName;
            } catch (error) {
                name = 'Custom Search';
            }
        }
        
        const { domain, favicon } = getSearchEngineDomainInfo(url);
        
        const updatedSearchEngine = {
            id,
            url,
            name,
            favicon,
            domain
        };
        
        Store.updateSearchEngine(updatedSearchEngine);
        
        // Update UI components
        renderSearchEnginesSettings();
        renderSearchEngineDropdown();
        updateCurrentSearchEngine();
        
        closeModal(editSearchEngineModal);
    });
    
    // Handle delete search engine
    deleteSearchEngineBtn.addEventListener('click', () => {
        const id = editSearchEngineIdInput.value;
        const searchEngine = Store.data.searchEngines.find(engine => engine.id === id);
        
        if (Store.data.searchEngines.length <= 1) {
            showToast('You must have at least one search engine');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${searchEngine.name}"?`)) {
            // If the current search engine is being deleted, set the first available as current
            if (Store.data.settings.currentSearchEngine === id) {
                const firstAvailableEngine = Store.data.searchEngines.find(engine => engine.id !== id);
                if (firstAvailableEngine) {
                    Store.updateSettings({
                        ...Store.data.settings,
                        currentSearchEngine: firstAvailableEngine.id
                    });
                }
            }
            
            Store.deleteSearchEngine(id);
            
            // Update UI components
            renderSearchEnginesSettings();
            renderSearchEngineDropdown();
            updateCurrentSearchEngine();
            
            closeModal(editSearchEngineModal);
        }
    });
}

function setupModalEvents() {
    // Close modals when clicking on cancel buttons
    document.querySelectorAll('.modal-cancel').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Prevent modals from closing when clicking on the modal content
    document.querySelectorAll('.modal-container').forEach(container => {
        container.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

function setupDragAndDrop() {
    // Sites drag and drop
    const sitesGrid = document.getElementById('sites-grid');
    
    // Track the dragged element and drop target
    let draggedSite = null;
    let dropTarget = null;
    
    // Add drag event listeners to site cards (will be added when rendering sites)
    
    // Search engines drag and drop (settings page)
    const searchEnginesSettingsList = document.getElementById('search-engines-settings-list');
    
    // Track the dragged search engine and drop target
    let draggedSearchEngine = null;
    let dropTargetSearchEngine = null;
    
    // Add drag event listeners to search engine items (will be added when rendering search engines settings)
}

function renderSites() {
    const sitesGrid = document.getElementById('sites-grid');
    const addSiteCard = document.getElementById('add-site-card');
    
    // Remove existing site cards
    document.querySelectorAll('.site-card:not(#add-site-card)').forEach(card => card.remove());
    
    // Add site cards
    Store.data.sites.forEach(site => {
        const siteCard = createSiteCard(site);
        sitesGrid.insertBefore(siteCard, addSiteCard);
    });
    
    // Setup drag and drop for site cards
    setupSitesDragAndDrop();
}

function createSiteCard(site) {
    const siteCard = document.createElement('div');
    siteCard.className = 'site-card p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200';
    siteCard.setAttribute('data-id', site.id);
    siteCard.setAttribute('draggable', 'true');
    
    siteCard.innerHTML = `
        <img src="${site.favicon}" alt="${site.name}" class="w-6 h-6 mb-2" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(site.name)}&background=random&size=24'">
        <div class="text-xs text-center truncate w-full" title="${site.name}">${site.name}</div>
    `;
    
    // Add click event to open site
    siteCard.addEventListener('click', () => {
        window.open(site.url, '_blank');
    });
    
    // Add context menu for edit
    siteCard.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openEditSiteModal(site.id);
    });
    
    return siteCard;
}

function setupSitesDragAndDrop() {
    const siteCards = document.querySelectorAll('.site-card:not(#add-site-card)');
    const sitesGrid = document.getElementById('sites-grid');
    
    let draggedSite = null;
    
    siteCards.forEach(card => {
        // Drag start
        card.addEventListener('dragstart', (e) => {
            draggedSite = card;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => {
                card.classList.add('opacity-50');
            }, 0);
        });
        
        // Drag end
        card.addEventListener('dragend', () => {
            draggedSite.classList.remove('opacity-50');
            draggedSite = null;
            
            // Remove all drag-over styling
            siteCards.forEach(c => c.classList.remove('drag-over'));
        });
        
        // Drag over
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (card !== draggedSite) {
                card.classList.add('drag-over');
            }
        });
        
        // Drag leave
        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });
        
        // Drop
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (draggedSite && card !== draggedSite) {
                const draggedId = draggedSite.getAttribute('data-id');
                const targetId = card.getAttribute('data-id');
                
                // Reorder sites in the store
                Store.reorderSites(draggedId, targetId);
                
                // Render updated sites
                renderSites();
            }
            
            // Remove drag-over styling
            card.classList.remove('drag-over');
        });
    });
}

function renderSearchEngineDropdown() {
    const searchEnginesList = document.getElementById('search-engines-list');
    searchEnginesList.innerHTML = '';
    
    Store.data.searchEngines.forEach(engine => {
        const item = document.createElement('div');
        item.className = 'flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer';
        item.setAttribute('data-id', engine.id);
        
        item.innerHTML = `
            <img src="${engine.favicon}" alt="${engine.name}" class="w-5 h-5 mr-3" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(engine.name)}&background=random&size=24'">
            <span class="text-sm">${engine.name}</span>
        `;
        
        item.addEventListener('click', () => {
            Store.updateSettings({
                ...Store.data.settings,
                currentSearchEngine: engine.id
            });
            
            updateCurrentSearchEngine();
            document.getElementById('search-engine-dropdown').classList.add('hidden');
        });
        
        searchEnginesList.appendChild(item);
    });
}

function updateCurrentSearchEngine() {
    const currentEngineId = Store.data.settings.currentSearchEngine;
    const currentEngine = Store.data.searchEngines.find(engine => engine.id === currentEngineId) || Store.data.searchEngines[0];
    
    if (currentEngine) {
        document.getElementById('current-engine-icon').src = currentEngine.favicon;
        document.getElementById('current-engine-icon').alt = currentEngine.name;
        
        if (!Store.data.settings.currentSearchEngine || Store.data.settings.currentSearchEngine !== currentEngine.id) {
            Store.updateSettings({
                ...Store.data.settings,
                currentSearchEngine: currentEngine.id
            });
        }
    }
}

function renderSearchEnginesSettings() {
    const searchEnginesSettingsList = document.getElementById('search-engines-settings-list');
    searchEnginesSettingsList.innerHTML = '';
    
    Store.data.searchEngines.forEach(engine => {
        const item = document.createElement('div');
        item.className = 'search-engines-item flex items-center p-3 hover:bg-gray-50';
        item.setAttribute('data-id', engine.id);
        item.setAttribute('draggable', 'true');
        
        item.innerHTML = `
            <div class="search-engines-handle mr-2 text-gray-400 cursor-grab">
                <i data-lucide="grip-vertical" class="w-4 h-4"></i>
            </div>
            <img src="${engine.favicon}" alt="${engine.name}" class="w-5 h-5 mr-3" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(engine.name)}&background=random&size=24'">
            <div class="flex-1">
                <div class="text-sm font-medium">${engine.name}</div>
                <div class="text-xs text-gray-500 truncate">${engine.url}</div>
            </div>
            <button class="edit-search-engine-btn p-2 text-gray-500 hover:text-gray-700">
                <i data-lucide="edit" class="w-4 h-4"></i>
            </button>
        `;
        
        // Add edit button click event
        item.querySelector('.edit-search-engine-btn').addEventListener('click', () => {
            openEditSearchEngineModal(engine.id);
        });
        
        searchEnginesSettingsList.appendChild(item);
    });
    
    // Initialize Lucide icons for the new elements
    lucide.createIcons({
        attrs: {
            class: ["w-4", "h-4"]
        }
    });
    
    // Setup drag and drop for search engines
    setupSearchEnginesDragAndDrop();
}

function setupSearchEnginesDragAndDrop() {
    const searchEngineItems = document.querySelectorAll('.search-engines-item');
    
    let draggedItem = null;
    
    searchEngineItems.forEach(item => {
        // Drag start
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            setTimeout(() => {
                item.classList.add('dragging');
            }, 0);
        });
        
        // Drag end
        item.addEventListener('dragend', () => {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            
            // Remove all drag-over styling
            searchEngineItems.forEach(i => i.classList.remove('drag-over'));
        });
        
        // Drag over
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            if (item !== draggedItem) {
                item.classList.add('drag-over');
            }
        });
        
        // Drag leave
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });
        
        // Drop
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (draggedItem && item !== draggedItem) {
                const draggedId = draggedItem.getAttribute('data-id');
                const targetId = item.getAttribute('data-id');
                
                // Reorder search engines in the store
                Store.reorderSearchEngines(draggedId, targetId);
                
                // Render updated search engines settings
                renderSearchEnginesSettings();
                
                // Update search engine dropdown
                renderSearchEngineDropdown();
            }
            
            item.classList.remove('drag-over');
        });
    });
}

function initBackgroundSettings() {
    const { background } = Store.data.settings;
    const backgroundOverlay = document.getElementById('background-overlay');
    const backgroundUrlInput = document.getElementById('background-url');
    const backgroundOpacityInput = document.getElementById('background-opacity');
    const backgroundBlurInput = document.getElementById('background-blur');
    const opacityValueEl = document.getElementById('opacity-value');
    const blurValueEl = document.getElementById('blur-value');
    const backgroundPreview = document.getElementById('background-preview');
    
    // Set input values
    backgroundUrlInput.value = background.url || '';
    backgroundOpacityInput.value = background.opacity || 0.2;
    backgroundBlurInput.value = background.blur || 4;
    
    // Set display values
    opacityValueEl.textContent = background.opacity || 0.2;
    blurValueEl.textContent = `${background.blur || 4}px`;
    
    // Set preview
    if (background.url) {
        backgroundPreview.style.backgroundImage = `url(${background.url})`;
        backgroundPreview.style.opacity = background.opacity || 0.2;
        backgroundPreview.style.filter = `blur(${background.blur || 4}px)`;
    } else {
        backgroundPreview.style.backgroundImage = 'none';
    }
    
    // Apply background settings
    applyBackgroundSettings();
}

function applyBackgroundSettings() {
    const { background } = Store.data.settings;
    const backgroundOverlay = document.getElementById('background-overlay');
    
    if (background.url) {
        backgroundOverlay.style.backgroundImage = `url(${background.url})`;
        backgroundOverlay.style.opacity = background.opacity || 0.2;
        backgroundOverlay.style.filter = `blur(${background.blur || 4}px)`;
        backgroundOverlay.classList.remove('opacity-0');
    } else {
        backgroundOverlay.classList.add('opacity-0');
    }
}

function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

function openEditSiteModal(siteId) {
    const editSiteModal = document.getElementById('edit-site-modal');
    const site = Store.data.sites.find(site => site.id === siteId);
    
    if (site) {
        document.getElementById('edit-site-id').value = site.id;
        document.getElementById('edit-site-url').value = site.url;
        document.getElementById('edit-site-name').value = site.name;
        document.getElementById('edit-site-favicon-preview').src = site.favicon;
        document.getElementById('edit-site-name-preview').textContent = site.name;
        
        openModal(editSiteModal);
    }
}

function openEditSearchEngineModal(engineId) {
    const editSearchEngineModal = document.getElementById('edit-search-engine-modal');
    const searchEngine = Store.data.searchEngines.find(engine => engine.id === engineId);
    
    if (searchEngine) {
        document.getElementById('edit-search-engine-id').value = searchEngine.id;
        document.getElementById('edit-search-engine-url').value = searchEngine.url;
        document.getElementById('edit-search-engine-name').value = searchEngine.name;
        document.getElementById('edit-search-engine-favicon-preview').src = searchEngine.favicon;
        document.getElementById('edit-search-engine-name-preview').textContent = searchEngine.name;
        
        openModal(editSearchEngineModal);
    }
}

async function getSiteInfo(url) {
    try {
        const { domain, favicon } = getDomainAndFavicon(url);
        
        // For a real implementation, you might want to use a backend API to scrape the page
        // and get the title. For this demo, we'll just use the domain name
        const name = domain.replace(/\.(com|org|net|io|co|dev)$/, '').replace('www.', '');
        
        return {
            domain,
            name: toTitleCase(name),
            favicon
        };
    } catch (error) {
        console.error('Error getting site info:', error);
        const domain = new URL(url).hostname;
        return {
            domain,
            name: domain.replace('www.', ''),
            favicon: `https://favicon.im/${domain}`
        };
    }
}

function getDomainAndFavicon(url) {
    // Add protocol if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const favicon = `https://favicon.im/${domain}`;
    
    return { domain, favicon };
}

function getSearchEngineDomainInfo(url) {
    // Extract domain from search URL
    let domain;
    try {
        if (url.includes('://')) {
            domain = new URL(url.split('%s')[0]).hostname;
        } else {
            // Handle cases without protocol
            const urlParts = url.split('/');
            domain = urlParts[0];
        }
    } catch (e) {
        // Fallback for parsing errors
        domain = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/i)[1];
    }
    
    // Clean up domain
    domain = domain.replace(/^www\./, '');
    
    // Generate a name from the domain
    const name = toTitleCase(domain.split('.')[0]);
    
    return {
        domain,
        name,
        favicon: `https://favicon.im/${domain}`
    };
}

function isValidUrl(string) {
    try {
        // Add protocol if not present
        if (!string.startsWith('http://') && !string.startsWith('https://')) {
            string = 'https://' + string;
        }
        
        const url = new URL(string);
        return url.hostname.includes('.');
    } catch (_) {
        return false;
    }
}

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function toTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-md transition-opacity duration-300 opacity-0 z-50';
        document.body.appendChild(toast);
    }
    
    // Set message and show
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 3000);
}
