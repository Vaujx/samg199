/**
 * Main JavaScript File
 * This file initializes the application
 */

// Declare variables for functions that are not defined in this file
let initializeJSONBins
let displayProducts
let displayCart
let showNotification
let openCheckoutModal
let updateCart
let closeCheckoutModal
let processPayment
let closeSuccessModal
let toggleChat
let getSystemStatus

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Initializing application...")

    // Initialize JSONBins
    await initializeJSONBins()

    // Load and display products
    await displayProducts()

    // Display cart
    await displayCart()

    // Check system status
    await checkSystemStatus()

    // Set current year in footer
    const currentYearElements = document.querySelectorAll("#current-year")
    currentYearElements.forEach((element) => {
      element.textContent = new Date().getFullYear()
    })

    // Add event listeners
    setupEventListeners()

    console.log("Application initialized successfully.")
  } catch (error) {
    console.error("Error initializing application:", error)
    showNotification("There was an error initializing the application. Please refresh the page.", "error")
  }
})

// Set up event listeners
function setupEventListeners() {
  // Checkout button
  const checkoutButton = document.getElementById("checkout-button")
  if (checkoutButton) {
    checkoutButton.addEventListener("click", openCheckoutModal)
  }

  // Update cart button
  const updateCartButton = document.getElementById("update-cart-button")
  if (updateCartButton) {
    updateCartButton.addEventListener("click", updateCart)
  }

  // Checkout modal close button
  const checkoutModalClose = document.querySelector(".checkout-modal-close")
  if (checkoutModalClose) {
    checkoutModalClose.addEventListener("click", closeCheckoutModal)
  }

  // Checkout modal cancel button
  const checkoutModalCancel = document.querySelector(".checkout-modal-cancel")
  if (checkoutModalCancel) {
    checkoutModalCancel.addEventListener("click", closeCheckoutModal)
  }

  // Checkout modal pay button
  const checkoutModalPay = document.querySelector(".checkout-modal-pay")
  if (checkoutModalPay) {
    checkoutModalPay.addEventListener("click", processPayment)
  }

  // Success modal continue button
  const successButton = document.querySelector(".success-button")
  if (successButton) {
    successButton.addEventListener("click", closeSuccessModal)
  }

  // Chat toggle button
  const chatToggle = document.querySelector(".chat-toggle")
  if (chatToggle) {
    chatToggle.addEventListener("click", toggleChat)
  }

  // Close chat button
  const closeChat = document.querySelector(".close-chat")
  if (closeChat) {
    closeChat.addEventListener("click", toggleChat)
  }
}

// Check system status and update UI accordingly
async function checkSystemStatus() {
  try {
    const systemStatus = await getSystemStatus()

    // Update system status indicator
    const statusIndicator = document.getElementById("system-status-indicator")
    const statusDot = document.getElementById("status-dot")
    const statusText = document.getElementById("status-text")

    if (statusIndicator && statusDot && statusText) {
      statusIndicator.className = `system-status-indicator ${systemStatus ? "status-online" : "status-offline"}`
      statusDot.className = `status-dot ${systemStatus ? "dot-online" : "dot-offline"}`
      statusText.textContent = systemStatus ? "System Online" : "System Maintenance"
    }

    // Show/hide maintenance notice
    const maintenanceNotice = document.getElementById("maintenance-notice")
    if (maintenanceNotice) {
      maintenanceNotice.style.display = systemStatus ? "none" : "block"
    }
  } catch (error) {
    console.error("Error checking system status:", error)
  }
}

// Open image modal
function openModal(imageSrc) {
  const modal = document.createElement("div")
  modal.classList.add("modal")

  const modalContent = document.createElement("img")
  modalContent.src = imageSrc
  modalContent.classList.add("modal-content")

  const closeButton = document.createElement("span")
  closeButton.classList.add("close")
  closeButton.textContent = "×"
  closeButton.onclick = () => {
    modal.remove()
  }

  modal.appendChild(modalContent)
  modal.appendChild(closeButton)
  document.body.appendChild(modal)
  modal.style.display = "block"

  // Close modal when clicking outside the image
  modal.onclick = (event) => {
    if (event.target === modal) {
      modal.remove()
    }
  }
}

