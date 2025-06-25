// popup.js - Handles the extension popup functionality

document.addEventListener('DOMContentLoaded', function() {
    const gasUrlInput = document.getElementById('gasUrl');
    const saveButton = document.getElementById('saveConfig');
    const statusDiv = document.getElementById('status');

    // Load saved configuration
    loadConfig();

    // Save configuration when button is clicked
    saveButton.addEventListener('click', saveConfig);

    // Load existing configuration
    function loadConfig() {
        chrome.storage.sync.get(['gasUrl'], function(result) {
            if (result.gasUrl) {
                gasUrlInput.value = result.gasUrl;
            }
        });
    }

    // Save configuration
    function saveConfig() {
        const gasUrl = gasUrlInput.value.trim();
        
        if (!gasUrl) {
            showStatus('Please enter a Google Apps Script URL', 'error');
            return;
        }

        // Validate URL format
        try {
            new URL(gasUrl);
        } catch (e) {
            showStatus('Please enter a valid URL', 'error');
            return;
        }

        // Check if it's a Google Apps Script URL
        if (!gasUrl.includes('script.google.com')) {
            showStatus('Please enter a valid Google Apps Script URL', 'error');
            return;
        }

        // Save to storage
        chrome.storage.sync.set({
            gasUrl: gasUrl
        }, function() {
            if (chrome.runtime.lastError) {
                showStatus('Error saving configuration', 'error');
            } else {
                showStatus('Configuration saved successfully!', 'success');
            }
        });
    }

    // Show status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
});