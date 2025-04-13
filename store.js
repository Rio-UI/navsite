const Store = (function() {
    // Default data
    const defaultData = {
        sites: [
            {
                id: 'google',
                url: 'https://www.google.com',
                name: 'Google',
                favicon: 'https://favicon.im/google.com',
                domain: 'google.com'
            },
            {
                id: 'github',
                url: 'https://github.com',
                name: 'GitHub',
                favicon: 'https://favicon.im/github.com',
                domain: 'github.com'
            },
            {
                id: 'youtube',
                url: 'https://www.youtube.com',
                name: 'YouTube',
                favicon: 'https://favicon.im/youtube.com',
                domain: 'youtube.com'
            },
            {
                id: 'twitter',
                url: 'https://twitter.com',
                name: 'Twitter',
                favicon: 'https://favicon.im/twitter.com',
                domain: 'twitter.com'
            },
            {
                id: 'facebook',
                url: 'https://www.facebook.com',
                name: 'Facebook',
                favicon: 'https://favicon.im/facebook.com',
                domain: 'facebook.com'
            },
            {
                id: 'linkedin',
                url: 'https://www.linkedin.com',
                name: 'LinkedIn',
                favicon: 'https://favicon.im/linkedin.com',
                domain: 'linkedin.com'
            }
        ],
        searchEngines: [
            {
                id: 'google',
                url: 'https://www.google.com/search?q=%s',
                name: 'Google',
                favicon: 'https://favicon.im/google.com',
                domain: 'google.com'
            },
            {
                id: 'bing',
                url: 'https://www.bing.com/search?q=%s',
                name: 'Bing',
                favicon: 'https://favicon.im/bing.com',
                domain: 'bing.com'
            },
            {
                id: 'duckduckgo',
                url: 'https://duckduckgo.com/?q=%s',
                name: 'DuckDuckGo',
                favicon: 'https://favicon.im/duckduckgo.com',
                domain: 'duckduckgo.com'
            }
        ],
        settings: {
            currentSearchEngine: 'google',
            background: {
                url: '',
                opacity: 0.2,
                blur: 4
            }
        }
    };
    
    // Data object to store state
    let data = {
        sites: [],
        searchEngines: [],
        settings: {
            currentSearchEngine: '',
            background: {
                url: '',
                opacity: 0.2,
                blur: 4
            }
        }
    };
    
    // Helper functions for localStorage
    function saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    function loadFromLocalStorage(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }
    
    // Load all data from localStorage
    function loadAll() {
        data.sites = loadFromLocalStorage('navigator_sites', defaultData.sites);
        data.searchEngines = loadFromLocalStorage('navigator_searchEngines', defaultData.searchEngines);
        data.settings = loadFromLocalStorage('navigator_settings', defaultData.settings);
        
        // Ensure there's at least one search engine
        if (data.searchEngines.length === 0) {
            data.searchEngines = defaultData.searchEngines;
            saveToLocalStorage('navigator_searchEngines', data.searchEngines);
        }
        
        // Ensure currentSearchEngine exists
        if (!data.settings.currentSearchEngine || !data.searchEngines.find(engine => engine.id === data.settings.currentSearchEngine)) {
            data.settings.currentSearchEngine = data.searchEngines[0].id;
            saveToLocalStorage('navigator_settings', data.settings);
        }
    }
    
    // Site management
    function addSite(site) {
        data.sites.push(site);
        saveToLocalStorage('navigator_sites', data.sites);
    }
    
    function updateSite(updatedSite) {
        data.sites = data.sites.map(site => site.id === updatedSite.id ? updatedSite : site);
        saveToLocalStorage('navigator_sites', data.sites);
    }
    
    function deleteSite(id) {
        data.sites = data.sites.filter(site => site.id !== id);
        saveToLocalStorage('navigator_sites', data.sites);
    }
    
    function reorderSites(draggedId, targetId) {
        const draggedIndex = data.sites.findIndex(site => site.id === draggedId);
        const targetIndex = data.sites.findIndex(site => site.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedSite] = data.sites.splice(draggedIndex, 1);
            data.sites.splice(targetIndex, 0, draggedSite);
            saveToLocalStorage('navigator_sites', data.sites);
        }
    }
    
    // Search engine management
    function addSearchEngine(searchEngine) {
        data.searchEngines.push(searchEngine);
        saveToLocalStorage('navigator_searchEngines', data.searchEngines);
    }
    
    function updateSearchEngine(updatedSearchEngine) {
        data.searchEngines = data.searchEngines.map(engine => engine.id === updatedSearchEngine.id ? updatedSearchEngine : engine);
        saveToLocalStorage('navigator_searchEngines', data.searchEngines);
    }
    
    function deleteSearchEngine(id) {
        data.searchEngines = data.searchEngines.filter(engine => engine.id !== id);
        saveToLocalStorage('navigator_searchEngines', data.searchEngines);
    }
    
    function reorderSearchEngines(draggedId, targetId) {
        const draggedIndex = data.searchEngines.findIndex(engine => engine.id === draggedId);
        const targetIndex = data.searchEngines.findIndex(engine => engine.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedEngine] = data.searchEngines.splice(draggedIndex, 1);
            data.searchEngines.splice(targetIndex, 0, draggedEngine);
            saveToLocalStorage('navigator_searchEngines', data.searchEngines);
        }
    }
    
    // Settings management
    function updateSettings(updatedSettings) {
        data.settings = updatedSettings;
        saveToLocalStorage('navigator_settings', data.settings);
    }
    
    // Import/Export
    function importData(importedData) {
        // Validate imported data
        if (
            importedData &&
            Array.isArray(importedData.sites) &&
            Array.isArray(importedData.searchEngines) &&
            importedData.settings &&
            typeof importedData.settings === 'object'
        ) {
            data = importedData;
            saveToLocalStorage('navigator_sites', data.sites);
            saveToLocalStorage('navigator_searchEngines', data.searchEngines);
            saveToLocalStorage('navigator_settings', data.settings);
            return true;
        }
        return false;
    }
    
    // Public API
    return {
        data,
        loadAll,
        addSite,
        updateSite,
        deleteSite,
        reorderSites,
        addSearchEngine,
        updateSearchEngine,
        deleteSearchEngine,
        reorderSearchEngines,
        updateSettings,
        importData
    };
})();
