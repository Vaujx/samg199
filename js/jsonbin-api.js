/**
 * JSONBin.io API Integration
 * This file handles all interactions with the JSONBin.io API
 */

// Use window.showNotification if available, otherwise create a fallback
var showNotification = window.showNotification || function(message, type) {
   console.log(`Notification: ${message} (Type: ${type})`);
};

// Initialize JSONBin.io
async function initializeJSONBins() {
    try {
        console.log('Initializing JSONBin.io...');
        
        // Set the specific bin ID for order tracking
        if (CONFIG && CONFIG.BINS) {
            CONFIG.BINS.ORDER_TRACKING = "67e60dcc8561e97a50f45273";
            console.log('Set ORDER_TRACKING bin ID:', CONFIG.BINS.ORDER_TRACKING);
        } else {
            // Initialize CONFIG.BINS if it doesn't exist
            if (!CONFIG) CONFIG = {};
            if (!CONFIG.BINS) CONFIG.BINS = {};
            CONFIG.BINS.ORDER_TRACKING = "67e60dcc8561e97a50f45273";
        }
        
        // Check if all bin IDs are set in CONFIG
        if (CONFIG.BINS.PRODUCTS && CONFIG.BINS.ORDERS && CONFIG.BINS.SYSTEM_STATUS && 
            CONFIG.BINS.SYSTEM_LOG && CONFIG.BINS.ORDER_TRACKING) {
            console.log('Using fixed bin IDs:', CONFIG.BINS);
            
            // Verify bins exist by trying to access system status
            try {
                await getBinData('SYSTEM_STATUS');
                console.log('Verified bin access is working');
                
                // Fix ORDER_TRACKING bin if it's incorrectly initialized
                await fixOrderTrackingBin();
                
                return true;
            } catch (error) {
                console.error('Error accessing bins with fixed IDs:', error);
                // Continue to create new bins
            }
        }
        
        // Check if we have bin IDs in localStorage
        const storedBins = localStorage.getItem('seoul_grill_bins');
        if (storedBins) {
            CONFIG.BINS = JSON.parse(storedBins);
            console.log('Loaded bin IDs from localStorage:', CONFIG.BINS);
            
            // Verify bins still exist by trying to access one
            try {
                await getBinData('SYSTEM_STATUS');
                console.log('Verified bin access is working');
                
                // Fix ORDER_TRACKING bin if it's incorrectly initialized
                await fixOrderTrackingBin();
                
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
        
        // Special handling for ORDER_TRACKING bin
        if (!CONFIG.BINS.ORDER_TRACKING) {
            try {
                await createBinIfNotExists('ORDER_TRACKING', []);
            } catch (error) {
                console.error('Error creating ORDER_TRACKING bin:', error);
                // If we can't create a new bin, use the fixed ID
                CONFIG.BINS.ORDER_TRACKING = "67e60dcc8561e97a50f45273";
                // Try to fix the existing bin
                await fixOrderTrackingBin();
            }
        }
        
        // Save bin IDs to localStorage
        localStorage.setItem('seoul_grill_bins', JSON.stringify(CONFIG.BINS));
        console.log('Created and saved bin IDs:', CONFIG.BINS);
        
        // Log initialization in system log
        try {
            const systemLog = await getBinData('SYSTEM_LOG');
            systemLog.push({
                action: 'system_initialized',
                description: 'System initialized with default data',
                performed_by: 'system',
                performed_at: new Date().toISOString(),
                version: CONFIG.VERSION || '1.0'
            });
            await updateBinData('SYSTEM_LOG', systemLog);
        } catch (error) {
            console.error('Error logging system initialization:', error);
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing JSONBins:', error);
        
        // Show error notification if available
        if (typeof showNotification === 'function') {
            showNotification('Error initializing database. Some features may not work properly.', 'error');
        }
        
        return false;
    }
}

// Fix ORDER_TRACKING bin if it's incorrectly initialized
async function fixOrderTrackingBin() {
    try {
        console.log('Checking ORDER_TRACKING bin structure...');
        
        // First try to get the current data
        try {
            const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                let currentData = data.record;
                
                // Check if the data is nested incorrectly
                if (Array.isArray(currentData) && currentData.length > 0 && Array.isArray(currentData[0]) && currentData.length === 1) {
                    console.log('ORDER_TRACKING bin has nested array structure, fixing...');
                    // If it's a nested array like [[]], flatten it or initialize as empty array
                    currentData = [];
                } else if (!Array.isArray(currentData)) {
                    console.log('ORDER_TRACKING bin is not an array, initializing as empty array');
                    currentData = [];
                }
                
                // Update the bin with the fixed structure
                const updateResponse = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.MASTER_KEY
                    },
                    body: JSON.stringify(currentData)
                });
                
                if (updateResponse.ok) {
                    console.log('ORDER_TRACKING bin fixed successfully');
                    return true;
                } else {
                    console.error('Failed to update ORDER_TRACKING bin:', updateResponse.status);
                }
            } else {
                console.error('Failed to get ORDER_TRACKING data:', response.status);
            }
        } catch (error) {
            console.error('Error accessing ORDER_TRACKING bin:', error);
        }
        
        // If the above fails, try a direct update with an empty array
        console.log('Attempting direct update of ORDER_TRACKING bin...');
        const directResponse = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY
            },
            body: JSON.stringify([])
        });
        
        if (directResponse.ok) {
            console.log('ORDER_TRACKING bin fixed successfully with direct update');
            return true;
        } else {
            throw new Error(`Failed to fix ORDER_TRACKING bin: ${directResponse.status}`);
        }
    } catch (error) {
        console.error('Error fixing ORDER_TRACKING bin:', error);
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
        } else if (binType === 'ORDER_TRACKING') {
            return [];
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

// Queue an order
async function queueOrder(order) {
    try {
        console.log('Queueing order:', order);
        
        // Get current orders
        let orders;
        try {
            orders = await getBinData('ORDERS');
            if (!Array.isArray(orders)) {
                orders = DEFAULT_ORDERS;
            }
        } catch (error) {
            console.warn('Error getting orders, using default:', error);
            orders = DEFAULT_ORDERS;
        }
        
        // Add order to queue
        orders.push(order);
        
        // Update orders in bin
        try {
            await updateBinData('ORDERS', orders);
        } catch (error) {
            console.error('Error updating orders bin:', error);
            // Continue to try adding to tracking
        }
        
        // Add to order tracking - this is critical for the tracking feature
        const trackingSuccess = await addOrderToTracking(order);
        if (!trackingSuccess) {
            console.warn('Failed to add order to tracking, but order was queued successfully');
        }
        
        // Log order queued
        try {
            const systemLog = await getBinData('SYSTEM_LOG');
            systemLog.push({
                action: 'order_queued',
                description: `Order #${order.order_id} queued`,
                performed_by: order.customer_email || 'Guest',
                performed_at: new Date().toISOString()
            });
            await updateBinData('SYSTEM_LOG', systemLog);
        } catch (error) {
            console.error('Error logging order:', error);
        }
        
        console.log('Order queued successfully');
        return true;
    } catch (error) {
        console.error('Error queuing order:', error);
        return false;
    }
}

// Add order to tracking
async function addOrderToTracking(order) {
    try {
        console.log('Adding order to tracking:', order);
        
        // Make sure order has customer_email
        if (!order.customer_email) {
            console.warn('Order missing customer_email, tracking may not work properly');
            return false;
        }
        
        // Get current tracking data - use direct fetch to ensure we get the latest data
        let trackingData = [];
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                trackingData = data.record;
                
                // Ensure trackingData is an array
                if (!Array.isArray(trackingData)) {
                    console.warn('ORDER_TRACKING data is not an array, initializing as empty array');
                    trackingData = [];
                }
            } else {
                console.warn('Failed to get ORDER_TRACKING data, initializing as empty array');
            }
        } catch (error) {
            console.warn('Error getting ORDER_TRACKING data, initializing as empty array:', error);
        }
        
        // Add new order to tracking
        trackingData.push(order);
        
        // Update tracking data in bin
        const updateResponse = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY
            },
            body: JSON.stringify(trackingData)
        });
        
        if (!updateResponse.ok) {
            throw new Error(`Failed to update ORDER_TRACKING data: ${updateResponse.status}`);
        }
        
        console.log('Order added to tracking successfully');
        return true;
    } catch (error) {
        console.error('Error adding order to tracking:', error);
        return false;
    }
}

