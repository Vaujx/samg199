/**
 * Shopping Cart Management
 * This file handles all cart-related functionality
 */

// Assuming these functions are defined elsewhere (e.g., in products.js or a separate data service file)
// For demonstration purposes, we'll define placeholder functions.
// In a real application, these would be properly imported or defined.

async function loadProducts() {
  // Placeholder: Replace with actual product loading logic
  return {
    "Product A": { price: 10 },
    "Product B": { price: 20 },
    "Product C": { price: 30 },
  }
}

async function getBinData(key) {
  // Placeholder: Replace with actual data retrieval logic from JSONBin or similar service
  if (key === "SYSTEM_STATUS") {
    return { status: 1 } // Assuming system is online by default
  } else if (key === "ORDERS") {
    return [] // Assuming empty orders array initially
  }
  return null
}

async function updateBinData(key, data) {
  // Placeholder: Replace with actual data update logic to JSONBin or similar service
  console.log(`Updating ${key} with data:`, data)
  return true // Assuming update is successful
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
function showNotification(message) {
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  if (notification && notificationMessage) {
    notificationMessage.textContent = message
    notification.style.display = "block"

    // Auto-hide notification after 4 seconds
    setTimeout(() => {
      notification.style.display = "none"
    }, 4000)
  }
}

async function getSystemStatus() {
  const systemStatus = await getBinData("SYSTEM_STATUS")
  return systemStatus.status === 1
}

async function queueOrder(order) {
  try {
    const orders = await getBinData("ORDERS")
    orders.push(order)
    await updateBinData("ORDERS", orders)
    return true
  } catch (error) {
    console.error("Error queuing order:", error)
    return false
  }
}

