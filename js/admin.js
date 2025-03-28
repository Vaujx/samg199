/**
 * Admin Panel Functionality
 * This file handles all admin panel related functionality
 */

// Initialize admin panel
async function initializeAdminPanel() {
    try {
        console.log('Initializing admin panel...');
        
        // Check if user is authenticated
        if (!isAuthenticated()) {
            showLoginForm();
            return;
        }
        
        // Set specific bin ID for system status history
        if (CONFIG && CONFIG.BINS) {
            CONFIG.BINS.SYSTEM_STATUS_HISTORY = "67e5fbdd8561e97a50f44996";
            console.log('Set SYSTEM_STATUS_HISTORY bin ID:', CONFIG.BINS.SYSTEM_STATUS_HISTORY);
        } else {
            // Initialize CONFIG.BINS if it doesn't exist
            if (!CONFIG) CONFIG = {};
            if (!CONFIG.BINS) CONFIG.BINS = {};
            CONFIG.BINS.SYSTEM_STATUS_HISTORY = "67e5fbdd8561e97a50f44996";
        }
        
        // Initialize JSONBins if not already initialized
        await initializeJSONBins();
        
        // Initialize system status display
        await initializeSystemStatus();
        
        // Initialize system status history
        await initializeSystemStatusHistory();
        
        // Initialize order management
        await initializeOrderManagement();
        
        // Initialize system log
        await initializeSystemLog();
        
        console.log('Admin panel initialized successfully');
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showNotification('Error initializing admin panel. Please try again later.', 'error');
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('seoul_grill_admin_auth') === 'true';
}

// Show login form
function showLoginForm() {
    document.getElementById('admin-login-container').style.display = 'block';
    document.getElementById('admin-panel-container').style.display = 'none';
}

// Show admin panel
function showAdminPanel() {
    document.getElementById('admin-login-container').style.display = 'none';
    document.getElementById('admin-panel-container').style.display = 'block';
}

// Authenticate admin
function authenticateAdmin(event) {
    event.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    console.log('Attempting login with:', username, password);
    
    // Simple authentication for demo purposes
    // In a real application, this should be done securely on the server
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('seoul_grill_admin_auth', 'true');
        showAdminPanel();
        initializeAdminPanel();
        showNotification('Authentication successful!', 'success');
    } else {
        showNotification('Invalid username or password!', 'error');
    }
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('seoul_grill_admin_auth');
    showLoginForm();
    showNotification('Logged out successfully!', 'info');
}

// Initialize system status display
async function initializeSystemStatus() {
    try {
        console.log('Initializing system status display...');
        
        // Get current system status
        const systemStatus = await getBinData('SYSTEM_STATUS');
        
        // Update status toggle
        const statusToggle = document.getElementById('system-status-toggle');
        if (statusToggle) {
            statusToggle.checked = systemStatus.status === 1;
            
            // Add event listener to toggle
            statusToggle.addEventListener('change', async function() {
                await updateSystemStatus(this.checked ? 1 : 0);
            });
        }
        
        // Update status text
        updateSystemStatusText(systemStatus.status === 1);
        
        console.log('System status display initialized successfully');
    } catch (error) {
        console.error('Error initializing system status display:', error);
        showNotification('Error loading system status. Please try again later.', 'error');
    }
}

