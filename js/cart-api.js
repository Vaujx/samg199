/**
 * Shopping Cart API
 * This file handles cart-related operations
 */

// Mock functions (replace with actual implementations or imports)
function showNotification(message, type) {
    console.log(`Notification: ${message} (Type: ${type})`);
}

async function getProducts() {
    // Replace with actual product data retrieval
    return {
        "Kimchi Fried Rice": { price: 12.99 },
        "Bulgogi": { price: 15.99 },
        "Bibimbap": { price: 13.99 }
    };
}

async function getSystemStatus() {
    // Replace with actual system status check
    return Math.random() < 0.8; // Simulate online status 80% of the time
}

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function queueOrder(order) {
    // Replace with actual order queuing logic
    console.log("Order Queued:", order);
    return true;
}


// Initialize cart from localStorage
function initCart() {
    const savedCart = localStorage.getItem('seoul_grill_cart');
    return savedCart ? JSON.parse(savedCart) : {};
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('seoul_grill_cart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(product, quantity) {
    const cart = initCart();
    
    // Add or update quantity
    cart[product] = (cart[product] || 0) + quantity;
    
    // Save cart
    saveCart(cart);
    
    // Update cart UI
    displayCart();
    
    // Show notification
    showNotification(`Added ${quantity} x ${product} to your cart!`, 'success');
}

// Remove item from cart
function removeFromCart(product) {
    const cart = initCart();
    
    // Remove product
    delete cart[product];
    
    // Save cart
    saveCart(cart);
    
    // Update cart UI
    displayCart();
}

// Update cart quantity
function updateCartQuantity(product, quantity) {
    const cart = initCart();
    
    // Update quantity
    if (quantity > 0) {
        cart[product] = quantity;
    } else {
        delete cart[product];
    }
    
    // Save cart
    saveCart(cart);
    
    // Update cart UI
    displayCart();
}

// Clear cart
function clearCart() {
    // Clear cart in localStorage
    localStorage.removeItem('seoul_grill_cart');
    
    // Update cart UI
    displayCart();
}

// Calculate cart total
async function calculateCartTotal() {
    const cart = initCart();
    let total = 0;
    
    try {
        const products = await getProducts();
        
        // Calculate total
        for (const [product, quantity] of Object.entries(cart)) {
            if (products[product]) {
                total += products[product].price * quantity;
            }
        }
    } catch (error) {
        console.error('Error calculating cart total:', error);
    }
    
    return total;
}

// Display cart
async function displayCart() {
    const cart = initCart();
    const cartContainer = document.getElementById('cart-container');
    const cartItems = document.getElementById('cart-items');
    
    if (!cartContainer || !cartItems) return;
    
    // Show/hide cart container based on cart contents
    if (Object.keys(cart).length === 0) {
        cartContainer.style.display = 'none';
        return;
    } else {
        cartContainer.style.display = 'block';
    }
    
    try {
        const products = await getProducts();
        let total = 0;
        
        // Clear cart items
        cartItems.innerHTML = '';
        
        // Add cart items
        for (const [product, quantity] of Object.entries(cart)) {
            if (products[product]) {
                const price = products[product].price;
                const subtotal = price * quantity;
                total += subtotal;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product}</td>
                    <td>
                        <input type="number" class="quantity-input" value="${quantity}" min="1" 
                            onchange="updateCartQuantity('${product}', parseInt(this.value, 10))">
                    </td>
                    <td>₱${subtotal.toFixed(2)}</td>
                    <td>
                        <button type="button" class="remove-button" onclick="removeFromCart('${product}')">Remove</button>
                    </td>
                `;
                
                cartItems.appendChild(row);
            }
        }
        
        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="2"><strong>Total:</strong></td>
            <td colspan="2"><strong>₱${total.toFixed(2)}</strong></td>
        `;
        
        cartItems.appendChild(totalRow);
        
        // Update checkout total
        const checkoutTotal = document.getElementById('checkout-total');
        if (checkoutTotal) {
            checkoutTotal.textContent = `₱${total.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error displaying cart:', error);
    }
}

// Open checkout modal
async function openCheckoutModal() {
    const cart = initCart();
    
    // Check if cart is empty
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    try {
        // Get system status
        const systemOnline = await getSystemStatus();
        
        // Update checkout modal based on system status
        const checkoutMaintenanceNotice = document.getElementById('checkout-maintenance-notice');
        const checkoutButtonText = document.getElementById('checkout-button-text');
        
        if (checkoutMaintenanceNotice && checkoutButtonText) {
            if (systemOnline) {
                checkoutMaintenanceNotice.style.display = 'none';
                checkoutButtonText.textContent = 'Pay Now';
            } else {
                checkoutMaintenanceNotice.style.display = 'block';
                checkoutButtonText.textContent = 'Queue Order';
            }
        }
        
        // Show checkout modal
        document.getElementById('checkoutModal').style.display = 'block';
    } catch (error) {
        console.error('Error opening checkout modal:', error);
        showNotification('Error opening checkout. Please try again later.', 'error');
    }
}

// Close checkout modal
function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}

// Process payment
async function processPayment() {
    const cart = initCart();
    
    // Check if cart is empty
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty!', 'error');
        closeCheckoutModal();
        return;
    }
    
    try {
        // Get system status
        const systemOnline = await getSystemStatus();
        
        // Calculate total
        const total = await calculateCartTotal();
        
        // Create order
        const order = {
            order_id: generateId(),
            items: cart,
            total_amount: total,
            customer_name: 'Guest', // In a real app, you would collect customer info
            status: systemOnline ? 'processed' : 'queued',
            queued_at: new Date().toISOString(),
            processed_at: systemOnline ? new Date().toISOString() : null
        };
        
        // Queue order
        const success = await queueOrder(order);
        
        if (success) {
            // Clear cart
            clearCart();
            
            // Close checkout modal
            closeCheckoutModal();
            
            // Show success modal
            const successTitle = document.getElementById('success-title');
            const successMessage = document.getElementById('success-message');
            
            if (successTitle && successMessage) {
                if (systemOnline) {
                    successTitle.textContent = 'Payment Successful!';
                    successMessage.textContent = 'Thank you for your order. Your delivery will arrive shortly.';
                } else {
                    successTitle.textContent = 'Order Queued Successfully!';
                    successMessage.textContent = 'Your order has been queued and will be processed as soon as our system is back online.';
                }
            }
            
            document.getElementById('successModal').style.display = 'block';
        } else {
            showNotification('Error processing order. Please try again later.', 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Error processing payment. Please try again later.', 'error');
    }
}

// Close success modal
function closeSuccessModal() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}
