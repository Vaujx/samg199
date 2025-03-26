/**
 * JSONBin.io API Integration
 * This file handles all interactions with the JSONBin.io API
 */

// Configuration
const JSONBIN_CONFIG = {
    API_URL: 'https://api.jsonbin.io/v3/b',
    MASTER_KEY: '$2a$10$qrZ9tpKi.ajyrHn7A.dMbeABtgoW6dnb6aVVQWDxBjhfPNSw9skEC',
    ACCESS_KEY: '$2a$10$V5G6G/GoKByB9rHsvU2bRupT.5uqU15DTZBXguWdHdrkTYi/ljsQG',
    BINS: {}
};

// Default data
const DEFAULT_DATA = {
    PRODUCTS: {
        "SET A": {
            "price": 900.00,
            "contents": [
                "200g POTATO MARBLE",
                "200g SWEETENED BANANA",
                "150g LETTUCE",
                "150g GOCHUJANG SAUCE",
                "150g SSAMJANG SAUCE"
            ],
            "image": "images/FamilysetA.jpg"
        },
        "SET B": {
            "price": 1260.00,
            "contents": [
                "200g KIMCHI",
                "200g FISHCAKE",
                "200g POTATO MARBLE",
                "200g SWEETENED BANANA",
                "150g LETTUCE"
            ],
            "image": "images/FamilysetB.jpg"
        },
        "SET C": {
            "price": 1450.00,
            "contents": [
                "200g KIMCHI",
                "200g POTATO MARBLE",
                "200g SWEETENED BANANA",
                "150g LETTUCE"
            ],
            "image": "images/FamilysetC.jpg"
        },
        "TEST ITEM": {
            "price": 1.00,
            "contents": [
                "Test item for PayPal integration"
            ],
            "image": "images/placeholder.jpg"
        }
    },
    SYSTEM_STATUS: {
        status: 1, // 1 = online, 0 = offline
        updated_by: 'system',
        updated_at: new Date().toISOString()
    },
    SYSTEM_LOG: [],
    ORDERS: []
};

// Initialize JSONBin.io
async function initializeJSONBin() {
    try {
        console.log('Initializing JSONBin.io...');
        
        // Check if we have bin IDs in localStorage
        const storedBins = localStorage.getItem('seoul_grill_bins');
        if (storedBins) {
            JSONBIN_CONFIG.BINS = JSON.parse(storedBins);
            console.log('Loaded bin IDs from localStorage:', JSONBIN_CONFIG.BINS);
            return true;
        }
        
        // Create bins for each data type
        for (const dataType in DEFAULT_DATA) {
            const binId = await createBin(DEFAULT_DATA[dataType]);
            if (binId) {
                JSONBIN_CONFIG.BINS[dataType] = binId;
                console.log(`Created ${dataType} bin with ID: ${binId}`);
            } else {
                console.error(`Failed to create ${dataType} bin`);
                return false;
            }
        }
        
        // Save bin IDs to localStorage
        localStorage.setItem('seoul_grill_bins', JSON.stringify(JSONBIN_CONFIG.BINS));
        console.log('Saved bin IDs to localStorage:', JSONBIN_CONFIG.BINS);
        
        return true;
    } catch (error) {
        console.error('Error initializing JSONBin.io:', error);
        return false;
    }
}