// Initialize system status history
async function initializeSystemStatusHistory() {
    try {
        console.log('Initializing system status history...');
        
        // Get system status history
        let statusHistory = [];
        
        try {
            // Try to get history from the specific bin
            const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.SYSTEM_STATUS_HISTORY}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                statusHistory = data.record;
                
                // Ensure statusHistory is an array
                if (!Array.isArray(statusHistory)) {
                    console.warn('SYSTEM_STATUS_HISTORY data is not an array, initializing as empty array');
                    statusHistory = [];
                }
            } else {
                console.warn('Failed to get SYSTEM_STATUS_HISTORY data, initializing as empty array');
                statusHistory = [];
                
                // Initialize the bin with an empty array
                await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.SYSTEM_STATUS_HISTORY}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.MASTER_KEY
                    },
                    body: JSON.stringify([])
                });
            }
        } catch (error) {
            console.warn('Error getting SYSTEM_STATUS_HISTORY data, initializing as empty array:', error);
            statusHistory = [];
            
            // Initialize the bin with an empty array
            try {
                await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.SYSTEM_STATUS_HISTORY}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.MASTER_KEY
                    },
                    body: JSON.stringify([])
                });
            } catch (e) {
                console.error('Error initializing SYSTEM_STATUS_HISTORY bin:', e);
            }
        }
        
        // If no history in the specific bin, try to get from system log
        if (statusHistory.length === 0) {
            try {
                // Get system log
                const systemLog = await getBinData('SYSTEM_LOG');
                
                // Filter status change events
                const statusChanges = systemLog.filter(log => log.action === 'system_status_updated');
                
                // Add to status history
                statusHistory = statusChanges.map(change => ({
                    status: change.description.includes('online') ? 1 : 0,
                    changed_at: change.performed_at,
                    changed_by: change.performed_by,
                    description: change.description
                }));
                
                // Save to the specific bin
                if (statusHistory.length > 0) {
                    await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.SYSTEM_STATUS_HISTORY}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Master-Key': CONFIG.MASTER_KEY
                        },
                        body: JSON.stringify(statusHistory)
                    });
                }
            } catch (error) {
                console.error('Error getting status history from system log:', error);
            }
        }
        
        // Sort by date (newest first)
        statusHistory.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
        
        // Get history container
        const historyContainer = document.getElementById('system-status-history');
        if (!historyContainer) return;
        
        // Clear existing history
        historyContainer.innerHTML = '';
        
        // Add history items
        if (statusHistory.length === 0) {
            historyContainer.innerHTML = '<p>No status changes recorded.</p>';
        } else {
            const historyList = document.createElement('ul');
            historyList.className = 'status-history-list';
            
            statusHistory.forEach(change => {
                const item = document.createElement('li');
                const date = new Date(change.changed_at);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                const status = change.status === 1 ? 'online' : 'offline';
                
                item.innerHTML = `
                    <span class="status-dot ${status}"></span>
                    <span class="status-text">System ${status}</span>
                    <span class="status-date">${formattedDate}</span>
                    <span class="status-user">by ${change.changed_by}</span>
                `;
                
                historyList.appendChild(item);
            });
            
            historyContainer.appendChild(historyList);
        }
        
        console.log('System status history initialized successfully');
    } catch (error) {
        console.error('Error initializing system status history:', error);
        showNotification('Error loading system status history. Please try again later.', 'error');
    }
}

// Update system status
async function updateSystemStatus(status) {
    try {
        console.log(`Updating system status to ${status}...`);
        
        // Get current system status
        const systemStatus = await getBinData('SYSTEM_STATUS');
        
        // Update status
        systemStatus.status = status;
        
        // Update bin data
        await updateBinData('SYSTEM_STATUS', systemStatus);
        
        // Update status text
        updateSystemStatusText(status === 1);
        
        // Log status change
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'system_status_updated',
            description: `System status changed to ${status === 1 ? 'online' : 'offline'}`,
            performed_by: 'admin',
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        // Add to status history
        try {
            // Get current history
            const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.SYSTEM_STATUS_HISTORY}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY
                }
            });
            
            let statusHistory = [];
            
            if (response.ok) {
                const data = await response.json();
                statusHistory = data.record;
                
                // Ensure statusHistory is an array
                if (!Array.isArray(statusHistory)) {
                    statusHistory = [];
                }
            }
            
            // Add new status change
            statusHistory.push({
                status: status,
                changed_at: new Date().toISOString(),
                changed_by: 'admin',
                description: `System status changed to ${status === 1 ? 'online' : 'offline'}`
            });
            
            // Update history bin
            await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS.SYSTEM_STATUS_HISTORY}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.MASTER_KEY
                },
                body: JSON.stringify(statusHistory)
            });
        } catch (error) {
            console.error('Error updating status history:', error);
        }
        
        // Refresh status history
        await initializeSystemStatusHistory();
        
        // Show notification
        showNotification(`System status updated to ${status === 1 ? 'online' : 'offline'}!`, 'success');
        
        console.log(`System status updated to ${status} successfully`);
    } catch (error) {
        console.error('Error updating system status:', error);
        showNotification('Error updating system status. Please try again later.', 'error');
    }
}

