/**
 * Admin Panel Functionality
 * This file handles all admin panel related functionality
 */

// Check if CONFIG exists, if not create it, otherwise extend it
if (typeof window.CONFIG === 'undefined') {
    window.CONFIG = {
        ADMIN_PASSWORD: "admin123",
        BIN_IDS: {
            SYSTEM_STATUS: "67e54b6d8a456b79667dbebe", // The specific bin ID from your image
            ORDERS: "67e54c158561e97a50f3f456", // Replace with your actual orders bin ID
            SYSTEM_LOG: "67e54c2b8960c979a579877a" // Replace with your actual system log bin ID
        }
    };
} else {
    // Extend existing CONFIG
    window.CONFIG.ADMIN_PASSWORD = "admin123";
    window.CONFIG.BIN_IDS = window.CONFIG.BIN_IDS || {};
    window.CONFIG.BIN_IDS.SYSTEM_STATUS = "67e54b6d8a456b79667dbebe";
    window.CONFIG.BIN_IDS.ORDERS = window.CONFIG.BIN_IDS.ORDERS || "67e54c158561e97a50f3f456";
    window.CONFIG.BIN_IDS.SYSTEM_LOG = window.CONFIG.BIN_IDS.SYSTEM_LOG || "67e54c2b8960c979a579877a";
}

// For local reference, use the global CONFIG
const CONFIG = window.CONFIG;

// Custom notification function in case the global one isn't available
function localShowNotification(message, type) {
    console.log(`NOTIFICATION: ${message} (${type})`);
    // Try to use the global notification if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Create a simple notification if the global one isn't available
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `notification ${type}`;
        notificationDiv.innerHTML = `<p>${message}</p>`;
        document.body.appendChild(notificationDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(notificationDiv);
        }, 3000);
    }
}

// Initialize admin panel
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing admin panel...");
    
    // Direct setup of event listeners for login
    setupLoginEventListeners();
    
    // Check if admin is already logged in
    const isLoggedIn = localStorage.getItem("seoul_grill_admin_logged_in") === "true";
    if (isLoggedIn) {
        console.log("Admin already logged in, showing dashboard");
        showAdminDashboard();
    } else {
        console.log("Admin not logged in, showing login form");
    }
    
    // Initialize JSONBins if available
    if (typeof window.initializeJSONBins === 'function') {
        window.initializeJSONBins()
            .then(() => {
                console.log("JSONBins initialized for admin panel");
                // Setup other admin event listeners
                setupAdminEventListeners();
            })
            .catch((error) => {
                console.error("Error initializing JSONBins for admin panel:", error);
                localShowNotification("There was an error initializing the admin panel. Please try again later.", "error");
            });
    } else {
        console.warn("JSONBins initialization function not found. Some features may not work.");
    }
});

