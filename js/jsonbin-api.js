/**
 * JSONBin.io API Integration
 * This file handles all interactions with the JSONBin.io API
 */

// Initialize JSONBin.io
async function initializeJSONBins() {
    try {
        console.log('Initializing JSONBin.io...');
        
        // Check if we have bin IDs in localStorage
        const storedBins = localStorage.getItem('seoul_grill_bins');
        if (storedBins) {
            CONFIG.BINS = JSON.parse(storedBins);
            console.log('Loaded bin IDs from localStorage:', CONFIG.BINS);
            
            // Verify bins still exist by trying to access one
            try {
                await getBinData('SYSTEM_STATUS');
                console.log('Verified bin access is working');
                return true;
            } catch (error) {
                console.warn('Stored bins are invalid, recreating them...');
                // Continue to recreate bins
            }
        }
        
        // Create bins for each data type
        await createBinIfNotExists('PRODUCTS', DEFAULT_PRODUCTS);
        await createBinIfNotExists('ORDERS', DEFAULT_ORDERS);
        await createBinIfNotExists('SYSTEM_STATUS', DEFAULT_SYSTEM_STATUS);
        await createBinIfNotExists('SYSTEM_LOG', DEFAULT_SYSTEM_LOG);
        
        // Save bin IDs to localStorage
        localStorage.setItem('seoul_grill_bins', JSON.stringify(CONFIG.BINS));
        console.log('Created and saved bin IDs:', CONFIG.BINS);
        
        // Log initialization in system log
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'system_initialized',
            description: 'System initialized with default data',
            performed_by: 'system',
            performed_at: new Date().toISOString(),
            version: CONFIG.VERSION
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error initializing JSONBins:', error);
        
        // Show error notification if available
        showNotification('Error initializing database. Some features may not work properly.', 'error');
        
        return false;
    }
}

// Create a bin if it doesn't exist
async function createBinIfNotExists(binType, defaultData) {
    if (CONFIG.BINS[binType]) {
        return CONFIG.BINS[binType];
    }
    
    try {
        console.log(`Creating ${binType} bin...`);
        const response = await fetch(CONFIG.JSONBIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY,
                'X-Bin-Private': 'false',
                'X-Bin-Name': `seoul_grill_${binType.toLowerCase()}_${Date.now()}`
            },
            body: JSON.stringify(defaultData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create ${binType} bin: ${response.status}`);
        }
        
        const data = await response.json();
        CONFIG.BINS[binType] = data.metadata.id;
        console.log(`Created ${binType} bin with ID: ${CONFIG.BINS[binType]}`);
        return data.metadata.id;
    } catch (error) {
        console.error(`Error creating ${binType} bin:`, error);
        throw error;
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

// Process queued orders
async function processQueuedOrders() {
    try {
        const orders = await getBinData('ORDERS');
        const queuedOrders = orders.filter(order => order.status === 'queued');
        
        if (queuedOrders.length === 0) {
            return {
                success: 0,
                failed: 0,
                total: 0
            };
        }
        
        let successCount = 0;
        let failedCount = 0;
        
        // Process each queued order
        for (const order of queuedOrders) {
            try {
                // Update order status
                order.status = 'processed';
                order.processed_at = new Date().toISOString();
                successCount++;
                
                // Log order processed
                const systemLog = await getBinData('SYSTEM_LOG');
                systemLog.push({
                    action: 'order_processed',
                    description: `Order #${order.order_id} processed`,
                    performed_by: 'system',
                    performed_at: new Date().toISOString()
                });
                await updateBinData('SYSTEM_LOG', systemLog);
            } catch (error) {
                console.error(`Error processing order ${order.order_id}:`, error);
                order.status = 'failed';
                failedCount++;
            }
        }
        
        // Update orders in bin
        await updateBinData('ORDERS', orders);
        
        return {
            success: successCount,
            failed: failedCount,
            total: queuedOrders.length
        };
    } catch (error) {
        console.error('Error processing queued orders:', error);
        return {
            success: 0,
            failed: 0,
            total: 0,
            error: error.message
        };
    }
}

