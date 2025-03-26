/**
 * Admin API
 * This file handles admin-related operations
 */

// Import necessary modules or declare variables
import { CONFIG, getSystemStatus, getQueuedOrders, formatDate, getSystemLog, updateBinData, logSystemAction, showNotification, padString } from './utils.js';

// Admin login
function adminLogin(password) {
    if (password === CONFIG.ADMIN_PASSWORD) {
        localStorage.setItem('seoul_grill_admin', 'true');
        return true;
    }
    return false;
}

// Admin logout
function adminLogout() {
    localStorage.removeItem('seoul_grill_admin');
}

// Check if admin is logged in
function isAdminLoggedIn() {
    return localStorage.getItem('seoul_grill_admin') === 'true';
}

// Load admin dashboard
async function loadAdminDashboard() {
    if (!isAdminLoggedIn()) {
        return false;
    }
    
    try {
        // Load system status
        await loadSystemStatus();
        
        // Load queued orders
        await loadQueuedOrders();
        
        // Load system log
        await loadSystemLog();
        
        return true;
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        return false;
    }
}

// Load system status
async function loadSystemStatus() {
    try {
        const systemOnline = await getSystemStatus();
        
        // Update system status indicator
        const statusElement = document.getElementById('system-status');
        if (statusElement) {
            statusElement.className = `system-status ${systemOnline ? 'status-online' : 'status-offline'}`;
            statusElement.textContent = systemOnline ? 'System Online' : 'System Offline';
        }
        
        // Update buttons
        const onlineButton = document.getElementById('online-button');
        const offlineButton = document.getElementById('offline-button');
        
        if (onlineButton) {
            onlineButton.disabled = systemOnline;
        }
        
        if (offlineButton) {
            offlineButton.disabled = !systemOnline;
        }
        
        return systemOnline;
    } catch (error) {
        console.error('Error loading system status:', error);
        return true; // Default to online if there's an error
    }
}

// Load queued orders
async function loadQueuedOrders() {
    try {
        const queuedOrders = await getQueuedOrders('queued');
        
        // Update queue count
        const queueCount = document.getElementById('queue-count');
        if (queueCount) {
            queueCount.textContent = queuedOrders.length;
        }
        
        // Update queue status message
        const queueStatusMessage = document.getElementById('queue-status-message');
        if (queueStatusMessage) {
            if (queuedOrders.length > 0) {
                const systemOnline = await getSystemStatus();
                if (!systemOnline) {
                    queueStatusMessage.textContent = 'These orders will be processed when the system is brought back online.';
                } else {
                    queueStatusMessage.textContent = 'The system is online. Orders are being processed normally.';
                }
            } else {
                queueStatusMessage.textContent = 'No orders are currently queued.';
            }
        }
        
        // Show/hide queued orders section
        const queuedOrdersSection = document.getElementById('queued-orders-section');
        if (queuedOrdersSection) {
            queuedOrdersSection.style.display = queuedOrders.length > 0 ? 'block' : 'none';
        }
        
        // Update queued orders list
        const queuedOrdersList = document.getElementById('queued-orders-list');
        if (queuedOrdersList && queuedOrders.length > 0) {
            queuedOrdersList.innerHTML = '';
            
            queuedOrders.forEach(order => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.customer_name || 'Guest'}</td>
                    <td>₱${order.total_amount.toFixed(2)}</td>
                    <td>${formatDate(order.queued_at)}</td>
                    <td>
                        <button class="status-button" onclick="toggleOrderDetails('${order.order_id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <div id="order-details-${order.order_id}" class="order-details" style="display: none;">
                            <strong>Items:</strong>
                            <ul>
                                ${Object.entries(order.items).map(([product, quantity]) => 
                                    `<li>${product} x ${quantity}</li>`).join('')}
                            </ul>
                        </div>
                    </td>
                `;
                
                queuedOrdersList.appendChild(tr);
            });
        }
        
        return queuedOrders;
    } catch (error) {
        console.error('Error loading queued orders:', error);
        return [];
    }
}

// Load system log
async function loadSystemLog() {
    try {
        const systemLog = await getSystemLog(5);
        
        // Update system log table
        const statusHistory = document.getElementById('status-history');
        if (statusHistory) {
            statusHistory.innerHTML = '';
            
            if (systemLog.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="3">No status changes recorded yet.</td>';
                statusHistory.appendChild(tr);
            } else {
                systemLog.forEach(entry => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            ${entry.action === 'system_online' 
                                ? '<span class="status-online"><i class="fas fa-check-circle"></i> System Brought Online</span>' 
                                : entry.action === 'system_offline'
                                ? '<span class="status-offline"><i class="fas fa-times-circle"></i> System Taken Offline</span>'
                                : entry.action === 'order_queued'
                                ? '<span><i class="fas fa-clock"></i> Order Queued</span>'
                                : entry.action === 'order_processed'
                                ? '<span class="status-online"><i class="fas fa-check-circle"></i> Order Processed</span>'
                                : '<span><i class="fas fa-info-circle"></i> ' + entry.action + '</span>'}
                        </td>
                        <td>${entry.performed_by}</td>
                        <td>${formatDate(entry.performed_at)}</td>
                    `;
                    
                    statusHistory.appendChild(tr);
                });
            }
        }
        
        return systemLog;
    } catch (error) {
        console.error('Error loading system log:', error);
        return [];
    }
}

// Toggle order details
function toggleOrderDetails(orderId) {
    const detailsElement = document.getElementById(`order-details-${orderId}`);
    if (detailsElement) {
        detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
    }
}