// Update system status text
function updateSystemStatusText(isOnline) {
    const statusText = document.getElementById('system-status-text');
    if (statusText) {
        statusText.textContent = isOnline ? 'Online' : 'Offline';
        statusText.className = isOnline ? 'status-online' : 'status-offline';
    }
}

// Initialize order management
async function initializeOrderManagement() {
    try {
        console.log('Initializing order management...');
        
        // Get orders
        let orders = [];
        try {
            orders = await getBinData('ORDERS');
            if (!Array.isArray(orders)) {
                console.warn('ORDERS data is not an array, initializing as empty array');
                orders = [];
            }
        } catch (error) {
            console.error('Error getting orders:', error);
            orders = [];
        }
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.queued_at) - new Date(a.queued_at));
        
        // Get orders container
        const ordersContainer = document.getElementById('orders-container');
        if (!ordersContainer) return;
        
        // Clear existing orders
        ordersContainer.innerHTML = '';
        
        // Add orders
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p>No orders found.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'orders-table';
            
            // Add table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Add table body
            const tbody = document.createElement('tbody');
            
            orders.forEach(order => {
                const tr = document.createElement('tr');
                
                // Format items
                const itemsList = Object.entries(order.items)
                    .map(([item, quantity]) => `${item} x ${quantity}`)
                    .join('<br>');
                
                // Format date
                const date = new Date(order.queued_at);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                
                tr.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${order.customer_email || 'Guest'}</td>
                    <td>${itemsList}</td>
                    <td>₱${order.total_amount.toFixed(2)}</td>
                    <td class="order-status ${order.status}">${order.status}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button class="view-order-button" data-order-id="${order.order_id}">View</button>
                        ${order.status === 'queued' ? `<button class="process-order-button" data-order-id="${order.order_id}">Process</button>` : ''}
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            ordersContainer.appendChild(table);
            
            // Add event listeners to buttons
            document.querySelectorAll('.view-order-button').forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    viewOrder(orderId);
                });
            });
            
            document.querySelectorAll('.process-order-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const orderId = this.getAttribute('data-order-id');
                    await processOrder(orderId);
                });
            });
        }
        
        // Add process all button if there are queued orders
        const queuedOrders = orders.filter(order => order.status === 'queued');
        const processAllContainer = document.getElementById('process-all-container');
        
        if (processAllContainer) {
            if (queuedOrders.length > 0) {
                processAllContainer.innerHTML = `
                    <button id="process-all-button">Process All Queued Orders (${queuedOrders.length})</button>
                `;
                
                document.getElementById('process-all-button').addEventListener('click', processAllOrders);
            } else {
                processAllContainer.innerHTML = '';
            }
        }
        
        console.log('Order management initialized successfully');
    } catch (error) {
        console.error('Error initializing order management:', error);
        showNotification('Error loading orders. Please try again later.', 'error');
    }
}

