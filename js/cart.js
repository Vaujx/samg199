/**
 * Shopping Cart Management
 * This file handles all cart-related functionality
 */

// Mock functions for demonstration purposes.  In a real application, these would be imported or defined elsewhere.
async function loadProducts() {
  // Replace with actual product loading logic
  return {
    kimchi: { price: 5.0 },
    bulgogi: { price: 10.0 },
    bibimbap: { price: 8.0 },
  }
}

async function getSystemStatus() {
  // Replace with actual system status check
  return true
}

async function queueOrder(order) {
  // Replace with actual order queuing logic
  return true
}

// Initialize cart from localStorage or create empty cart
function initializeCart() {
  const cart = localStorage.getItem("seoul_grill_cart")
  return cart ? JSON.parse(cart) : {}
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem("seoul_grill_cart", JSON.stringify(cart))
}

// Add item to cart
function addToCart(product, quantity) {
  const cart = initializeCart()

  // Add or update quantity
  cart[product] = (cart[product] || 0) + quantity

  // Save updated cart
  saveCart(cart)

  // Update cart display
  displayCart()

  // Show notification
  showNotification(`Added ${quantity} x ${product} to your cart!`)
}

// Remove item from cart
function removeFromCart(product) {
  const cart = initializeCart()

  // Remove product from cart
  delete cart[product]

  // Save updated cart
  saveCart(cart)

  // Update cart display
  displayCart()
}

// Update cart quantities
function updateCart() {
  const cart = initializeCart()
  const quantityInputs = document.querySelectorAll(".cart-quantity-input")

  quantityInputs.forEach((input) => {
    const product = input.getAttribute("data-product")
    const quantity = Number.parseInt(input.value, 10)

    if (quantity > 0) {
      cart[product] = quantity
    } else {
      delete cart[product]
    }
  })

  // Save updated cart
  saveCart(cart)

  // Update cart display
  displayCart()

  // Show notification
  showNotification("Cart updated successfully!")
}

// Calculate cart total
async function calculateTotal(cart) {
  let total = 0

  // Load products to get prices
  const products = await loadProducts()

  for (const [product, quantity] of Object.entries(cart)) {
    if (products[product]) {
      total += products[product].price * quantity
    }
  }

  return total
}

// Display cart contents
async function displayCart() {
  const cart = initializeCart()
  const cartContainer = document.getElementById("cart-container")
  const cartItems = document.getElementById("cart-items")

  if (!cartContainer || !cartItems) return

  // Show/hide cart container based on whether cart has items
  if (Object.keys(cart).length === 0) {
    cartContainer.style.display = "none"
    return
  } else {
    cartContainer.style.display = "block"
  }

  // Clear existing cart items
  cartItems.innerHTML = ""

  // Load products to get prices
  const products = await loadProducts()
  let total = 0

  // Add each cart item to the table
  for (const [product, quantity] of Object.entries(cart)) {
    if (products[product]) {
      const price = products[product].price
      const subtotal = price * quantity
      total += subtotal

      const tr = document.createElement("tr")
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
            `

      cartItems.appendChild(tr)
    }
  }

  // Add total row
  const totalRow = document.createElement("tr")
  totalRow.innerHTML = `
        <td colspan="2"><strong>Total:</strong></td>
        <td colspan="2"><strong>₱${total.toFixed(2)}</strong></td>
    `
  cartItems.appendChild(totalRow)

  // Add event listeners to remove buttons
  document.querySelectorAll(".remove-button").forEach((button) => {
    button.addEventListener("click", function () {
      const product = this.getAttribute("data-product")
      removeFromCart(product)
    })
  })

  // Update checkout total
  const checkoutTotal = document.getElementById("checkout-total")
  if (checkoutTotal) {
    checkoutTotal.textContent = `₱${total.toFixed(2)}`
  }
}

// Process payment/checkout
async function processPayment() {
  const cart = initializeCart()

  // Check if cart is empty
  if (Object.keys(cart).length === 0) {
    showNotification("Your cart is empty!")
    closeCheckoutModal()
    return
  }

  try {
    // Check system status
    const systemStatus = await getSystemStatus()

    // Calculate total
    const total = await calculateTotal(cart)

    // Create order object
    const order = {
      order_id: generateOrderId(),
      items: cart,
      total_amount: total,
      customer_name: "Guest",
      status: systemStatus ? "processed" : "queued",
      queued_at: new Date().toISOString(),
      processed_at: systemStatus ? new Date().toISOString() : null,
    }

    // Queue order
    const success = await queueOrder(order)

    if (success) {
      // Clear cart
      localStorage.removeItem("seoul_grill_cart")

      // Close checkout modal
      closeCheckoutModal()

      // Show success modal
      const successTitle = document.getElementById("success-title")
      const successMessage = document.getElementById("success-message")

      if (successTitle && successMessage) {
        if (systemStatus) {
          successTitle.textContent = "Payment Successful!"
          successMessage.textContent = "Thank you for your order. Your delivery will arrive shortly."
        } else {
          successTitle.textContent = "Order Queued Successfully!"
          successMessage.textContent =
            "Your order has been queued and will be processed as soon as our system is back online."
        }
      }

      document.getElementById("successModal").style.display = "block"
    } else {
      showNotification("There was an error processing your order. Please try again later.")
      closeCheckoutModal()
    }
  } catch (error) {
    console.error("Error processing payment:", error)
    showNotification("There was an error processing your order. Please try again later.")
    closeCheckoutModal()
  }
}

// Generate a unique order ID
function generateOrderId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Open checkout modal
async function openCheckoutModal() {
  const cart = initializeCart()

  // Check if cart is empty
  if (Object.keys(cart).length === 0) {
    showNotification("Your cart is empty!")
    return
  }

  // Check system status and update modal accordingly
  const systemStatus = await getSystemStatus()

  // Update modal based on system status
  const maintenanceNotice = document.getElementById("checkout-maintenance-notice")
  const checkoutButtonText = document.getElementById("checkout-button-text")

  if (maintenanceNotice && checkoutButtonText) {
    if (systemStatus) {
      maintenanceNotice.style.display = "none"
      checkoutButtonText.textContent = "Pay Now"
    } else {
      maintenanceNotice.style.display = "block"
      checkoutButtonText.textContent = "Queue Order"
    }
  }

  // Show the modal
  document.getElementById("checkoutModal").style.display = "block"
}

// Close checkout modal
function closeCheckoutModal() {
  document.getElementById("checkoutModal").style.display = "none"
}

// Close success modal
function closeSuccessModal() {
  document.getElementById("successModal").style.display = "none"
  // Refresh the page to update cart display
  window.location.reload()
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  if (!notification || !notificationMessage) return

  // Set message
  notificationMessage.textContent = message

  // Set icon based on type
  const icon = notification.querySelector("i")
  if (icon) {
    if (type === "success") {
      icon.className = "fas fa-check-circle"
      icon.style.color = "#4CAF50"
    } else if (type === "error") {
      icon.className = "fas fa-times-circle"
      icon.style.color = "#F44336"
    } else if (type === "warning") {
      icon.className = "fas fa-exclamation-triangle"
      icon.style.color = "#FF9800"
    } else if (type === "info") {
      icon.className = "fas fa-info-circle"
      icon.style.color = "#2196F3"
    }
  }

  // Show notification
  notification.style.display = "block"

  // Auto-hide after 4 seconds
  setTimeout(() => {
    notification.style.display = "none"
  }, 4000)
}