// Queue an order
async function queueOrder(order) {
    try {
        // Get current orders
        const orders = await getBinData('ORDERS');
        
        // Add order to queue
        orders.push(order);
        
        // Update orders in bin
        await updateBinData('ORDERS', orders);
        
        // Log order queued
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'order_queued',
            description: `Order #${order.order_id} queued`,
            performed_by: order.customer_name || 'Guest',
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error queuing order:', error);
        return false;
    }
}

// Get all orders
async function getAllOrders() {
    try {
        return await getBinData('ORDERS');
    } catch (error) {
        console.error('Error getting all orders:', error);
        return [];
    }
}

// Get order by ID
async function getOrderById(orderId) {
    try {
        const orders = await getBinData('ORDERS');
        return orders.find(order => order.order_id === orderId) || null;
    } catch (error) {
        console.error(`Error getting order #${orderId}:`, error);
        return null;
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus, updatedBy = 'system') {
    try {
        const orders = await getBinData('ORDERS');
        const orderIndex = orders.findIndex(order => order.order_id === orderId);
        
        if (orderIndex === -1) {
            throw new Error(`Order #${orderId} not found`);
        }
        
        const oldStatus = orders[orderIndex].status;
        orders[orderIndex].status = newStatus;
        
        if (newStatus === 'processed' && oldStatus !== 'processed') {
            orders[orderIndex].processed_at = new Date().toISOString();
        }
        
        await updateBinData('ORDERS', orders);
        
        // Log status change
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'order_status_updated',
            description: `Order #${orderId} status changed from ${oldStatus} to ${newStatus}`,
            performed_by: updatedBy,
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error(`Error updating order #${orderId} status:`, error);
        return false;
    }
}

// Delete order
async function deleteOrder(orderId, deletedBy = 'system') {
    try {
        const orders = await getBinData('ORDERS');
        const orderIndex = orders.findIndex(order => order.order_id === orderId);
        
        if (orderIndex === -1) {
            throw new Error(`Order #${orderId} not found`);
        }
        
        // Remove the order
        orders.splice(orderIndex, 1);
        
        await updateBinData('ORDERS', orders);
        
        // Log deletion
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'order_deleted',
            description: `Order #${orderId} deleted`,
            performed_by: deletedBy,
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error(`Error deleting order #${orderId}:`, error);
        return false;
    }
}

// Backup all data
async function backupAllData() {
    try {
        const products = await getBinData('PRODUCTS');
        const orders = await getBinData('ORDERS');
        const systemStatus = await getBinData('SYSTEM_STATUS');
        const systemLog = await getBinData('SYSTEM_LOG');
        
        const backup = {
            products,
            orders,
            systemStatus,
            systemLog,
            timestamp: new Date().toISOString(),
            version: CONFIG.VERSION
        };
        
        return backup;
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
}

// Restore from backup
async function restoreFromBackup(backup, restoredBy = 'system') {
    try {
        // Validate backup
        if (!backup || !backup.products || !backup.orders || !backup.systemStatus || !backup.systemLog) {
            throw new Error('Invalid backup data');
        }
        
        // Restore each data type
        await updateBinData('PRODUCTS', backup.products);
        await updateBinData('ORDERS', backup.orders);
        await updateBinData('SYSTEM_STATUS', backup.systemStatus);
        
        // Add restoration log entry
        const systemLog = backup.systemLog || [];
        systemLog.push({
            action: 'system_restored',
            description: `System restored from backup created at ${backup.timestamp || 'unknown time'}`,
            performed_by: restoredBy,
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error restoring from backup:', error);
        throw error;
    }
}

// Check if running on GitHub Pages
function isRunningOnGitHubPages() {
    return window.location.hostname.endsWith('github.io');
}

// Auto-initialize on GitHub Pages if enabled
if (CONFIG.AUTO_INIT && isRunningOnGitHubPages()) {
    console.log('Auto-initializing on GitHub Pages...');
    window.addEventListener('load', () => {
        setTimeout(() => {
            initializeJSONBins()
                .then(success => {
                    console.log('Auto-initialization result:', success ? 'Success' : 'Failed');
                })
                .catch(error => {
                    console.error('Auto-initialization error:', error);
                });
        }, 1000); // Delay initialization to ensure page is fully loaded
    });
}
