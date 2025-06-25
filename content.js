// content.js - Content script for Lead Builder extension

// This content script runs on all pages and can be used for future enhancements
// Currently, the main functionality is handled through context menus in background.js

(function() {
    'use strict';
    
    // Check if we're on a Google search results page
    const isGoogleSearch = window.location.hostname.includes('google.') && 
                          window.location.pathname.includes('/search');
    
    if (isGoogleSearch) {
        // Add visual indicator that the extension is active on Google search pages
        addExtensionIndicator();
    }
    
    // Function to add a subtle indicator that the extension is active
    function addExtensionIndicator() {
        // Only add if not already present
        if (document.getElementById('lead-builder-indicator')) {
            return;
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'lead-builder-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            opacity: 0.8;
            transition: opacity 0.3s ease;
        `;
        indicator.textContent = '🎯 Lead Builder Active';
        
        // Hide after 3 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 3000);
        
        document.body.appendChild(indicator);
    }
    
    // Listen for messages from background script (for future use)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'highlight-link') {
            // Future enhancement: could highlight the clicked link
            console.log('Link processed:', request.url);
        }
    });
    
})();