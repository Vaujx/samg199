/**
 * Order Tracking Functionality
 * This file handles the order tracking functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing order tracking...');
    
    // Set the specific bin ID for order tracking
    if (CONFIG && CONFIG.BINS) {
        CONFIG.BINS.ORDER_TRACKING = "67e60dcc8561e97a50f45273";
        console.log('Set ORDER_TRACKING bin ID:', CONFIG.BINS.ORDER_TRACKING);
    }
    
    // Initialize JSONBins
    if (typeof window.initializeJSONBins === 'function') {
        window.initializeJSONBins()
            .then(() => {
                console.log('JSONBins initialized for order tracking');
                
                // Check if email is in URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const email = urlParams.get('email');
                
                if (email) {
                    console.log(`Email found in URL: ${email}`);
                    document.getElementById('tracking-email').value = email;
                    trackOrders();
                }
                
                // Add event listeners
                setupTrackingEventListeners();
            })
            .catch(error => {
                console.error('Error initializing JSONBins for order tracking:', error);
                showNotification('There was an error initializing the tracking system. Please try again later.', 'error');
            });
    } else {
        console.error('Required functions not loaded. Make sure jsonbin-api.js is loaded before order-tracking.js');
        showNotification('There was an error loading the tracking system. Please try refreshing the page.', 'error');
    }
});

// Set up tracking event listeners
function setupTrackingEventListeners() {
    console.log('Setting up tracking event listeners');
    
    // Track button
    const trackButton = document.getElementById('track-button');
    if (trackButton) {
        trackButton.addEventListener('click', trackOrders);
        console.log('Track button event listener added');
    }
    
    // Enter key in email field
    const emailInput = document.getElementById('tracking-email');
    if (emailInput) {
        emailInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                trackOrders();
            }
        });
        console.log('Email input event listener added');
    }
}

// Track orders
async function trackOrders() {
    console.log('Tracking orders...');
    
    // Get email
    const email = document.getElementById('tracking-email').value.trim();
    
    // Validate email
    if (!email || !validateEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    try {
        // Show loading state
        const trackButton = document.getElementById('track-button');
        const originalButtonText = trackButton.innerHTML;
        trackButton.innerHTML = '<div class="loading-spinner"></div> Loading...';
        trackButton.disabled = true;
        
        // Get orders by email
        let orders = [];
        
        // Try to get orders from the ORDER_TRACKING bin
        try {
            console.log('Fetching orders from ORDER_TRACKING bin for email:', email);
            const trackingData = await getBinData('ORDER_TRACKING');
            console.log('ORDER_TRACKING data:', trackingData);
            
            if (Array.isArray(trackingData)) {
                orders = trackingData.filter(order => order.customer_email === email);
                console.log('Filtered orders by email:', orders);
            } else {
                console.warn('ORDER_TRACKING bin data is not an array:', trackingData);
            }
        } catch (error) {
            console.error('Error getting order tracking data:', error);
            // Fallback to getting orders from the ORDERS bin
            try {
                console.log('Falling back to ORDERS bin for email:', email);
                const allOrders = await getBinData('ORDERS');
                if (Array.isArray(allOrders)) {
                    orders = allOrders.filter(order => order.customer_email === email);
                    console.log('Filtered orders from ORDERS bin:', orders);
                }
            } catch (fallbackError) {
                console.error('Error getting fallback order data:', fallbackError);
            }
        }
        
        // Reset button
        trackButton.innerHTML = originalButtonText;
        trackButton.disabled = false;
        
        // Display orders
        displayOrders(orders);
    } catch (error) {
        console.error('Error tracking orders:', error);
        
        // Reset button
        const trackButton = document.getElementById('track-button');
        trackButton.innerHTML = '<i class="fas fa-search"></i> Track Orders';
        trackButton.disabled = false;
        
        showNotification('There was an error tracking your orders. Please try again later.', 'error');
    }
}

// Display orders
function displayOrders(orders) {
    console.log(`Displaying ${orders.length} orders`);
    
    const ordersContainer = document.getElementById('orders-container');
    const ordersList = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders');
    
    // Clear previous orders
    ordersList.innerHTML = '';
    
    // Show/hide containers based on whether orders were found
    if (orders.length === 0) {
        ordersContainer.style.display = 'none';
        noOrders.style.display = 'block';
        return;
    } else {
        ordersContainer.style.display = 'block';
        noOrders.style.display = 'none';
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.queued_at) - new Date(a.queued_at));
    
    // Add each order to the list
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Create order items HTML
        let orderItemsHtml = '';
        for (const [product, quantity] of Object.entries(order.items)) {
            orderItemsHtml += `<li>${product} x ${quantity}</li>`;
        }
        
        // Determine status class
        let statusClass = '';
        let statusText = '';
        
        switch (order.status) {
            case 'processed':
                statusClass = 'status-processed';
                statusText = 'Processing';
                break;
            case 'queued':
                statusClass = 'status-queued';
                statusText = 'Queued';
                break;
            case 'delivered':
                statusClass = 'status-delivered';
                statusText = 'Delivered';
                break;
            case 'cancelled':
                statusClass = 'status-cancelled';
                statusText = 'Cancelled';
                break;
            default:
                statusClass = 'status-queued';
                statusText = order.status || 'Queued';
        }
        
        // Create tracking steps based on order status
        let trackingStepsHtml = `
            <div class="tracking-steps">
                <div class="step step-active">
                    <div class="step-icon"><i class="fas fa-check"></i></div>
                    <div class="step-content">
                        <div class="step-title">Order Placed</div>
                        <div class="step-description">${formatDate(order.queued_at)}</div>
                    </div>
                </div>
                <div class="step-line ${order.status !== 'queued' ? 'step-active' : ''}"></div>
                
                <div class="step ${order.status !== 'queued' ? 'step-active' : ''}">
                    <div class="step-icon">${order.status !== 'queued' ? '<i class="fas fa-check"></i>' : '2'}</div>
                    <div class="step-content">
                        <div class="step-title">Order Processing</div>
                        <div class="step-description">${order.processed_at ? formatDate(order.processed_at) : 'Pending'}</div>
                    </div>
                </div>
                <div class="step-line ${order.status === 'delivered' ? 'step-active' : ''}"></div>
                
                <div class="step ${order.status === 'delivered' ? 'step-active' : ''}">
                    <div class="step-icon">${order.status === 'delivered' ? '<i class="fas fa-check"></i>' : '3'}</div>
                    <div class="step-content">
                        <div class="step-title">Order Delivered</div>
                        <div class="step-description">${order.status === 'delivered' ? 'Completed' : 'Pending'}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Create order card HTML
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.order_id}</div>
                <div class="order-date">${formatDate(order.queued_at)}</div>
            </div>
            <div class="order-status-container">
                <span class="order-status ${statusClass}">${statusText}</span>
                <span class="payment-method">Cash on Delivery</span>
            </div>
            <div class="order-items">
                <h4>Items:</h4>
                <ul>
                    ${orderItemsHtml}
                </ul>
            </div>
            ${trackingStepsHtml}
            <div class="order-total">Total: ₱${order.total_amount.toFixed(2)}</div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);
    
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (!notification || !notificationMessage) return;
    
    // Set message
    notificationMessage.textContent = message;
    
    // Set icon based on type
    const icon = notification.querySelector('i');
    if (icon) {
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#4CAF50';
        } else if (type === 'error') {
            icon.className = 'fas fa-times-circle';
            icon.style.color = '#F44336';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
            icon.style.color = '#FF9800';
        } else {
            icon.className = 'fas fa-info-circle';
            icon.style.color = '#2196F3';
        }
    }
    
    // Show notification
    notification.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// Make functions available globally
window.trackOrders = trackOrders;
window.validateEmail = validateEmail;
window.formatDate = formatDate;
window.showNotification = showNotification;
