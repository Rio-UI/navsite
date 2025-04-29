/**
 * Utility functions for the web navigation app
 */

// Extract domain from URL
function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        // If URL parsing fails, try adding https:// and retry
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                const urlObj = new URL('https://' + url);
                return urlObj.hostname;
            }
        } catch (e) {
            console.error('Invalid URL:', url);
        }
        return url; // Return original if all else fails
    }
}

// Get favicon URL for a domain
function getFaviconUrl(domain) {
    return `https://favicon.im/${domain}`;
}

// Save data to localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

// Load data from localStorage
function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return defaultValue;
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Prevent default context menu
function preventDefaultContextMenu(element) {
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Show context menu at position
function showContextMenu(menu, x, y) {
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
}

// Hide context menu
function hideContextMenu(menu) {
    menu.classList.add('hidden');
}

// Add event listener to close context menu when clicking elsewhere
function setupContextMenuCloseListener(menu) {
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) {
            hideContextMenu(menu);
        }
    });
}

// Download object as JSON file
function downloadJson(data, filename) {
    const blob = new URL(
        `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
    );
    const link = document.createElement('a');
    link.href = blob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Read JSON file
function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                resolve(JSON.parse(e.target.result));
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsText(file);
    });
}

// Enable drag to reorder elements
function enableDragSort(listElement, itemSelector, onReorder) {
    let draggedItem = null;
    let placeholder = null;
    let originalOrder = [];
    
    // Get all items initially
    const items = listElement.querySelectorAll(itemSelector);
    items.forEach(item => {
        // Store original positions
        item.draggable = true;
        
        // Drag start event
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            setTimeout(() => {
                item.classList.add('dragging');
            }, 0);
            
            // Store original order
            originalOrder = Array.from(listElement.querySelectorAll(itemSelector));
            
            // Create and insert placeholder
            placeholder = document.createElement('div');
            placeholder.className = 'placeholder bg-gray-100 border border-dashed border-gray-300 rounded-lg';
            placeholder.style.height = `${item.offsetHeight}px`;
            placeholder.style.width = `${item.offsetWidth}px`;
            placeholder.style.margin = getComputedStyle(item).margin;
            
            // Hide actual item with visibility instead of display for proper placeholder sizing
            e.dataTransfer.setDragImage(item, 0, 0);
        });
        
        // Drag end event
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            
            // Get new order and notify if changed
            const newOrder = Array.from(listElement.querySelectorAll(itemSelector));
            
            // Check if order changed
            let orderChanged = false;
            if (newOrder.length === originalOrder.length) {
                for (let i = 0; i < newOrder.length; i++) {
                    if (newOrder[i] !== originalOrder[i]) {
                        orderChanged = true;
                        break;
                    }
                }
            }
            
            if (orderChanged && typeof onReorder === 'function') {
                onReorder(newOrder, originalOrder);
            }
            
            draggedItem = null;
            placeholder = null;
        });
    });
    
    // Dragover event on container
    listElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        if (!draggedItem || !placeholder) return;
        
        const afterElement = getDragAfterElement(listElement, e.clientY, itemSelector);
        
        // Remove placeholder from current position
        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
        
        // Insert placeholder at new position
        if (afterElement) {
            listElement.insertBefore(placeholder, afterElement);
        } else {
            listElement.appendChild(placeholder);
        }
        
        // Move the actual dragging element to the new position
        if (draggedItem.parentNode) {
            draggedItem.parentNode.removeChild(draggedItem);
        }
        
        // Insert the dragging element at the new position
        if (afterElement) {
            listElement.insertBefore(draggedItem, afterElement);
        } else {
            listElement.appendChild(draggedItem);
        }
    });
    
    // Find element to insert after based on mouse position
    function getDragAfterElement(container, y, selector) {
        const draggableElements = Array.from(container.querySelectorAll(`${selector}:not(.dragging)`));
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}