// Set up login event listeners separately to ensure they're always attached
function setupLoginEventListeners() {
    console.log("Setting up login event listeners");

    // Login button
    const loginButton = document.getElementById("login-button");
    if (loginButton) {
        // Remove any existing event listeners
        loginButton.removeEventListener("click", handleAdminLogin);
        // Add new event listener
        loginButton.addEventListener('click', function() {
    const enteredPassword = adminPasswordInput.value.trim().toLowerCase(); // Trim and lowercase
    const correctPassword = ADMIN_PASSWORD.toLowerCase();

    if (enteredPassword === correctPassword) {
        adminLoginSection.style.display = 'none';
        adminDashboardSection.style.display = 'block';
        loadQueue();
        loadHistory();
        updateSystemStatus();
    } else {
        alert('Incorrect password. Please try again.');
    }
});

    // Enter key in password field
    const passwordInput = document.getElementById("admin_password");
    if (passwordInput) {
        // Remove any existing event listeners
        passwordInput.removeEventListener("keypress", handlePasswordKeypress);
        // Add new event listener
        passwordInput.addEventListener("keypress", handlePasswordKeypress);
        console.log("Password input event listener added");
    } else {
        console.error("Password input not found in the DOM");
    }
}

// Handle password keypress
function handlePasswordKeypress(event) {
    if (event.key === "Enter") {
        console.log("Enter key pressed in password field");
        handleAdminLogin();
    }
}

// Set up admin event listeners
function setupAdminEventListeners() {
    console.log("Setting up admin event listeners");

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
                localShowNotification("System brought online successfully", "success");
            } catch (error) {
                console.error("Error bringing system online:", error);
                localShowNotification("Error bringing system online. Please try again.", "error");
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
                localShowNotification("System taken offline successfully", "success");
            } catch (error) {
                console.error("Error taking system offline:", error);
                localShowNotification("Error taking system offline. Please try again.", "error");
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
    
    if (!passwordInput) {
        console.error("Password input not found");
        return;
    }
    
    console.log("Password entered:", passwordInput.value);
    console.log("Expected password:", CONFIG.ADMIN_PASSWORD);
    
    if (passwordInput.value === CONFIG.ADMIN_PASSWORD) {
        console.log("Admin login successful");
        localStorage.setItem("seoul_grill_admin_logged_in", "true");
        showAdminDashboard();
        localShowNotification("Login successful", "success");
    } else {
        console.log("Admin login failed - incorrect password");
        localShowNotification("Invalid password. Please try again.", "error");
    }
}

// Handle admin logout
function handleAdminLogout(e) {
    if (e) e.preventDefault();
    console.log("Handling admin logout...");
    localStorage.removeItem("seoul_grill_admin_logged_in");
    hideAdminDashboard();
    localShowNotification("Logged out successfully", "info");
    console.log("Admin logged out successfully");
}

// Check if admin is logged in
function isAdminLoggedIn() {
    return localStorage.getItem("seoul_grill_admin_logged_in") === "true";
}

// Show admin dashboard
async function showAdminDashboard() {
    console.log("Showing admin dashboard");
    const loginElement = document.getElementById("admin-login");
    const dashboardElement = document.getElementById("admin-dashboard");
    
    if (!loginElement || !dashboardElement) {
        console.error("Required elements not found:", {
            loginElement: !!loginElement,
            dashboardElement: !!dashboardElement
        });
        return;
    }
    
    loginElement.style.display = "none";
    dashboardElement.style.display = "block";

    // Load dashboard data
    try {
        await loadSystemStatus();
        await loadQueuedOrders();
        await loadSystemStatusHistory();
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        localShowNotification("Error loading dashboard data. Some information may be missing.", "warning");
    }
}

// Hide admin dashboard
function hideAdminDashboard() {
    console.log("Hiding admin dashboard");
    const loginElement = document.getElementById("admin-login");
    const dashboardElement = document.getElementById("admin-dashboard");
    
    if (!loginElement || !dashboardElement) {
        console.error("Required elements not found");
        return;
    }
    
    loginElement.style.display = "block";
    dashboardElement.style.display = "none";
}

// Custom function to get bin data with specific bin ID
async function getSpecificBinData(binType) {
    console.log(`Getting data for bin type: ${binType}`);
    
    // Get the bin ID from CONFIG
    const binId = CONFIG.BIN_IDS[binType];
    if (!binId) {
        console.error(`No bin ID configured for ${binType}`);
        throw new Error(`No bin ID configured for ${binType}`);
    }
    
    console.log(`Using bin ID: ${binId} for ${binType}`);
    
    // Check if we have a direct getBinById function
    if (typeof window.getBinById === 'function') {
        return await window.getBinById(binId);
    }
    
    // Otherwise use the standard getBinData function
    if (typeof window.getBinData === 'function') {
        return await window.getBinData(binType);
    }
    
    // If neither function is available, use fetch directly
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Add any required API keys here if needed
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch bin data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.record; // JSONBin API returns data in a 'record' property
}

// Custom function to update bin data with specific bin ID
async function updateSpecificBinData(binType, data) {
    console.log(`Updating data for bin type: ${binType}`, data);
    
    // Get the bin ID from CONFIG
    const binId = CONFIG.BIN_IDS[binType];
    if (!binId) {
        console.error(`No bin ID configured for ${binType}`);
        throw new Error(`No bin ID configured for ${binType}`);
    }
    
    console.log(`Using bin ID: ${binId} for ${binType}`);
    
    // Check if we have a direct updateBinById function
    if (typeof window.updateBinById === 'function') {
        return await window.updateBinById(binId, data);
    }
    
    // Otherwise use the standard updateBinData function
    if (typeof window.updateBinData === 'function') {
        return await window.updateBinData(binType, data);
    }
    
    // If neither function is available, use fetch directly
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            // Add any required API keys here if needed
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`Failed to update bin data: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    return responseData.record; // JSONBin API returns updated data in a 'record' property
}

// Load system status
async function loadSystemStatus() {
    try {
        console.log("Loading system status...");
        let systemStatus;
        
        try {
            // Try to get the system status using our specific bin ID
            systemStatus = await getSpecificBinData("SYSTEM_STATUS");
            console.log("System status loaded:", systemStatus);
        } catch (error) {
            console.warn("Error loading system status from specific bin, falling back to standard method:", error);
            
            // Fall back to the standard method
            if (typeof window.getBinData === 'function') {
                systemStatus = await window.getBinData("SYSTEM_STATUS");
            } else {
                console.warn("getBinData function not available, using mock data");
                systemStatus = { status: 1 }; // Mock data
            }
        }
        
        const systemOnline = systemStatus.status === 1;
        console.log("System online status:", systemOnline, "Raw status value:", systemStatus.status);

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
        let orders;
        
        try {
            // Try to get orders using our specific bin ID
            orders = await getSpecificBinData("ORDERS");
        } catch (error) {
            console.warn("Error loading orders from specific bin, falling back to standard method:", error);
            
            // Fall back to the standard method
            if (typeof window.getBinData === 'function') {
                orders = await window.getBinData("ORDERS");
            } else {
                console.warn("getBinData function not available, using mock data");
                orders = []; // Mock data
            }
        }
        
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
        let systemLog;
        
        try {
            // Try to get system log using our specific bin ID
            systemLog = await getSpecificBinData("SYSTEM_LOG");
        } catch (error) {
            console.warn("Error loading system log from specific bin, falling back to standard method:", error);
            
            // Fall back to the standard method
            if (typeof window.getBinData === 'function') {
                systemLog = await window.getBinData("SYSTEM_LOG");
            } else {
                console.warn("getBinData function not available, using mock data");
                systemLog = []; // Mock data
            }
        }
        
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
        let systemStatus;
        try {
            // Try to get the system status using our specific bin ID
            systemStatus = await getSpecificBinData("SYSTEM_STATUS");
        } catch (error) {
            console.warn("Error loading system status from specific bin, falling back to standard method:", error);
            
            if (typeof window.getBinData === 'function') {
                systemStatus = await window.getBinData("SYSTEM_STATUS");
            } else {
                console.error("Cannot get system status data");
                throw new Error("Cannot get system status data");
            }
        }
        
        // Update status
        systemStatus.status = isOnline ? 1 : 0;
        systemStatus.updated_by = performedBy;
        systemStatus.updated_at = new Date().toISOString();
        
        console.log("Updating system status with:", systemStatus);
        
        // Update system status in JSONBin
        try {
            // Try to update using our specific bin ID
            await updateSpecificBinData("SYSTEM_STATUS", systemStatus);
        } catch (error) {
            console.warn("Error updating system status with specific bin, falling back to standard method:", error);
            
            if (typeof window.updateBinData === 'function') {
                await window.updateBinData("SYSTEM_STATUS", systemStatus);
            } else {
                console.error("Cannot update system status data");
                throw new Error("Cannot update system status data");
            }
        }
        
        // Log status change
        let systemLog;
        try {
            // Try to get the system log using our specific bin ID
            systemLog = await getSpecificBinData("SYSTEM_LOG");
        } catch (error) {
            console.warn("Error loading system log from specific bin, falling back to standard method:", error);
            
            if (typeof window.getBinData === 'function') {
                systemLog = await window.getBinData("SYSTEM_LOG");
            } else {
                console.warn("Cannot get system log data, creating new log");
                systemLog = [];
            }
        }
        
        systemLog.push({
            action: "system_status_updated",
            description: `System status changed to ${isOnline ? "online" : "offline"}`,
            performed_by: performedBy,
            performed_at: new Date().toISOString()
        });
        
        // Update system log in JSONBin
        try {
            // Try to update using our specific bin ID
            await updateSpecificBinData("SYSTEM_LOG", systemLog);
        } catch (error) {
            console.warn("Error updating system log with specific bin, falling back to standard method:", error);
            
            if (typeof window.updateBinData === 'function') {
                await window.updateBinData("SYSTEM_LOG", systemLog);
            } else {
                console.error("Cannot update system log data");
                // Don't throw here, as the main status update was successful
            }
        }
        
        // Process queued orders if bringing system online
        if (isOnline) {
            let queuedOrders;
            try {
                // Try to get orders using our specific bin ID
                queuedOrders = await getSpecificBinData("ORDERS");
            } catch (error) {
                console.warn("Error loading orders from specific bin, falling back to standard method:", error);
                
                if (typeof window.getBinData === 'function') {
                    queuedOrders = await window.getBinData("ORDERS");
                } else {
                    console.warn("Cannot get orders data");
                    queuedOrders = [];
                }
            }
            
            const queuedCount = queuedOrders.filter(order => order.status === "queued").length;
            
            if (queuedCount > 0) {
                console.log(`Processing ${queuedCount} queued orders...`);
                let results;
                if (typeof window.processQueuedOrders === 'function') {
                    results = await window.processQueuedOrders();
                    displayProcessingResults(results);
                } else {
                    console.warn("processQueuedOrders function not available");
                }
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
        let orders;
        
        try {
            // Try to get orders using our specific bin ID
            orders = await getSpecificBinData("ORDERS");
        } catch (error) {
            console.warn("Error loading orders from specific bin, falling back to standard method:", error);
            
            if (typeof window.getBinData === 'function') {
                orders = await window.getBinData("ORDERS");
            } else {
                console.error("Export functionality not available");
                localShowNotification("Export functionality not available", "error");
                return;
            }
        }

        if (orders.length === 0) {
            localShowNotification("No orders to export", "info");
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

        localShowNotification("Orders exported successfully", "success");
        console.log("Orders exported successfully");
    } catch (error) {
        console.error("Error exporting orders:", error);
        localShowNotification("Error exporting orders. Please try again.", "error");
    }
}

// Import orders from text file
async function importOrders() {
    const fileInput = document.getElementById("import-file");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        localShowNotification("Please select a file to import", "warning");
        return;
    }

    console.log("Importing orders...");
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            let existingOrders;
            
            try {
                // Try to get orders using our specific bin ID
                existingOrders = await getSpecificBinData("ORDERS");
            } catch (error) {
                console.warn("Error loading orders from specific bin, falling back to standard method:", error);
                
                if (typeof window.getBinData === 'function') {
                    existingOrders = await window.getBinData("ORDERS");
                } else {
                    console.error("Import functionality not available");
                    throw new Error("Import functionality not available");
                }
            }
            
            const content = e.target.result;
            const lines = content.split("\n");

            let currentOrder = null;
            let importedCount = 0;
            let orderItems = {};

            // Get existing order IDs
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
            try {
                // Try to update using our specific bin ID
                await updateSpecificBinData("ORDERS", existingOrders);
            } catch (error) {
                console.warn("Error updating orders with specific bin, falling back to standard method:", error);
                
                if (typeof window.updateBinData === 'function') {
                    await window.updateBinData("ORDERS", existingOrders);
                } else {
                    console.error("Cannot update orders data");
                    throw new Error("Cannot update orders data");
                }
            }

            // Show import results
            const importResults = document.getElementById("import-results");
            const importMessage = document.getElementById("import-message");

            if (importResults && importMessage) {
                importResults.style.display = "block";
                importMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Success:</strong> Successfully imported ${importedCount} orders.`;
            }

            // Reload queued orders
            await loadQueuedOrders();

            localShowNotification(`Successfully imported ${importedCount} orders`, "success");
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

            localShowNotification(`Error importing orders: ${error.message}`, "error");
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

// Add CSS for local notifications if needed
function addNotificationStyles() {
    if (document.getElementById('local-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'local-notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
        }
        .notification.success { background-color: #4CAF50; }
        .notification.error { background-color: #F44336; }
        .notification.info { background-color: #2196F3; }
        .notification.warning { background-color: #FF9800; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    `;
    document.head.appendChild(style);
}

// Initialize notification styles
addNotificationStyles();

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
window.handlePasswordKeypress = handlePasswordKeypress;
window.getSpecificBinData = getSpecificBinData;
window.updateSpecificBinData = updateSpecificBinData;
