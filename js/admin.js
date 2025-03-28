/**
 * Admin Panel Functionality
 * This file handles all admin panel related functionality
 */

// Declare CONFIG variable
const CONFIG = {
    ADMIN_PASSWORD: "password123" // Replace with a more secure password
};

// Initialize admin panel
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing admin panel...");

    // Initialize JSONBins
    if (typeof window.initializeJSONBins === 'function') {
        window.initializeJSONBins()
            .then(() => {
                console.log("JSONBins initialized for admin panel");

                // Add event listeners
                setupAdminEventListeners();

                // Check if admin is already logged in
                const isLoggedIn = localStorage.getItem("seoul_grill_admin_logged_in") === "true";
                if (isLoggedIn) {
                    console.log("Admin already logged in, showing dashboard");
                    showAdminDashboard();
                } else {
                    console.log("Admin not logged in, showing login form");
                }
            })
            .catch((error) => {
                console.error("Error initializing JSONBins for admin panel:", error);
                if (typeof window.showNotification === 'function') {
                    window.showNotification("There was an error initializing the admin panel. Please try again later.", "error");
                }
            });
    } else {
        console.error("Required functions not loaded. Make sure jsonbin-api.js is loaded before admin.js");
        if (typeof window.showNotification === 'function') {
            window.showNotification("There was an error loading the admin panel. Please refresh the page.", "error");
        }
    }
});

// Set up admin event listeners
function setupAdminEventListeners() {
    console.log("Setting up admin event listeners");

    // Login button
    const loginButton = document.getElementById("login-button");
    if (loginButton) {
        loginButton.addEventListener("click", handleAdminLogin);
        console.log("Login button event listener added");
    }

    // Enter key in password field
    const passwordInput = document.getElementById("admin_password");
    if (passwordInput) {
        passwordInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                handleAdminLogin();
            }
        });
        console.log("Password input event listener added");
    }

    // Logout button
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", handleAdminLogout);
        console.log("Logout button event listener added");
    }

    // System status buttons
    const onlineButton = document.getElementById("online-button");
    const offlineButton = document.getElementById("offline-button");

    if (onlineButton) {
        onlineButton.addEventListener("click", async () => {
            console.log("Bringing system online...");
            try {
                await setSystemStatus(true, "admin");
                console.log("System brought online successfully");
                await loadSystemStatus();
                await loadQueuedOrders();
                await loadSystemStatusHistory();
                if (typeof window.showNotification === 'function') {
                    window.showNotification("System brought online successfully", "success");
                }
            } catch (error) {
                console.error("Error bringing system online:", error);
                if (typeof window.showNotification === 'function') {
                    window.showNotification("Error bringing system online. Please try again.", "error");
                }
            }
        });
        console.log("Online button event listener added");
    }

    if (offlineButton) {
        offlineButton.addEventListener("click", async () => {
            console.log("Taking system offline...");
            try {
                await setSystemStatus(false, "admin");
                console.log("System taken offline successfully");
                await loadSystemStatus();
                await loadQueuedOrders();
                await loadSystemStatusHistory();
                if (typeof window.showNotification === 'function') {
                    window.showNotification("System taken offline successfully", "success");
                }
            } catch (error) {
                console.error("Error taking system offline:", error);
                if (typeof window.showNotification === 'function') {
                    window.showNotification("Error taking system offline. Please try again.", "error");
                }
            }
        });
        console.log("Offline button event listener added");
    }

    // Export button
    const exportButton = document.getElementById("export-button");
    if (exportButton) {
        exportButton.addEventListener("click", exportOrders);
        console.log("Export button event listener added");
    }

    // Import button
    const importButton = document.getElementById("import-button");
    if (importButton) {
        importButton.addEventListener("click", importOrders);
        console.log("Import button event listener added");
    }
}

// Handle admin login
function handleAdminLogin() {
    console.log("Handling admin login...");
    const passwordInput = document.getElementById("admin_password");
    if (passwordInput && passwordInput.value === CONFIG.ADMIN_PASSWORD) {
        console.log("Admin login successful");
        localStorage.setItem("seoul_grill_admin_logged_in", "true");
        showAdminDashboard();
        if (typeof window.showNotification === 'function') {
            window.showNotification("Login successful", "success");
        }
    } else {
        console.log("Admin login failed - incorrect password");
        if (typeof window.showNotification === 'function') {
            window.showNotification("Invalid password. Please try again.", "error");
        }
    }
}