// View order details
async function viewOrder(orderId) {
    try {
        console.log(`Viewing order ${orderId}...`);
        
        // Get orders
        let orders = [];
        try {
            orders = await getBinData('ORDERS');
            if (!Array.isArray(orders)) {
                console.warn('ORDERS data is not an array, initializing as empty array');
                orders = [];
            }
        } catch (error) {
            console.error('Error getting orders:', error);
            orders = [];
        }
        
        // Find order
        const order = orders.find(o => o.order_id === orderId);
        
        if (!order) {
            showNotification(`Order #${orderId} not found!`, 'error');
            return;
        }
        
        // Get modal elements
        const modal = document.getElementById('orderDetailsModal');
        const modalContent = document.getElementById('order-details-content');
        
        if (!modal || !modalContent) return;
        
        // Format items
        const itemsList = Object.entries(order.items)
            .map(([item, quantity]) => `<li>${item} x ${quantity}</li>`)
            .join('');
        
        // Format dates
        const queuedDate = new Date(order.queued_at);
        const formattedQueuedDate = `${queuedDate.toLocaleDateString()} ${queuedDate.toLocaleTimeString()}`;
        
        let formattedProcessedDate = 'Not processed yet';
        if (order.processed_at) {
            const processedDate = new Date(order.processed_at);
            formattedProcessedDate = `${processedDate.toLocaleDateString()} ${processedDate.toLocaleTimeString()}`;
        }
        
        // Update modal content
        modalContent.innerHTML = `
            <h3>Order #${order.order_id}</h3>
            <p><strong>Customer:</strong> ${order.customer_email || 'Guest'}</p>
            <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status}</span></p>
            <p><strong>Total Amount:</strong> ₱${order.total_amount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method}</p>
            <p><strong>Queued At:</strong> ${formattedQueuedDate}</p>
            <p><strong>Processed At:</strong> ${formattedProcessedDate}</p>
            
            <h4>Items:</h4>
            <ul>
                ${itemsList}
            </ul>
            
            ${order.status === 'queued' ? `<button id="modal-process-button" data-order-id="${order.order_id}">Process Order</button>` : ''}
        `;
        
        // Show modal
        modal.style.display = 'block';
        
        // Add event listener to process button
        const processButton = document.getElementById('modal-process-button');
        if (processButton) {
            processButton.addEventListener('click', async function() {
                const orderId = this.getAttribute('data-order-id');
                await processOrder(orderId);
                closeOrderDetailsModal();
            });
        }
        
        console.log(`Order ${orderId} details displayed successfully`);
    } catch (error) {
        console.error(`Error viewing order ${orderId}:`, error);
        showNotification('Error loading order details. Please try again later.', 'error');
    }
}

// Close order details modal
function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Process order
async function processOrder(orderId) {
    try {
        console.log(`Processing order ${orderId}...`);
        
        // Show loading spinner
        showLoadingSpinner(`Processing order #${orderId}...`);
        
        // Update order status
        await updateOrderStatus(orderId, 'processed', 'admin');
        
        // Hide loading spinner
        hideLoadingSpinner();
        
        // Refresh order management
        await initializeOrderManagement();
        
        // Show notification
        showNotification(`Order #${orderId} processed successfully!`, 'success');
        
        console.log(`Order ${orderId} processed successfully`);
    } catch (error) {
        console.error(`Error processing order ${orderId}:`, error);
        
        // Hide loading spinner
        hideLoadingSpinner();
        
        showNotification('Error processing order. Please try again later.', 'error');
    }
}

// Process all queued orders
async function processAllOrders() {
    try {
        console.log('Processing all queued orders...');
        
        // Show loading spinner
        showLoadingSpinner('Processing all queued orders...');
        
        // Process queued orders
        const result = await processQueuedOrders();
        
        // Hide loading spinner
        hideLoadingSpinner();
        
        // Refresh order management
        await initializeOrderManagement();
        
        // Show notification
        showNotification(`Processed ${result.success} out of ${result.total} orders!`, result.failed > 0 ? 'warning' : 'success');
        
        console.log('All queued orders processed successfully');
    } catch (error) {
        console.error('Error processing all queued orders:', error);
        
        // Hide loading spinner
        hideLoadingSpinner();
        
        showNotification('Error processing orders. Please try again later.', 'error');
    }
}

