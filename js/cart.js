/**
 * Shopping Cart Management
 * This file handles all cart-related functionality
 */

// Initialize cart from localStorage or create empty cart
function initializeCart() {
    const cart = localStorage.getItem('seoul_grill_cart');
    return cart ? JSON.parse(cart) : {};
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('seoul_grill_cart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(product, quantity) {
    console.log(`Adding to cart: ${product} x ${quantity}`);
    const cart = initializeCart();
    
    // Add or update quantity
    cart[product] = (cart[product] || 0) + quantity;
    
    // Save updated cart
    saveCart(cart);
    
    // Update cart display
    displayCart();
    
    // Show notification
    showNotification(`Added ${quantity} x ${product} to your cart!`, 'success');
}

// Remove item from cart
function removeFromCart(product) {
    console.log(`Removing from cart: ${product}`);
    const cart = initializeCart();
    
    // Remove product from cart
    delete cart[product];
    
    // Save updated cart
    saveCart(cart);
    
    // Update cart display
    displayCart();
    
    // Show notification
    showNotification(`Removed ${product} from your cart.`, 'info');
}

// Update cart quantities
function updateCart() {
    console.log('Updating cart quantities');
    const cart = initializeCart();
    const quantityInputs = document.querySelectorAll('.cart-quantity-input');
    
    quantityInputs.forEach(input => {
        const product = input.getAttribute('data-product');
        const quantity = parseInt(input.value, 10);
        
        if (quantity > 0) {
            cart[product] = quantity;
        } else {
            delete cart[product];
        }
    });
    
    // Save updated cart
    saveCart(cart);
    
    // Update cart display
    displayCart();
    
    // Show notification
    showNotification('Cart updated successfully!', 'success');
}

// Clear cart
function clearCart() {
    console.log('Clearing cart');
    
    // Clear cart in localStorage
    localStorage.removeItem('seoul_grill_cart');
    
    // Update cart display
    displayCart();
    
    // Show notification
    showNotification('Your cart has been cleared.', 'info');
}

// Calculate cart total
async function calculateTotal(cart) {
    let total = 0;
    
    // Load products to get prices
    const products = await loadProducts();
    
    for (const [product, quantity] of Object.entries(cart)) {
        if (products[product]) {
            total += products[product].price * quantity;
        }
    }
    
    return total;
}

// Display cart contents
async function displayCart() {
    const cart = initializeCart();
    const cartContainer = document.getElementById('cart-container');
    const cartItems = document.getElementById('cart-items');
    
    if (!cartContainer || !cartItems) return;
    
    // Show/hide cart container based on whether cart has items
    if (Object.keys(cart).length === 0) {
        cartContainer.style.display = 'none';
        return;
    } else {
        cartContainer.style.display = 'block';
    }
    
    // Clear existing cart items
    cartItems.innerHTML = '';
    
    // Load products to get prices
    const products = await loadProducts();
    let total = 0;
    
    // Add each cart item to the table
    for (const [product, quantity] of Object.entries(cart)) {
        if (products[product]) {
            const price = products[product].price;
            const subtotal = price * quantity;
            total += subtotal;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product}</td>
                <td>
                    <input type="number" class="quantity-input cart-quantity-input" 
                        value="${quantity}" min="1" data-product="${product}">
                </td>
                <td>₱${subtotal.toFixed(2)}</td>
                <td>
                    <button type="button" class="remove-button" data-product="${product}">Remove</button>
                </td>
            `;
            
            cartItems.appendChild(tr);
        }
    }
    
    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="2"><strong>Total:</strong></td>
        <td colspan="2"><strong>₱${total.toFixed(2)}</strong></td>
    `;
    cartItems.appendChild(totalRow);
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', function() {
            const product = this.getAttribute('data-product');
            removeFromCart(product);
        });
    });
    
    // Update checkout total
    const checkoutTotal = document.getElementById('checkout-total');
    if (checkoutTotal) {
        checkoutTotal.textContent = `₱${total.toFixed(2)}`;
    }
}

// Process payment/checkout
async function processPayment() {
    const cart = initializeCart();
    
    // Check if cart is empty
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty!', 'error');
        closeCheckoutModal();
        return;
    }
    
    try {
        // Check system status
        const systemStatus = await getSystemStatus();
        
        // Calculate total
        const total = await calculateTotal(cart);
        
        // Create order object
        const order = {
            order_id: generateOrderId(),
            items: cart,
            total_amount: total,
            customer_name: 'Guest',
            status: systemStatus ? 'processed' : 'queued',
            queued_at: new Date().toISOString(),
            processed_at: systemStatus ? new Date().toISOString() : null
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
                if (systemStatus) {
                    successTitle.textContent = 'Payment Successful!';
                    successMessage.textContent = 'Thank you for your order. Your delivery will arrive shortly.';
                } else {
                    successTitle.textContent = 'Order Queued Successfully!';
                    successMessage.textContent = 'Your order has been queued and will be processed as soon as our system is back online.';
                }
            }
            
            document.getElementById('successModal').style.display = 'block';
        } else {
            showNotification('There was an error processing your order. Please try again later.', 'error');
            closeCheckoutModal();
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('There was an error processing your order. Please try again later.', 'error');
        closeCheckoutModal();
    }
}

// Generate a unique order ID
function generateOrderId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Open checkout modal
async function openCheckoutModal() {
    const cart = initializeCart();
    
    // Check if cart is empty
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty!', 'warning');
        return;
    }
    
    // Check system status and update modal accordingly
    const systemStatus = await getSystemStatus();
    
    // Update modal based on system status
    const maintenanceNotice = document.getElementById('checkout-maintenance-notice');
    const checkoutButtonText = document.getElementById('checkout-button-text');
    
    if (maintenanceNotice && checkoutButtonText) {
        if (systemStatus) {
            maintenanceNotice.style.display = 'none';
            checkoutButtonText.textContent = 'Pay Now';
        } else {
            maintenanceNotice.style.display = 'block';
            checkoutButtonText.textContent = 'Queue Order';
        }
    }
    
    // Show the modal
    document.getElementById('checkoutModal').style.display = 'block';
}

// Close checkout modal
function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    // Refresh the page to update cart display
    window.location.reload();
}

// Get cart item count
function getCartItemCount() {
    const cart = initializeCart();
    let count = 0;
    
    for (const quantity of Object.values(cart)) {
        count += quantity;
    }
    
    return count;
}

// Update cart badge
function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (!cartBadge) return;
    
    const count = getCartItemCount();
    
    if (count > 0) {
        cartBadge.textContent = count;
        cartBadge.style.display = 'block';
    } else {
        cartBadge.style.display = 'none';
    }
}