// Handle admin logout
function handleAdminLogout(e) {
    if (e) e.preventDefault();
    console.log("Handling admin logout...");
    localStorage.removeItem("seoul_grill_admin_logged_in");
    hideAdminDashboard();
    if (typeof window.showNotification === 'function') {
        window.showNotification("Logged out successfully", "info");
    }
    console.log("Admin logged out successfully");
}

// Check if admin is logged in
function isAdminLoggedIn() {
    return localStorage.getItem("seoul_grill_admin_logged_in") === "true";
}

// Show admin dashboard
async function showAdminDashboard() {
    console.log("Showing admin dashboard");
    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-dashboard").style.display = "block";

    // Load dashboard data
    try {
        await loadSystemStatus();
        await loadQueuedOrders();
        await loadSystemStatusHistory();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        if (typeof window.showNotification === 'function') {
            window.showNotification("Error loading dashboard data. Some information may be missing.", "warning");
        }
    }
}

// Hide admin dashboard
function hideAdminDashboard() {
    console.log("Hiding admin dashboard");
    document.getElementById("admin-login").style.display = "block";
    document.getElementById("admin-dashboard").style.display = "none";
}

// Load system status
async function loadSystemStatus() {
    try {
        console.log("Loading system status...");
        const systemStatus = await window.getBinData("SYSTEM_STATUS");
        const systemOnline = systemStatus.status === 1;

        // Update system status indicator
        const statusElement = document.getElementById("system-status");
        if (statusElement) {
            statusElement.className = `system-status ${systemOnline ? "status-online" : "status-offline"}`;
            statusElement.textContent = systemOnline ? "System Online" : "System Offline";
        }

        // Update buttons
        const onlineButton = document.getElementById("online-button");
        const offlineButton = document.getElementById("offline-button");

        if (onlineButton) {
            onlineButton.disabled = systemOnline;
        }

        if (offlineButton) {
            offlineButton.disabled = !systemOnline;
        }

        console.log("System status loaded successfully:", systemOnline ? "Online" : "Offline");
        return systemOnline;
    } catch (error) {
        console.error("Error loading system status:", error);
        return true; // Default to online if there's an error
    }
}

