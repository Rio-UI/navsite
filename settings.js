/**
 * Settings logic for the web navigation app
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const elements = {
        // Settings button and modal
        settingsButton: document.getElementById('settings-button'),
        settingsModal: document.getElementById('settings-modal'),
        closeSettings: document.getElementById('close-settings'),
        
        // Background settings
        enableBackground: document.getElementById('enable-background'),
        backgroundSettings: document.getElementById('background-settings'),
        backgroundUrl: document.getElementById('background-url'),
        backgroundOpacity: document.getElementById('background-opacity'),
        backgroundBlur: document.getElementById('background-blur'),
        opacityValue: document.getElementById('opacity-value'),
        blurValue: document.getElementById('blur-value'),
        backgroundOverlay: document.getElementById('background-overlay'),
        
        // Search engine settings
        searchEnginesList: document.getElementById('search-engines-list'),
        addSearchEngine: document.getElementById('add-search-engine'),
        
        // Search engine modal
        searchEngineModal: document.getElementById('search-engine-modal'),
        searchEngineModalTitle: document.getElementById('search-engine-modal-title'),
        closeSearchEngineModal: document.getElementById('close-search-engine-modal'),
        searchEngineForm: document.getElementById('search-engine-form'),
        searchEngineId: document.getElementById('search-engine-id'),
        searchEngineUrl: document.getElementById('search-engine-url'),
        searchEngineName: document.getElementById('search-engine-name'),
        deleteSearchEngine: document.getElementById('delete-search-engine'),
        saveSearchEngine: document.getElementById('save-search-engine'),
        
        // Data import/export
        exportData: document.getElementById('export-data'),
        importFile: document.getElementById('import-file')
    };
    
    // Settings state
    const settings = {
        background: loadFromLocalStorage('backgroundSettings', {
            enabled: false,
            url: '',
            opacity: 0.5,
            blur: 5
        })
    };
    
    // Current context
    let editingSearchEngineId = null;
    
    // Initialize settings
    function init() {
        loadBackgroundSettings();
        renderSearchEngines();
        attachEventListeners();
    }
    
    // Load background settings
    function loadBackgroundSettings() {
        elements.enableBackground.checked = settings.background.enabled;
        elements.backgroundUrl.value = settings.background.url || '';
        elements.backgroundOpacity.value = settings.background.opacity;
        elements.backgroundBlur.value = settings.background.blur;
        elements.opacityValue.textContent = settings.background.opacity;
        elements.blurValue.textContent = `${settings.background.blur}px`;
        
        // Toggle background settings visibility
        toggleBackgroundSettings();
        
        // Apply background if enabled
        applyBackgroundSettings();
    }
    
    // Toggle background settings visibility
    function toggleBackgroundSettings() {
        if (elements.enableBackground.checked) {
            elements.backgroundSettings.classList.remove('hidden');
        } else {
            elements.backgroundSettings.classList.add('hidden');
        }
    }
    
    // Apply background settings
    function applyBackgroundSettings() {
        const { enabled, url, opacity, blur } = settings.background;
        
        if (enabled && url) {
            elements.backgroundOverlay.style.backgroundImage = `url(${url})`;
            elements.backgroundOverlay.style.opacity = opacity;
            elements.backgroundOverlay.style.filter = `blur(${blur}px)`;
            elements.backgroundOverlay.classList.remove('hidden');
        } else {
            elements.backgroundOverlay.classList.add('hidden');
        }
    }
    
    // Save background settings
    function saveBackgroundSettings() {
        settings.background = {
            enabled: elements.enableBackground.checked,
            url: elements.backgroundUrl.value,
            opacity: parseFloat(elements.backgroundOpacity.value),
            blur: parseInt(elements.backgroundBlur.value, 10)
        };
        
        saveToLocalStorage('backgroundSettings', settings.background);
        applyBackgroundSettings();
    }
    
    // Render search engines in settings
    function renderSearchEngines() {
        const searchEngines = loadFromLocalStorage('searchEngines', []);
        elements.searchEnginesList.innerHTML = '';
        
        searchEngines.forEach(engine => {
            const domain = getDomain(engine.url);
            const item = document.createElement('div');
            item.className = 'search-engine-settings-item';
            item.dataset.id = engine.id;
            item.innerHTML = `
                <div class="drag-handle mr-2 cursor-move text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="5" r="1"></circle>
                        <circle cx="9" cy="12" r="1"></circle>
                        <circle cx="9" cy="19" r="1"></circle>
                        <circle cx="15" cy="5" r="1"></circle>
                        <circle cx="15" cy="12" r="1"></circle>
                        <circle cx="15" cy="19" r="1"></circle>
                    </svg>
                </div>
                <img src="${getFaviconUrl(domain)}" alt="${engine.name}" class="w-5 h-5 mr-3">
                <span class="text-sm flex-1">${engine.name}</span>
                <button class="edit-search-engine p-1 hover:bg-gray-100 rounded-full transition-colors" data-id="${engine.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                </button>
            `;
            
            // Add edit event listener
            item.querySelector('.edit-search-engine').addEventListener('click', () => {
                showSearchEngineModal(engine.id);
            });
            
            elements.searchEnginesList.appendChild(item);
        });
        
        // Enable drag sorting
        enableDragSort(elements.searchEnginesList, '.search-engine-settings-item', onSearchEnginesReordered);
    }
    
    // Handle search engines reordering
    function onSearchEnginesReordered(newOrder) {
        // Get current search engines
        const searchEngines = loadFromLocalStorage('searchEngines', []);
        
        // Create new order
        const newEngines = [];
        newOrder.forEach(item => {
            const id = item.dataset.id;
            const engine = searchEngines.find(e => e.id === id);
            if (engine) {
                newEngines.push(engine);
            }
        });
        
        // Save new order
        saveToLocalStorage('searchEngines', newEngines);
        
        // Update dropdown in the main app
        updateMainAppSearchEngineDropdown();
    }
    
    // Show search engine modal for add/edit
    function showSearchEngineModal(engineId = null) {
        const isEditing = !!engineId;
        editingSearchEngineId = engineId;
        
        elements.searchEngineModalTitle.textContent = isEditing ? 'Edit Search Engine' : 'Add Search Engine';
        elements.deleteSearchEngine.classList.toggle('hidden', !isEditing);
        
        if (isEditing) {
            const searchEngines = loadFromLocalStorage('searchEngines', []);
            const engine = searchEngines.find(e => e.id === engineId);
            if (engine) {
                elements.searchEngineId.value = engine.id;
                elements.searchEngineUrl.value = engine.url;
                elements.searchEngineName.value = engine.name;
            }
        } else {
            elements.searchEngineId.value = '';
            elements.searchEngineUrl.value = '';
            elements.searchEngineName.value = '';
        }
        
        elements.searchEngineModal.classList.remove('hidden');
    }
    
    // Hide search engine modal
    function hideSearchEngineModal() {
        elements.searchEngineModal.classList.add('hidden');
        elements.searchEngineForm.reset();
    }
    
    // Auto-fill search engine name from URL
    async function fetchSearchEngineName(url) {
        const domain = getDomain(url);
        return domain.replace(/^www\./, '');
    }
    
    // Save search engine
    function saveSearchEngine(engineData) {
        const { id, url, name } = engineData;
        const searchEngines = loadFromLocalStorage('searchEngines', []);
        
        if (id) {
            // Update existing engine
            const index = searchEngines.findIndex(engine => engine.id === id);
            if (index !== -1) {
                searchEngines[index] = { id, url, name };
            }
        } else {
            // Add new engine
            const newEngine = {
                id: generateId(),
                url,
                name
            };
            searchEngines.push(newEngine);
        }
        
        // Save to localStorage
        saveToLocalStorage('searchEngines', searchEngines);
        
        // Update search engines list
        renderSearchEngines();
        
        // Update dropdown in the main app
        updateMainAppSearchEngineDropdown();
    }
    
    // Delete search engine
    function deleteSearchEngine(engineId) {
        let searchEngines = loadFromLocalStorage('searchEngines', []);
        
        // Don't delete the last search engine
        if (searchEngines.length <= 1) {
            alert('Cannot delete the last search engine.');
            return false;
        }
        
        searchEngines = searchEngines.filter(engine => engine.id !== engineId);
        saveToLocalStorage('searchEngines', searchEngines);
        
        // Check if the deleted engine was the active one
        const activeEngineId = loadFromLocalStorage('activeSearchEngineId');
        if (activeEngineId === engineId) {
            // Set the first engine as active
            saveToLocalStorage('activeSearchEngineId', searchEngines[0].id);
        }
        
        // Update search engine list
        renderSearchEngines();
        
        // Update dropdown in the main app
        updateMainAppSearchEngineDropdown();
        
        return true;
    }
    
    // Update search engine dropdown in the main app
    function updateMainAppSearchEngineDropdown() {
        // We'll use an event to communicate with the main app
        const event = new CustomEvent('searchEnginesUpdated');
        document.dispatchEvent(event);
    }
    
    // Export data as JSON
    function exportAppData() {
        const data = {
            websites: loadFromLocalStorage('websites', []),
            searchEngines: loadFromLocalStorage('searchEngines', []),
            activeSearchEngineId: loadFromLocalStorage('activeSearchEngineId'),
            backgroundSettings: loadFromLocalStorage('backgroundSettings')
        };
        
        downloadJson(data, 'web-navigation-backup.json');
    }
    
    // Import data from JSON
    async function importAppData(file) {
        try {
            const data = await readJsonFile(file);
            
            // Validate data
            if (!data.websites || !Array.isArray(data.websites)) {
                throw new Error('Invalid websites data');
            }
            
            if (!data.searchEngines || !Array.isArray(data.searchEngines)) {
                throw new Error('Invalid search engines data');
            }
            
            // Save data
            saveToLocalStorage('websites', data.websites);
            saveToLocalStorage('searchEngines', data.searchEngines);
            
            if (data.activeSearchEngineId) {
                saveToLocalStorage('activeSearchEngineId', data.activeSearchEngineId);
            }
            
            if (data.backgroundSettings) {
                saveToLocalStorage('backgroundSettings', data.backgroundSettings);
                settings.background = data.backgroundSettings;
                loadBackgroundSettings();
            }
            
            // Refresh UI
            renderSearchEngines();
            
            // Update main app
            window.location.reload();
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Failed to import data. Please check the file format.');
            return false;
        }
    }
    
    // Attach event listeners
    function attachEventListeners() {
        // Settings button
        elements.settingsButton.addEventListener('click', () => {
            elements.settingsModal.classList.remove('hidden');
        });
        
        // Close settings
        elements.closeSettings.addEventListener('click', () => {
            elements.settingsModal.classList.add('hidden');
        });
        
        // Background toggle
        elements.enableBackground.addEventListener('change', () => {
            toggleBackgroundSettings();
            saveBackgroundSettings();
        });
        
        // Background URL
        elements.backgroundUrl.addEventListener('change', saveBackgroundSettings);
        
        // Background opacity slider
        elements.backgroundOpacity.addEventListener('input', (e) => {
            elements.opacityValue.textContent = e.target.value;
            saveBackgroundSettings();
        });
        
        // Background blur slider
        elements.backgroundBlur.addEventListener('input', (e) => {
            elements.blurValue.textContent = `${e.target.value}px`;
            saveBackgroundSettings();
        });
        
        // Add search engine
        elements.addSearchEngine.addEventListener('click', () => {
            showSearchEngineModal();
        });
        
        // Close search engine modal
        elements.closeSearchEngineModal.addEventListener('click', hideSearchEngineModal);
        
        // Search engine form submit
        elements.searchEngineForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = elements.searchEngineId.value;
            const url = elements.searchEngineUrl.value;
            const name = elements.searchEngineName.value;
            
            saveSearchEngine({ id, url, name });
            hideSearchEngineModal();
        });
        
        // Auto-fill search engine name
        elements.searchEngineUrl.addEventListener('blur', async (e) => {
            if (!elements.searchEngineName.value && e.target.value) {
                try {
                    const name = await fetchSearchEngineName(e.target.value);
                    elements.searchEngineName.value = name;
                } catch (error) {
                    console.error('Error fetching search engine name:', error);
                }
            }
        });
        
        // Delete search engine
        elements.deleteSearchEngine.addEventListener('click', () => {
            if (editingSearchEngineId) {
                const success = deleteSearchEngine(editingSearchEngineId);
                if (success) {
                    hideSearchEngineModal();
                }
            }
        });
        
        // Export data
        elements.exportData.addEventListener('click', exportAppData);
        
        // Import data
        elements.importFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importAppData(e.target.files[0]);
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                elements.settingsModal.classList.add('hidden');
            }
            if (e.target === elements.searchEngineModal) {
                elements.searchEngineModal.classList.add('hidden');
            }
        });
    }
    
    // Call init function
    init();
    
    // Listen for search engines updated event (from main app)
    document.addEventListener('searchEnginesUpdated', renderSearchEngines);
});