// Initialize system log
async function initializeSystemLog() {
    try {
        console.log('Initializing system log...');
        
        // Get system log
        let systemLog = [];
        try {
            systemLog = await getBinData('SYSTEM_LOG');
            if (!Array.isArray(systemLog)) {
                console.warn('SYSTEM_LOG data is not an array, initializing as empty array');
                systemLog = [];
            }
        } catch (error) {
            console.error('Error getting system log:', error);
            systemLog = [];
        }
        
        // Sort by date (newest first)
        systemLog.sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));
        
        // Get log container
        const logContainer = document.getElementById('system-log-container');
        if (!logContainer) return;
        
        // Clear existing log
        logContainer.innerHTML = '';
        
        // Add log items
        if (systemLog.length === 0) {
            logContainer.innerHTML = '<p>No log entries found.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'system-log-table';
            
            // Add table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Performed By</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Add table body
            const tbody = document.createElement('tbody');
            
            systemLog.forEach(log => {
                const tr = document.createElement('tr');
                
                // Format date
                const date = new Date(log.performed_at);
                const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                
                tr.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${log.action}</td>
                    <td>${log.description}</td>
                    <td>${log.performed_by}</td>
                `;
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            logContainer.appendChild(table);
        }
        
        console.log('System log initialized successfully');
    } catch (error) {
        console.error('Error initializing system log:', error);
        showNotification('Error loading system log. Please try again later.', 'error');
    }
}

// Add loading spinner functions if not already defined
if (typeof showLoadingSpinner !== 'function') {
    // Add CSS for loading spinner
    function addLoadingSpinnerStyles() {
        // Check if styles already exist
        if (document.getElementById('loading-spinner-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-spinner-styles';
        style.textContent = `
            .loading-spinner-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
            }
            
            .loading-text {
                color: white;
                margin-top: 20px;
                font-size: 18px;
                text-align: center;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Show loading spinner
    function showLoadingSpinner(message = 'Loading...') {
        // Add styles if not already added
        addLoadingSpinnerStyles();
        
        // Create spinner overlay
        const overlay = document.createElement('div');
        overlay.className = 'loading-spinner-overlay';
        overlay.id = 'loading-spinner-overlay';
        
        // Create spinner container
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        // Create text
        const text = document.createElement('div');
        text.className = 'loading-text';
        text.textContent = message;
        
        // Assemble elements
        container.appendChild(spinner);
        container.appendChild(text);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }

    // Hide loading spinner
    function hideLoadingSpinner() {
        const overlay = document.getElementById('loading-spinner-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    // Make functions available globally
    window.showLoadingSpinner = showLoadingSpinner;
    window.hideLoadingSpinner = hideLoadingSpinner;
}

// Make functions available globally
window.initializeAdminPanel = initializeAdminPanel;
window.isAuthenticated = isAuthenticated;
window.showLoginForm = showLoginForm;
window.showAdminPanel = showAdminPanel;
window.authenticateAdmin = authenticateAdmin;
window.logoutAdmin = logoutAdmin;
window.initializeSystemStatus = initializeSystemStatus;
window.initializeSystemStatusHistory = initializeSystemStatusHistory;
window.updateSystemStatus = updateSystemStatus;
window.initializeOrderManagement = initializeOrderManagement;
window.viewOrder = viewOrder;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.processOrder = processOrder;
window.processAllOrders = processAllOrders;
window.initializeSystemLog = initializeSystemLog;

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is the admin page
    if (document.getElementById('admin-panel-container')) {
        console.log('Admin page detected, initializing...');
        
        if (isAuthenticated()) {
            console.log('User is authenticated, showing admin panel');
            showAdminPanel();
            initializeAdminPanel();
        } else {
            console.log('User is not authenticated, showing login form');
            showLoginForm();
        }
        
        // Add event listener to login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            console.log('Adding event listener to login form');
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                authenticateAdmin(event);
            });
        }
        
        // Add event listener to logout button
        const logoutButton = document.getElementById('admin-logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logoutAdmin);
        }
        
        // Add event listener to close modal button
        const closeModalButton = document.getElementById('close-order-details-modal');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeOrderDetailsModal);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('orderDetailsModal');
            if (modal && event.target === modal) {
                closeOrderDetailsModal();
            }
        });
    }
});
