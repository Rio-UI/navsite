/**
 * Simplified version of the DragDropTouch polyfill for touch devices
 * Source: https://github.com/Bernardo-Castilho/dragdroptouch
 * Modified for this specific application
 */
(function() {
    if ('ontouchstart' in document.documentElement) {
        var DragDropTouch = function() {
            this._lastTouch = null;
            this._touchStarted = false;
            this._activeElement = null;
            this._dropTarget = null;
            
            this._lastClick = 0;
            
            this._init();
        };
        
        DragDropTouch.prototype = {
            _THRESHOLD: 5,
            _OPACITY: 0.5,
            _DBLCLICK: 500,
            
            // initialize
            _init: function() {
                // Setup event listeners for touch events
                var touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
                for (var i = 0; i < touchEvents.length; i++) {
                    document.addEventListener(touchEvents[i], this._touchHandler.bind(this), {passive: false});
                }
            },
            
            // handle touch events
            _touchHandler: function(e) {
                var touch = e.changedTouches[0];
                var type = '';
                
                switch (e.type) {
                    case 'touchstart':
                        type = 'mousedown';
                        this._touchStarted = true;
                        this._lastTouch = touch;
                        this._activeElement = this._getTarget(touch);
                        break;
                    case 'touchmove':
                        if (this._touchStarted) {
                            type = 'mousemove';
                            this._lastTouch = touch;
                            this._handleDrag(e);
                        }
                        break;
                    case 'touchend':
                        if (this._touchStarted) {
                            type = 'mouseup';
                            this._touchStarted = false;
                            this._handleDrop(e);
                        }
                        break;
                    case 'touchcancel':
                        if (this._touchStarted) {
                            type = 'mouseup';
                            this._touchStarted = false;
                            this._handleCancel(e);
                        }
                        break;
                }
                
                if (type !== '') {
                    var simulatedEvent = new MouseEvent(type, {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: 1,
                        screenX: touch.screenX,
                        screenY: touch.screenY,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        button: 0,
                        buttons: 1
                    });
                    
                    touch.target.dispatchEvent(simulatedEvent);
                    
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                }
            },
            
            // handle drag
            _handleDrag: function(e) {
                var touch = e.changedTouches[0];
                var dx = touch.clientX - this._lastTouch.clientX;
                var dy = touch.clientY - this._lastTouch.clientY;
                
                if (this._activeElement && 
                    (Math.abs(dx) > this._THRESHOLD || Math.abs(dy) > this._THRESHOLD)) {
                    // Element is draggable
                    if (this._activeElement.getAttribute('draggable') === 'true') {
                        // Create and dispatch dragstart event
                        if (!this._dragStarted) {
                            var evt = new CustomEvent('dragstart', {
                                bubbles: true,
                                cancelable: true,
                                detail: {
                                    dataTransfer: {
                                        effectAllowed: 'move'
                                    }
                                }
                            });
                            this._activeElement.dispatchEvent(evt);
                            this._dragStarted = true;
                            
                            // Set opacity
                            this._activeElement.style.opacity = this._OPACITY;
                        }
                        
                        // Handle dragover and drop targets
                        this._dropTarget = this._getDropTarget(touch);
                        if (this._dropTarget) {
                            var evt = new CustomEvent('dragover', {
                                bubbles: true,
                                cancelable: true,
                                detail: {
                                    dataTransfer: {
                                        dropEffect: 'move'
                                    }
                                }
                            });
                            this._dropTarget.dispatchEvent(evt);
                        }
                    }
                }
            },
            
            // handle drop
            _handleDrop: function(e) {
                if (this._dragStarted) {
                    // Dispatch dragend event
                    var evt = new CustomEvent('dragend', {
                        bubbles: true,
                        cancelable: true
                    });
                    this._activeElement.dispatchEvent(evt);
                    
                    // Reset opacity
                    this._activeElement.style.opacity = '';
                    
                    // Handle drop
                    if (this._dropTarget) {
                        var dropEvt = new CustomEvent('drop', {
                            bubbles: true,
                            cancelable: true
                        });
                        this._dropTarget.dispatchEvent(dropEvt);
                    }
                    
                    this._dragStarted = false;
                } else {
                    // Handle click
                    var touch = e.changedTouches[0];
                    var now = new Date().getTime();
                    if (now - this._lastClick < this._DBLCLICK) {
                        // Double-click
                        var dblClickEvt = new MouseEvent('dblclick', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            detail: 2,
                            screenX: touch.screenX,
                            screenY: touch.screenY,
                            clientX: touch.clientX,
                            clientY: touch.clientY
                        });
                        touch.target.dispatchEvent(dblClickEvt);
                    }
                    this._lastClick = now;
                }
                
                this._dropTarget = null;
                this._activeElement = null;
            },
            
            // handle cancel
            _handleCancel: function(e) {
                if (this._dragStarted) {
                    // Dispatch dragend event
                    var evt = new CustomEvent('dragend', {
                        bubbles: true,
                        cancelable: true
                    });
                    this._activeElement.dispatchEvent(evt);
                    
                    // Reset opacity
                    this._activeElement.style.opacity = '';
                    
                    this._dragStarted = false;
                }
                
                this._dropTarget = null;
                this._activeElement = null;
            },
            
            // get target element
            _getTarget: function(touch) {
                var target = touch.target;
                
                // Find closest draggable element
                while (target && target !== document.body) {
                    if (target.getAttribute('draggable') === 'true') {
                        return target;
                    }
                    target = target.parentElement;
                }
                
                return null;
            },
            
            // get drop target
            _getDropTarget: function(touch) {
                var target = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Find valid drop target
                while (target && target !== document.body) {
                    if (target.classList.contains('site-card') || target.classList.contains('search-engines-item')) {
                        return target;
                    }
                    target = target.parentElement;
                }
                
                return null;
            }
        };
        
        // Create the singleton instance
        new DragDropTouch();
    }
})();