// Load queued orders
async function loadQueuedOrders() {
    try {
        console.log("Loading queued orders...");
        const orders = await window.getBinData("ORDERS");
        const queuedOrders = orders.filter((order) => order.status === "queued");

        // Update queue count
        const queueCount = document.getElementById("queue-count");
        if (queueCount) {
            queueCount.textContent = queuedOrders.length;
        }

        // Update queue status message
        const queueStatusMessage = document.getElementById("queue-status-message");
        if (queueStatusMessage) {
            if (queuedOrders.length > 0) {
                const systemOnline = await loadSystemStatus();
                if (!systemOnline) {
                    queueStatusMessage.textContent = "These orders will be processed when the system is brought back online.";
                } else {
                    queueStatusMessage.textContent = "The system is online. Orders are being processed normally.";
                }
            } else {
                queueStatusMessage.textContent = "No orders are currently queued.";
            }
        }

        // Show/hide queued orders section
        const queuedOrdersSection = document.getElementById("queued-orders-section");
        if (queuedOrdersSection) {
            queuedOrdersSection.style.display = queuedOrders.length > 0 ? "block" : "none";
        }

        // Update queued orders list
        const queuedOrdersList = document.getElementById("queued-orders-list");
        if (queuedOrdersList && queuedOrders.length > 0) {
            queuedOrdersList.innerHTML = "";

            queuedOrders.forEach((order) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.customer_email || order.customer_name || "Guest"}</td>
                    <td>₱${order.total_amount.toFixed(2)}</td>
                    <td>${formatDate(order.queued_at)}</td>
                    <td>
                        <button class="status-button" onclick="toggleOrderDetails('${order.order_id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <div id="order-details-${order.order_id}" class="order-details" style="display: none;">
                            <strong>Items:</strong>
                            <ul>
                                ${Object.entries(order.items)
                                    .map(([product, quantity]) => `<li>${product} x ${quantity}</li>`)
                                    .join("")}
                            </ul>
                        </div>
                    </td>
                `;

                queuedOrdersList.appendChild(tr);
            });
        }

        console.log("Queued orders loaded successfully:", queuedOrders.length, "orders");
        return queuedOrders;
    } catch (error) {
        console.error("Error loading queued orders:", error);
        return [];
    }
}

// Toggle order details visibility
function toggleOrderDetails(orderId) {
    const detailsElement = document.getElementById(`order-details-${orderId}`);
    if (detailsElement) {
        detailsElement.style.display = detailsElement.style.display === "none" ? "block" : "none";
    }
}

// Load system status history
async function loadSystemStatusHistory() {
    try {
        console.log("Loading system status history...");
        const systemLog = await window.getBinData("SYSTEM_LOG");
        const statusHistory = systemLog
            .filter((entry) => entry.action === "system_status_updated")
            .slice(-5); // Get last 5 entries

        // Update status history table
        const statusHistoryTable = document.getElementById("status-history");
        if (statusHistoryTable) {
            statusHistoryTable.innerHTML = "";

            if (statusHistory.length === 0) {
                const tr = document.createElement("tr");
                tr.innerHTML = '<td colspan="3">No status changes recorded yet.</td>';
                statusHistoryTable.appendChild(tr);
            } else {
                statusHistory.forEach((entry) => {
                    const tr = document.createElement("tr");
                    const isOnline = entry.description.includes("online");
                    tr.innerHTML = `
                        <td>
                            ${
                                isOnline
                                    ? '<span class="status-online"><i class="fas fa-check-circle"></i> System Brought Online</span>'
                                    : '<span class="status-offline"><i class="fas fa-times-circle"></i> System Taken Offline</span>'
                            }
                        </td>
                        <td>${entry.performed_by}</td>
                        <td>${formatDate(entry.performed_at)}</td>
                    `;

                    statusHistoryTable.appendChild(tr);
                });
            }
        }

        console.log("System status history loaded successfully:", statusHistory.length, "entries");
        return statusHistory;
    } catch (error) {
        console.error("Error loading system status history:", error);
        return [];
    }
}

// Set system status
async function setSystemStatus(isOnline, performedBy = "system") {
    try {
        console.log(`Setting system status to ${isOnline ? "online" : "offline"}...`);
        
        // Get current system status
        const systemStatus = await window.getBinData("SYSTEM_STATUS");
        
        // Update status
        systemStatus.status = isOnline ? 1 : 0;
        systemStatus.updated_by = performedBy;
        systemStatus.updated_at = new Date().toISOString();
        
        // Update system status in JSONBin
        await window.updateBinData("SYSTEM_STATUS", systemStatus);
        
        // Log status change
        const systemLog = await window.getBinData("SYSTEM_LOG");
        systemLog.push({
            action: "system_status_updated",
            description: `System status changed to ${isOnline ? "online" : "offline"}`,
            performed_by: performedBy,
            performed_at: new Date().toISOString()
        });
        await window.updateBinData("SYSTEM_LOG", systemLog);
        
        // Process queued orders if bringing system online
        if (isOnline) {
            const queuedOrders = await window.getBinData("ORDERS");
            const queuedCount = queuedOrders.filter(order => order.status === "queued").length;
            
            if (queuedCount > 0) {
                console.log(`Processing ${queuedCount} queued orders...`);
                const results = await window.processQueuedOrders();
                displayProcessingResults(results);
            }
        }
        
        console.log(`System status set to ${isOnline ? "online" : "offline"} successfully`);
        return true;
    } catch (error) {
        console.error(`Error setting system status to ${isOnline ? "online" : "offline"}:`, error);
        throw error;
    }
}

// Display processing results
function displayProcessingResults(results) {
    const processingResults = document.getElementById("processing-results");
    if (!processingResults) return;

    // Show processing results section
    processingResults.style.display = "block";

    // Update result counts
    document.getElementById("total-processed").textContent = results.total;
    document.getElementById("success-processed").textContent = results.success;
    document.getElementById("failed-processed").textContent = results.failed;

    // Show/hide failed message
    const failedMessage = document.getElementById("failed-message");
    if (failedMessage) {
        failedMessage.style.display = results.failed > 0 ? "block" : "none";
    }
}

// Helper function to pad strings
function padString(str, length) {
    str = String(str);
    return str.length >= length ? str : str + " ".repeat(length - str.length);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Export orders to text file
async function exportOrders() {
    try {
        console.log("Exporting orders...");
        const orders = await window.getBinData("ORDERS");

        if (orders.length === 0) {
            if (typeof window.showNotification === 'function') {
                window.showNotification("No orders to export", "info");
            }
            return;
        }

        // Generate text content
        let content = "SEOUL GRILL 199 - ORDER BACKUP\n";
        content += "Generated: " + new Date().toLocaleString() + "\n";
        content += "=".repeat(80) + "\n\n";

        content += "ORDER ID     STATUS          AMOUNT          CUSTOMER                  DATE\n";
        content += "-".repeat(80) + "\n";

        orders.forEach((order) => {
            content += `#${padString(order.order_id, 10)} ${padString(order.status, 15)} ₱${padString(order.total_amount.toFixed(2), 15)} ${padString(order.customer_email || order.customer_name || "Guest", 25)} ${formatDate(order.queued_at)}\n`;

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

        content += "\nTotal Orders: " + orders.length + "\n";
        content += "End of Backup\n";

        // Create and download file
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

        const a = document.createElement("a");
        a.href = url;
        a.download = `seoul_grill_orders_${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update last backup info
        const lastBackup = document.getElementById("last-backup");
        if (lastBackup) {
            lastBackup.textContent = `Last backup: ${formatDate(new Date())}`;
        }

        // Show download link
        const downloadBackup = document.getElementById("download-backup");
        if (downloadBackup) {
            downloadBackup.href = url;
            downloadBackup.download = `seoul_grill_orders_${timestamp}.txt`;
            downloadBackup.style.display = "inline-flex";
        }

        if (typeof window.showNotification === 'function') {
            window.showNotification("Orders exported successfully", "success");
        }
        console.log("Orders exported successfully");
    } catch (error) {
        console.error("Error exporting orders:", error);
        if (typeof window.showNotification === 'function') {
            window.showNotification("Error exporting orders. Please try again.", "error");
        }
    }
}

// Import orders from text file
async function importOrders() {
    const fileInput = document.getElementById("import-file");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Please select a file to import", "warning");
        }
        return;
    }

    console.log("Importing orders...");
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const content = e.target.result;
            const lines = content.split("\n");

            let currentOrder = null;
            let importedCount = 0;
            let orderItems = {};

            // Get current orders
            const existingOrders = await window.getBinData("ORDERS");
            const existingOrderIds = new Set(existingOrders.map((order) => order.order_id));

            for (const line of lines) {
                // Skip header lines
                if (
                    line.includes("SEOUL GRILL 199") ||
                    line.includes("Generated:") ||
                    line.startsWith("=") ||
                    line.includes("ORDER ID") ||
                    line.includes("Total Orders:") ||
                    line.includes("End of Backup") ||
                    line.trim() === "" ||
                    line.startsWith("-")
                ) {
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
                    const amount = parseFloat(orderMatch[3].replace(",", ""));
                    const customer = orderMatch[4].trim();
                    const date = orderMatch[5].trim();

                    currentOrder = {
                        order_id: orderId,
                        status: status,
                        total_amount: amount,
                        customer_email: customer !== "Guest" ? customer : null,
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

            // Update orders in JSONBin
            await window.updateBinData("ORDERS", existingOrders);

            // Show import results
            const importResults = document.getElementById("import-results");
            const importMessage = document.getElementById("import-message");

            if (importResults && importMessage) {
                importResults.style.display = "block";
                importMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Success:</strong> Successfully imported ${importedCount} orders.`;
            }

            // Reload queued orders
            await loadQueuedOrders();

            if (typeof window.showNotification === 'function') {
                window.showNotification(`Successfully imported ${importedCount} orders`, "success");
            }
            console.log("Orders imported successfully:", importedCount, "orders");
        } catch (error) {
            console.error("Error importing orders:", error);

            // Show error message
            const importResults = document.getElementById("import-results");
            const importMessage = document.getElementById("import-message");

            if (importResults && importMessage) {
                importResults.style.display = "block";
                importMessage.innerHTML = `<i class="fas fa-times-circle"></i> <strong>Error:</strong> ${error.message}`;
            }

            if (typeof window.showNotification === 'function') {
                window.showNotification(`Error importing orders: ${error.message}`, "error");
            }
        }
    };

    reader.readAsText(file);
}

// Update file name display
function updateFileName(input) {
    const fileName = input.files[0] ? input.files[0].name : "No file chosen";
    const fileNameElement = document.getElementById("file-name");
    if (fileNameElement) {
        fileNameElement.textContent = fileName;
    }
}

// Make functions available globally
window.toggleOrderDetails = toggleOrderDetails;
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.isAdminLoggedIn = isAdminLoggedIn;
window.showAdminDashboard = showAdminDashboard;
window.hideAdminDashboard = hideAdminDashboard;
window.loadSystemStatus = loadSystemStatus;
window.loadQueuedOrders = loadQueuedOrders;
window.loadSystemStatusHistory = loadSystemStatusHistory;
window.setSystemStatus = setSystemStatus;
window.displayProcessingResults = displayProcessingResults;
window.exportOrders = exportOrders;
window.importOrders = importOrders;
window.updateFileName = updateFileName;
