/**
 * JSONBin.io API Integration
 * This file handles all interactions with the JSONBin.io API
 */

// Initialize JSONBin.io
async function initializeJSONBins() {
    try {
        console.log('Initializing JSONBin.io...');
        
        // Check if all bin IDs are set in CONFIG
        if (CONFIG.BINS.PRODUCTS && CONFIG.BINS.ORDERS && CONFIG.BINS.SYSTEM_STATUS && CONFIG.BINS.SYSTEM_LOG) {
            console.log('Using fixed bin IDs:', CONFIG.BINS);
            
            // Verify bins exist by trying to access system status
            try {
                await getBinData('SYSTEM_STATUS');
                console.log('Verified bin access is working');
                return true;
            } catch (error) {
                console.error('Error accessing bins with fixed IDs:', error);
                showNotification('Error accessing database. Please check your bin IDs.', 'error');
                return false;
            }
        } else {
            console.error('Missing bin IDs in configuration');
            showNotification('Missing bin IDs in configuration. Please set all bin IDs.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error initializing JSONBins:', error);
        showNotification('Error initializing database. Some features may not work properly.', 'error');
        return false;
    }
}

// Get data from a bin
async function getBinData(binType) {
    try {
        if (!CONFIG.BINS[binType]) {
            throw new Error(`Bin ID for ${binType} not found`);
        }
        
        console.log(`Fetching ${binType} data...`);
        const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': CONFIG.MASTER_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get ${binType} data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched ${binType} data`);
        return data.record;
    } catch (error) {
        console.error(`Error getting ${binType} data:`, error);
        
        // Return default data if available
        console.log(`Returning default ${binType} data`);
        if (binType === 'PRODUCTS') {
            return DEFAULT_PRODUCTS;
        } else if (binType === 'SYSTEM_STATUS') {
            return DEFAULT_SYSTEM_STATUS;
        } else if (binType === 'SYSTEM_LOG') {
            return DEFAULT_SYSTEM_LOG;
        } else if (binType === 'ORDERS') {
            return DEFAULT_ORDERS;
        }
        
        return null;
    }
}

// Update data in a bin
async function updateBinData(binType, data) {
    try {
        if (!CONFIG.BINS[binType]) {
            throw new Error(`Bin ID for ${binType} not found`);
        }
        
        console.log(`Updating ${binType} data...`);
        const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update ${binType} data: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log(`Successfully updated ${binType} data`);
        return responseData.record;
    } catch (error) {
        console.error(`Error updating ${binType} data:`, error);
        throw error;
    }
}

// Get system status
async function getSystemStatus() {
    try {
        const systemStatus = await getBinData('SYSTEM_STATUS');
        return systemStatus.status === 1;
    } catch (error) {
        console.error('Error getting system status:', error);
        return true; // Default to online if there's an error
    }
}

// Set system status
async function setSystemStatus(isOnline, updatedBy = 'system') {
    try {
        // Get current system status
        const systemStatus = await getBinData('SYSTEM_STATUS');
        const wasOnline = systemStatus.status === 1;
        const goingOnline = isOnline;
        
        // If status is not changing, do nothing
        if ((wasOnline && goingOnline) || (!wasOnline && !goingOnline)) {
            console.log('System status is already set to the requested value');
            return true;
        }
        
        // Update system status
        systemStatus.status = isOnline ? 1 : 0;
        systemStatus.updated_by = updatedBy;
        systemStatus.updated_at = new Date().toISOString();
        
        // Update system status in bin
        await updateBinData('SYSTEM_STATUS', systemStatus);
        
        // Log status change
        const logEntry = {
            action: isOnline ? 'system_online' : 'system_offline',
            description: isOnline ? 'System brought online' : 'System taken offline',
            performed_by: updatedBy,
            performed_at: new Date().toISOString()
        };
        
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push(logEntry);
        await updateBinData('SYSTEM_LOG', systemLog);
        
        // Process queued orders if going from offline to online
        if (!wasOnline && goingOnline) {
            const results = await processQueuedOrders();
            console.log('Processed queued orders:', results);
            
            if (results.total > 0) {
                showNotification(`System is now online. Processed ${results.success} of ${results.total} queued orders.`, 'success');
            } else {
                showNotification('System is now online. No queued orders to process.', 'success');
            }
        } else if (wasOnline && !goingOnline) {
            showNotification('System is now offline. New orders will be queued.', 'warning');
        }
        
        return true;
    } catch (error) {
        console.error('Error setting system status:', error);
        showNotification(`Error ${isOnline ? 'bringing system online' : 'taking system offline'}. Please try again.`, 'error');
        return false;
    }
}

// The rest of the functions remain the same...
// Process queued orders, queue order, get all orders, etc.