// Create a new bin
async function createBin(data) {
    try {
        const response = await fetch(JSONBIN_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY,
                'X-Bin-Private': 'false'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create bin: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.metadata.id;
    } catch (error) {
        console.error('Error creating bin:', error);
        return null;
    }
}

// Get data from a bin
async function getBinData(binType) {
    try {
        const binId = JSONBIN_CONFIG.BINS[binType];
        if (!binId) {
            throw new Error(`No bin ID found for ${binType}`);
        }
        
        const response = await fetch(`${JSONBIN_CONFIG.API_URL}/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get data from bin: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.record;
    } catch (error) {
        console.error(`Error getting data from ${binType} bin:`, error);
        
        // Return default data if available
        if (DEFAULT_DATA[binType]) {
            console.log(`Returning default data for ${binType}`);
            return DEFAULT_DATA[binType];
        }
        
        return null;
    }
}

// Update data in a bin
async function updateBinData(binType, data) {
    try {
        const binId = JSONBIN_CONFIG.BINS[binType];
        if (!binId) {
            throw new Error(`No bin ID found for ${binType}`);
        }
        
        const response = await fetch(`${JSONBIN_CONFIG.API_URL}/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update bin: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.record;
    } catch (error) {
        console.error(`Error updating ${binType} bin:`, error);
        return null;
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
        
        // Update system status
        systemStatus.status = isOnline ? 1 : 0;
        systemStatus.updated_by = updatedBy;
        systemStatus.updated_at = new Date().toISOString();
        
        // Update system status in bin
        await updateBinData('SYSTEM_STATUS', systemStatus);
        
        // Log status change
        await logSystemAction(
            isOnline ? 'system_online' : 'system_offline',
            isOnline ? 'System brought online' : 'System taken offline',
            updatedBy
        );
        
        return true;
    } catch (error) {
        console.error('Error setting system status:', error);
        return false;
    }
}

// Log system action
async function logSystemAction(action, description, performedBy) {
    try {
        // Get current system log
        const systemLog = await getBinData('SYSTEM_LOG');
        
        // Add new log entry
        systemLog.push({
            action: action,
            description: description,
            performed_by: performedBy,
            performed_at: new Date().toISOString()
        });
        
        // Update system log in bin
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error logging system action:', error);
        return false;
    }
}

// Get system log
async function getSystemLog(limit = 10) {
    try {
        const systemLog = await getBinData('SYSTEM_LOG');
        
        // Sort by date (newest first) and limit
        return systemLog
            .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting system log:', error);
        return [];
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
        await logSystemAction(
            'order_queued',
            `Order #${order.order_id} queued`,
            order.customer_name || 'Guest'
        );
        
        return true;
    } catch (error) {
        console.error('Error queuing order:', error);
        return false;
    }
}

// Get queued orders
async function getQueuedOrders(status = 'all') {
    try {
        const orders = await getBinData('ORDERS');
        
        if (status === 'all') {
            return orders;
        }
        
        return orders.filter(order => order.status === status);
    } catch (error) {
        console.error('Error getting queued orders:', error);
        return [];
    }
}

// Process queued orders
async function processQueuedOrders() {
    try {
        // Get current orders
        const orders = await getBinData('ORDERS');
        
        // Find queued orders
        const queuedOrders = orders.filter(order => order.status === 'queued');
        
        if (queuedOrders.length === 0) {
            return {
                total: 0,
                success: 0,
                failed: 0
            };
        }
        
        let successCount = 0;
        let failedCount = 0;
        
        // Process each queued order
        for (const order of queuedOrders) {
            try {
                // In a real system, this would process the order (e.g., payment, notification, etc.)
                // For this demo, we'll just mark it as processed
                order.status = 'processed';
                order.processed_at = new Date().toISOString();
                successCount++;
                
                // Log order processed
                await logSystemAction(
                    'order_processed',
                    `Order #${order.order_id} processed`,
                    'system'
                );
            } catch (error) {
                console.error(`Error processing order #${order.order_id}:`, error);
                order.status = 'failed';
                failedCount++;
                
                // Log order failed
                await logSystemAction(
                    'order_failed',
                    `Order #${order.order_id} failed: ${error.message}`,
                    'system'
                );
            }
        }
        
        // Update orders in bin
        await updateBinData('ORDERS', orders);
        
        return {
            total: queuedOrders.length,
            success: successCount,
            failed: failedCount
        };
    } catch (error) {
        console.error('Error processing queued orders:', error);
        return {
            total: 0,
            success: 0,
            failed: 0,
            error: error.message
        };
    }
}
