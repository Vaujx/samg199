/**
* Main JavaScript File
* This file initializes the application
*/

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Initializing application...");

        // Check if functions are available
        if (typeof window.initializeJSONBins !== 'function') {
            throw new Error("Required functions not loaded. Make sure jsonbin-api.js is loaded before main.js");
        }

        // Initialize JSONBins
        await window.initializeJSONBins();

        // Define utility functions if they're not already defined
        window.showNotification = window.showNotification || function(message, type) {
            console.log(`Notification: ${message} (Type: ${type})`);
            const notification = document.getElementById("notification");
            const notificationMessage = document.getElementById("notification-message");

            if (!notification || !notificationMessage) return;

            // Set message
            notificationMessage.textContent = message;

            // Set icon based on type
            const icon = notification.querySelector("i");
            if (icon) {
                if (type === "success") {
                    icon.className = "fas fa-check-circle";
                    icon.style.color = "#4CAF50";
                } else if (type === "error") {
                    icon.className = "fas fa-times-circle";
                    icon.style.color = "#F44336";
                } else if (type === "warning") {
                    icon.className = "fas fa-exclamation-triangle";
                    icon.style.color = "#FF9800";
                } else if (type === "info") {
                    icon.className = "fas fa-info-circle";
                    icon.style.color = "#2196F3";
                }
            }

            // Show notification
            notification.style.display = "block";

            // Auto-hide after 4 seconds
            setTimeout(() => {
                notification.style.display = "none";
            }, 4000);
        };

        // Load and display products
        if (typeof displayProducts === 'function') {
            await displayProducts();
        }

        // Display cart
        if (typeof displayCart === 'function') {
            await displayCart();
        }

        // Check system status
        await checkSystemStatus();

        // Set current year in footer
        const currentYearElements = document.querySelectorAll("#current-year");
        currentYearElements.forEach((element) => {
            element.textContent = new Date().getFullYear();
        });

        // Add event listeners
        setupEventListeners();

        console.log("Application initialized successfully.");
    } catch (error) {
        console.error("Error initializing application:", error);
        if (typeof window.showNotification === 'function') {
            window.showNotification("There was an error initializing the application. Please refresh the page.", "error");
        }
        console.log("Application will continue with limited functionality.");
    }
});

// Set up event listeners
function setupEventListeners() {
    // Checkout button
    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", function() {
            if (typeof openCheckoutModal === 'function') {
                openCheckoutModal();
            }
        });
    }

    // Update cart button
    const updateCartButton = document.getElementById("update-cart-button");
    if (updateCartButton) {
        updateCartButton.addEventListener("click", function() {
            if (typeof updateCart === 'function') {
                updateCart();
            }
        });
    }

    // Checkout modal close button
    const checkoutModalClose = document.querySelector(".checkout-modal-close");
    if (checkoutModalClose) {
        checkoutModalClose.addEventListener("click", function() {
            if (typeof closeCheckoutModal === 'function') {
                closeCheckoutModal();
            }
        });
    }

    // Checkout modal cancel button
    const checkoutModalCancel = document.querySelector(".checkout-modal-cancel");
    if (checkoutModalCancel) {
        checkoutModalCancel.addEventListener("click", function() {
            if (typeof closeCheckoutModal === 'function') {
                closeCheckoutModal();
            }
        });
    }

    // Checkout modal pay button
    const checkoutModalPay = document.querySelector(".checkout-modal-pay");
    if (checkoutModalPay) {
        checkoutModalPay.addEventListener("click", function() {
            if (typeof processPayment === 'function') {
                processPayment();
            }
        });
    }

    // Success modal continue button
    const successButton = document.querySelector(".success-button");
    if (successButton) {
        successButton.addEventListener("click", function() {
            if (typeof closeSuccessModal === 'function') {
                closeSuccessModal();
            }
        });
    }

    // Chat toggle button
    const chatToggle = document.querySelector(".chat-toggle");
    if (chatToggle) {
        chatToggle.addEventListener("click", function() {
            if (typeof toggleChat === 'function') {
                toggleChat();
            }
        });
    }

    // Close chat button
    const closeChat = document.querySelector(".close-chat");
    if (closeChat) {
        closeChat.addEventListener("click", function() {
            if (typeof toggleChat === 'function') {
                toggleChat();
            }
        });
    }
}

// Check system status and update UI accordingly
async function checkSystemStatus() {
    try {
        if (typeof window.getSystemStatus !== 'function') {
            console.warn("getSystemStatus function not available");
            return;
        }
        
        const systemStatus = await window.getSystemStatus();

        // Update system status indicator
        const statusIndicator = document.getElementById("system-status-indicator");
        const statusDot = document.getElementById("status-dot");
        const statusText = document.getElementById("status-text");

        if (statusIndicator && statusDot && statusText) {
            statusIndicator.className = `system-status-indicator ${systemStatus ? "status-online" : "status-offline"}`;
            statusDot.className = `status-dot ${systemStatus ? "dot-online" : "dot-offline"}`;
            statusText.textContent = systemStatus ? "System Online" : "System Maintenance";
        }

        // Show/hide maintenance notice
        const maintenanceNotice = document.getElementById("maintenance-notice");
        if (maintenanceNotice) {
            maintenanceNotice.style.display = systemStatus ? "none" : "block";
        }
    } catch (error) {
        console.error("Error checking system status:", error);
    }
}

// Open image modal
function openModal(imageSrc) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    const modalContent = document.createElement("img");
    modalContent.src = imageSrc;
    modalContent.classList.add("modal-content");

    const closeButton = document.createElement("span");
    closeButton.classList.add("close");
    closeButton.textContent = "×";
    closeButton.onclick = () => {
        modal.remove();
    };

    modal.appendChild(modalContent);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
    modal.style.display = "block";

    // Close modal when clicking outside the image
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// Make functions available globally
window.checkSystemStatus = checkSystemStatus;
window.openModal = openModal;
window.setupEventListeners = setupEventListeners;