// Get order tracking by email
async function getOrderTrackingByEmail(email) {
    try {
        console.log(`Getting order tracking for email: ${email}`);
        
        // Get all tracking data
        let trackingData = [];
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                trackingData = data.record;
                
                // Ensure trackingData is an array
                if (!Array.isArray(trackingData)) {
                    console.warn('ORDER_TRACKING data is not an array, returning empty array');
                    return [];
                }
            } else {
                console.warn('Failed to get ORDER_TRACKING data, returning empty array');
                return [];
            }
        } catch (error) {
            console.warn('Error getting ORDER_TRACKING data, returning empty array:', error);
            return [];
        }
        
        // Filter by email
        const customerOrders = trackingData.filter(order => order.customer_email === email);
        
        console.log(`Found ${customerOrders.length} orders for email: ${email}`);
        return customerOrders;
    } catch (error) {
        console.error(`Error getting order tracking for email ${email}:`, error);
        return [];
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus, updatedBy = 'system') {
    try {
        // Update in ORDERS bin
        try {
            const orders = await getBinData('ORDERS');
            const orderIndex = orders.findIndex(order => order.order_id === orderId);
            
            if (orderIndex !== -1) {
                const oldStatus = orders[orderIndex].status;
                orders[orderIndex].status = newStatus;
                
                if (newStatus === 'processed' && oldStatus !== 'processed') {
                    orders[orderIndex].processed_at = new Date().toISOString();
                }
                
                await updateBinData('ORDERS', orders);
            }
        } catch (error) {
            console.error('Error updating order status in ORDERS bin:', error);
        }
        
        // Update in ORDER_TRACKING bin
        let trackingData = [];
        
        try {
            const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                trackingData = data.record;
                
                // Ensure trackingData is an array
                if (!Array.isArray(trackingData)) {
                    console.warn('ORDER_TRACKING data is not an array, initializing as empty array');
                    trackingData = [];
                }
            } else {
                console.warn('Failed to get ORDER_TRACKING data');
                return false;
            }
        } catch (error) {
            console.warn('Error getting ORDER_TRACKING data:', error);
            return false;
        }
        
        const trackingIndex = trackingData.findIndex(order => order.order_id === orderId);
        
        if (trackingIndex !== -1) {
            const oldStatus = trackingData[trackingIndex].status;
            trackingData[trackingIndex].status = newStatus;
            
            if (newStatus === 'processed' && oldStatus !== 'processed') {
                trackingData[trackingIndex].processed_at = new Date().toISOString();
            }
            
            const updateResponse = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.ORDER_TRACKING}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.MASTER_KEY
                },
                body: JSON.stringify(trackingData)
            });
            
            if (!updateResponse.ok) {
                throw new Error(`Failed to update ORDER_TRACKING data: ${updateResponse.status}`);
            }
        }
        
        // Log status change
        try {
            const systemLog = await getBinData('SYSTEM_LOG');
            systemLog.push({
                action: 'order_status_updated',
                description: `Order #${orderId} status changed to ${newStatus}`,
                performed_by: updatedBy,
                performed_at: new Date().toISOString()
            });
            await updateBinData('SYSTEM_LOG', systemLog);
        } catch (error) {
            console.error('Error logging status change:', error);
        }
        
        console.log(`Order #${orderId} status updated to ${newStatus}`);
        return true;
    } catch (error) {
        console.error(`Error updating order #${orderId} status:`, error);
        return false;
    }
}

// Process queued orders
async function processQueuedOrders() {
    try {
        let orders;
        try {
            orders = await getBinData('ORDERS');
        } catch (error) {
            console.error('Error getting orders:', error);
            return {
                success: 0,
                failed: 0,
                total: 0,
                error: error.message
            };
        }
        
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
                await updateOrderStatus(order.order_id, 'processed', 'system');
                successCount++;
            } catch (error) {
                console.error(`Error processing order ${order.order_id}:`, error);
                failedCount++;
            }
        }
        
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

// Make functions available globally
window.initializeJSONBins = initializeJSONBins;
window.getBinData = getBinData;
window.updateBinData = updateBinData;
window.getSystemStatus = getSystemStatus;
window.queueOrder = queueOrder;
window.addOrderToTracking = addOrderToTracking;
window.getOrderTrackingByEmail = getOrderTrackingByEmail;
window.updateOrderStatus = updateOrderStatus;
window.processQueuedOrders = processQueuedOrders;
window.fixOrderTrackingBin = fixOrderTrackingBin;