// Export orders to text file
async function exportOrders() {
    try {
        const orders = await getQueuedOrders('all');
        
        if (orders.length === 0) {
            showNotification('No orders to export.', 'info');
            return;
        }
        
        // Generate text content
        let content = "SEOUL GRILL 199 - ORDER BACKUP\n";
        content += "Generated: " + new Date().toLocaleString() + "\n";
        content += "=".repeat(80) + "\n\n";
        
        // Write header
        content += "ORDER ID     STATUS          AMOUNT          CUSTOMER                  DATE\n";
        content += "-".repeat(80) + "\n";
        
        // Write order data
        orders.forEach(order => {
            content += `#${padString(order.order_id, 10)} ${padString(order.status, 15)} ₱${padString(order.total_amount.toFixed(2), 15)} ${padString(order.customer_name || 'Guest', 25)} ${formatDate(order.queued_at)}\n`;
            
            // Write order items
            content += "  Items:\n";
            for (const [product, quantity] of Object.entries(order.items)) {
                content += `    - ${product} x ${quantity}\n`;
            }
            
            // Add processed date if available
            if (order.processed_at) {
                content += `  Processed: ${formatDate(order.processed_at)}\n`;
            }
            
            content += "-".repeat(80) + "\n";
        });
        
        // Write footer
        content += "\nTotal Orders: " + orders.length + "\n";
        content += "End of Backup\n";
        
        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `seoul_grill_orders_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update last backup info
        const lastBackup = document.getElementById('last-backup');
        if (lastBackup) {
            lastBackup.textContent = `Last backup: ${new Date().toLocaleString()}`;
        }
        
        // Show download link
        const downloadBackup = document.getElementById('download-backup');
        if (downloadBackup) {
            downloadBackup.href = url;
            downloadBackup.download = `seoul_grill_orders_${timestamp}.txt`;
            downloadBackup.style.display = 'inline-flex';
        }
        
        showNotification('Orders exported successfully.', 'success');
        return true;
    } catch (error) {
        console.error('Error exporting orders:', error);
        showNotification('Error exporting orders.', 'error');
        return false;
    }
}

// Import orders from text file
async function importOrders(fileContent) {
    try {
        if (!fileContent) {
            throw new Error('No file content provided.');
        }
        
        const lines = fileContent.split('\n');
        let currentOrder = null;
        let importedCount = 0;
        let orderItems = {};
        
        // Get current orders
        const existingOrders = await getQueuedOrders('all');
        const existingOrderIds = new Set(existingOrders.map(order => order.order_id));
        
        for (const line of lines) {
            // Skip header lines
            if (line.includes("SEOUL GRILL 199") || 
                line.includes("Generated:") || 
                line.startsWith("=") ||
                line.includes("ORDER ID") ||
                line.includes("Total Orders:") ||
                line.includes("End of Backup") ||
                line.trim() === '' ||
                line.startsWith("-")) {
                continue;
            }
            
            // Check if this is an order line (starts with #)
            const orderMatch = line.match(/^#(\d+)\s+(\w+)\s+₱([\d,.]+)\s+(.+?)\s+(.+)$/);
            if (orderMatch) {
                // If we have a previous order, save it first
                if (currentOrder) {
                    // Only add if order ID doesn't already exist
                    if (!existingOrderIds.has(currentOrder.order_id)) {
                        currentOrder.items = orderItems;
                        existingOrders.push(currentOrder);
                        existingOrderIds.add(currentOrder.order_id);
                        importedCount++;
                    }
                    orderItems = {};
                }
                
                // Parse the new order
                const orderId = orderMatch[1].trim();
                const status = orderMatch[2].trim();
                const amount = parseFloat(orderMatch[3].replace(',', ''));
                const customer = orderMatch[4].trim();
                const date = orderMatch[5].trim();
                
                currentOrder = {
                    order_id: orderId,
                    status: status,
                    total_amount: amount,
                    customer_name: customer !== 'Guest' ? customer : null,
                    queued_at: new Date(date).toISOString(),
                    processed_at: null,
                    items: {}
                };
            }
            // Check if this is an item line
            else if (currentOrder && line.match(/^\s+- (.+) x (\d+)$/)) {
                const itemMatch = line.match(/^\s+- (.+) x (\d+)$/);
                const product = itemMatch[1];
                const quantity = parseInt(itemMatch[2], 10);
                orderItems[product] = quantity;
            }
            // Check if this is a processed date line
            else if (currentOrder && line.match(/^\s+Processed: (.+)$/)) {
                const processedMatch = line.match(/^\s+Processed: (.+)$/);
                currentOrder.processed_at = new Date(processedMatch[1]).toISOString();
            }
        }
        
        // Save the last order if exists
        if (currentOrder && !existingOrderIds.has(currentOrder.order_id)) {
            currentOrder.items = orderItems;
            existingOrders.push(currentOrder);
            importedCount++;
        }
        
        // Update orders in bin
        if (importedCount > 0) {
            await updateBinData('ORDERS', existingOrders);
            
            // Log import action
            await logSystemAction(
                'orders_imported',
                `${importedCount} orders imported`,
                'admin'
            );
        }
        
        return {
            success: true,
            count: importedCount,
            message: `Successfully imported ${importedCount} orders.`
        };
    } catch (error) {
        console.error('Error importing orders:', error);
        return {
            success: false,
            count: 0,
            message: `Error importing orders: ${error.message}`
        };
    }
}
