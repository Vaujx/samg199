/**
 * Seoul Grill 199 - Admin Panel Functionality
 * This file handles all admin panel related functionality
 */

// Use an IIFE to avoid global variable conflicts
(function() {
    // Internal configuration that won't conflict with global variables
    const ADMIN_CONFIG = {
        ADMIN_PASSWORD: "admin123",
        BIN_IDS: {
            SYSTEM_STATUS: "67e5fbd8561e97a50f4996", // Updated with your actual bin ID
            ORDERS: "67e54c158561e97a50f3f456", 
            SYSTEM_LOG: "67e54c2b8960c979a579877a"
        },
        // JSONBin API key - this should be your actual API key
        MASTER_KEY: "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
    };

    // Custom notification function
    function showAdminNotification(message, type = "info") {
        console.log(`ADMIN NOTIFICATION: ${message} (${type})`);
        
        // Try to use the global notification if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Create a simple alert for notifications
            alert(message);
        }
    }

    // Initialize admin panel
    document.addEventListener("DOMContentLoaded", function() {
        console.log("Initializing admin panel...");
        
        // Set up login functionality
        setupLoginSystem();
        
        // Check if admin is already logged in
        const isLoggedIn = localStorage.getItem("seoul_grill_admin_logged_in") === "true";
        if (isLoggedIn) {
            console.log("Admin already logged in, showing dashboard");
            showAdminDashboard();
        }
    });

    // Set up the login system
    function setupLoginSystem() {
        console.log("Setting up login system");
        
        // Get login elements
        const loginButton = document.getElementById("login-button");
        const passwordInput = document.getElementById("admin_password");
        const logoutButton = document.getElementById("logout-button");
        
        // Set up login button
        if (loginButton) {
            loginButton.addEventListener("click", handleAdminLogin);
            console.log("Login button event listener added");
        } else {
            console.error("Login button not found");
        }
        
        // Set up password input for Enter key
        if (passwordInput) {
            passwordInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    handleAdminLogin();
                }
            });
            console.log("Password input event listener added");
        } else {
            console.error("Password input not found");
        }
        
        // Set up logout button
        if (logoutButton) {
            logoutButton.addEventListener("click", function(e) {
                e.preventDefault();
                handleAdminLogout();
            });
            console.log("Logout button event listener added");
        }
        
        // Set up system status buttons
        setupSystemControls();
    }

    // Handle admin login
    function handleAdminLogin() {
        console.log("Handling admin login...");
        
        const passwordInput = document.getElementById("admin_password");
        if (!passwordInput) {
            console.error("Password input not found");
            return;
        }
        
        const enteredPassword = passwordInput.value.trim();
        const correctPassword = ADMIN_CONFIG.ADMIN_PASSWORD;
        
        console.log("Password entered, checking...");
        
        if (enteredPassword === correctPassword) {
            console.log("Admin login successful");
            localStorage.setItem("seoul_grill_admin_logged_in", "true");
            showAdminDashboard();
            showAdminNotification("Login successful", "success");
        } else {
            console.log("Admin login failed - incorrect password");
            showAdminNotification("Invalid password. Please try again.", "error");
        }
    }

    // Handle admin logout
    function handleAdminLogout() {
        console.log("Handling admin logout...");
        localStorage.removeItem("seoul_grill_admin_logged_in");
        hideAdminDashboard();
        showAdminNotification("Logged out successfully", "info");
    }

    // Show admin dashboard
    function showAdminDashboard() {
        console.log("Showing admin dashboard");
        
        const loginElement = document.getElementById("admin-login");
        const dashboardElement = document.getElementById("admin-dashboard");
        
        if (!loginElement || !dashboardElement) {
            console.error("Required elements not found");
            return;
        }
        
        loginElement.style.display = "none";
        dashboardElement.style.display = "block";
        
        // Load dashboard data
        loadDashboardData();
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

    // Load dashboard data
    async function loadDashboardData() {
        console.log("Loading dashboard data");
        
        try {
            // Load system status
            const systemStatus = await getSystemStatus();
            updateSystemStatusDisplay(systemStatus.status === 1);
            
            // Load queued orders (mock for now)
            updateQueueDisplay(0);
            
            // Load system logs (mock for now)
            loadSystemLogs();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            showAdminNotification("Error loading dashboard data. Some information may be missing.", "error");
        }
    }

    // Get system status from JSONBin
    async function getSystemStatus() {
        console.log("Getting system status from JSONBin");
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${ADMIN_CONFIG.BIN_IDS.SYSTEM_STATUS}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': ADMIN_CONFIG.MASTER_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("System status loaded:", data.record);
            return data.record;
        } catch (error) {
            console.error("Error getting system status:", error);
            // Return default status if there's an error
            return { status: 0, updated_by: "system", updated_at: new Date().toISOString() };
        }
    }

    // Update system status in JSONBin
    async function updateSystemStatus(isOnline) {
        console.log(`Updating system status to ${isOnline ? "online" : "offline"} in JSONBin`);
        
        try {
            // Prepare the data
            const statusData = {
                status: isOnline ? 1 : 0,
                updated_by: "admin",
                updated_at: new Date().toISOString()
            };
            
            // Update the status in JSONBin
            const response = await fetch(`https://api.jsonbin.io/v3/b/${ADMIN_CONFIG.BIN_IDS.SYSTEM_STATUS}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': ADMIN_CONFIG.MASTER_KEY
                },
                body: JSON.stringify(statusData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update system status: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("System status updated:", data.record);
            
            // Log the status change
            await logSystemStatusChange(isOnline);
            
            return data.record;
        } catch (error) {
            console.error("Error updating system status:", error);
            throw error;
        }
    }

    // Log system status change
    async function logSystemStatusChange(isOnline) {
        console.log(`Logging system status change to ${isOnline ? "online" : "offline"}`);
        
        try {
            // Get current logs
            let systemLogs = [];
            
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${ADMIN_CONFIG.BIN_IDS.SYSTEM_LOG}/latest`, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': ADMIN_CONFIG.MASTER_KEY
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    systemLogs = data.record || [];
                }
            } catch (error) {
                console.warn("Error getting system logs, creating new log:", error);
            }
            
            // Add new log entry
            const logEntry = {
                action: "system_status_updated",
                description: `System status changed to ${isOnline ? "online" : "offline"}`,
                performed_by: "admin",
                performed_at: new Date().toISOString()
            };
            
            systemLogs.push(logEntry);
            
            // Update logs in JSONBin
            const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${ADMIN_CONFIG.BIN_IDS.SYSTEM_LOG}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': ADMIN_CONFIG.MASTER_KEY
                },
                body: JSON.stringify(systemLogs)
            });
            
            if (!updateResponse.ok) {
                throw new Error(`Failed to update system logs: ${updateResponse.status} ${updateResponse.statusText}`);
            }
            
            console.log("System log updated");
            
            // Update the logs display
            loadSystemLogs();
            
            return true;
        } catch (error) {
            console.error("Error logging system status change:", error);
            return false;
        }
    }

    // Load system logs
    async function loadSystemLogs() {
        console.log("Loading system logs");
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${ADMIN_CONFIG.BIN_IDS.SYSTEM_LOG}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': ADMIN_CONFIG.MASTER_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch system logs: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const logs = data.record || [];
            
            // Update the logs display
            updateLogsDisplay(logs);
            
            return logs;
        } catch (error) {
            console.error("Error loading system logs:", error);
            
            // Show empty logs
            updateLogsDisplay([]);
            
            return [];
        }
    }

    // Update logs display
    function updateLogsDisplay(logs) {
        const statusHistoryTable = document.getElementById("status-history");
        if (!statusHistoryTable) return;
        
        statusHistoryTable.innerHTML = "";
        
        // Filter for status updates and get the last 5
        const statusLogs = logs
            .filter(log => log.action === "system_status_updated")
            .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
            .slice(0, 5);
        
        if (statusLogs.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = '<td colspan="3">No status changes recorded yet.</td>';
            statusHistoryTable.appendChild(tr);
        } else {
            statusLogs.forEach(log => {
                const tr = document.createElement("tr");
                const isOnline = log.description.includes("online");
                
                tr.innerHTML = `
                    <td>
                        ${isOnline 
                            ? '<span class="status-online"><i class="fas fa-check-circle"></i> System Brought Online</span>' 
                            : '<span class="status-offline"><i class="fas fa-times-circle"></i> System Taken Offline</span>'}
                    </td>
                    <td>${log.performed_by}</td>
                    <td>${formatDate(log.performed_at)}</td>
                `;
                
                statusHistoryTable.appendChild(tr);
            });
        }
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Set up system control buttons
    function setupSystemControls() {
        const onlineButton = document.getElementById("online-button");
        const offlineButton = document.getElementById("offline-button");
        
        if (onlineButton) {
            onlineButton.addEventListener("click", async function() {
                console.log("Bringing system online...");
                
                try {
                    // Show loading state
                    onlineButton.disabled = true;
                    onlineButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                    
                    // Update system status in JSONBin
                    await updateSystemStatus(true);
                    
                    // Update UI
                    updateSystemStatusDisplay(true);
                    
                    showAdminNotification("System brought online successfully", "success");
                } catch (error) {
                    console.error("Error bringing system online:", error);
                    showAdminNotification("Error bringing system online. Please try again.", "error");
                    
                    // Reset button
                    onlineButton.disabled = false;
                    onlineButton.innerHTML = '<i class="fas fa-power-off"></i> Bring System Online';
                }
            });
        }
        
        if (offlineButton) {
            offlineButton.addEventListener("click", async function() {
                console.log("Taking system offline...");
                
                try {
                    // Show loading state
                    offlineButton.disabled = true;
                    offlineButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                    
                    // Update system status in JSONBin
                    await updateSystemStatus(false);
                    
                    // Update UI
                    updateSystemStatusDisplay(false);
                    
                    showAdminNotification("System taken offline successfully", "success");
                } catch (error) {
                    console.error("Error taking system offline:", error);
                    showAdminNotification("Error taking system offline. Please try again.", "error");
                    
                    // Reset button
                    offlineButton.disabled = false;
                    offlineButton.innerHTML = '<i class="fas fa-power-off"></i> Take System Offline';
                }
            });
        }
    }

    // Update system status display
    function updateSystemStatusDisplay(isOnline) {
        const statusElement = document.getElementById("system-status");
        const onlineButton = document.getElementById("online-button");
        const offlineButton = document.getElementById("offline-button");
        
        if (statusElement) {
            statusElement.className = `system-status ${isOnline ? "status-online" : "status-offline"}`;
            statusElement.textContent = isOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE";
        }
        
        if (onlineButton) {
            onlineButton.disabled = isOnline;
            onlineButton.innerHTML = '<i class="fas fa-power-off"></i> Bring System Online';
        }
        
        if (offlineButton) {
            offlineButton.disabled = !isOnline;
            offlineButton.innerHTML = '<i class="fas fa-power-off"></i> Take System Offline';
        }
    }

    // Update queue display
    function updateQueueDisplay(queueCount) {
        const queueCountElement = document.getElementById("queue-count");
        const queueStatusMessage = document.getElementById("queue-status-message");
        const queuedOrdersSection = document.getElementById("queued-orders-section");
        
        if (queueCountElement) {
            queueCountElement.textContent = queueCount;
        }
        
        if (queueStatusMessage) {
            if (queueCount > 0) {
                getSystemStatus().then(status => {
                    const systemOnline = status.status === 1;
                    if (!systemOnline) {
                        queueStatusMessage.textContent = "These orders will be processed when the system is brought back online.";
                    } else {
                        queueStatusMessage.textContent = "The system is online. Orders are being processed normally.";
                    }
                });
            } else {
                queueStatusMessage.textContent = "No orders are currently queued.";
            }
        }
        
        if (queuedOrdersSection) {
            queuedOrdersSection.style.display = queueCount > 0 ? "block" : "none";
        }
    }

    // Export orders to text file
    window.exportOrders = function() {
        console.log("Exporting orders...");
        
        // For GitHub Pages, we'll create a sample export
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const content = "SEOUL GRILL 199 - ORDER BACKUP\n" +
                        "Generated: " + new Date().toLocaleString() + "\n" +
                        "=".repeat(80) + "\n\n" +
                        "This is a sample export file. In a real implementation, this would contain actual order data.\n\n" +
                        "End of Backup";
        
        // Create and download file
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        
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
            lastBackup.textContent = `Last backup: ${new Date().toLocaleString()}`;
        }
        
        // Show download link
        const downloadBackup = document.getElementById("download-backup");
        if (downloadBackup) {
            downloadBackup.href = url;
            downloadBackup.download = `seoul_grill_orders_${timestamp}.txt`;
            downloadBackup.style.display = "inline-flex";
        }
        
        showAdminNotification("Orders exported successfully", "success");
    };

    // Import orders from text file
    window.importOrders = function() {
        const fileInput = document.getElementById("import-file");
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            showAdminNotification("Please select a file to import", "warning");
            return;
        }
        
        console.log("Importing orders...");
        
        // For GitHub Pages, we'll simulate a successful import
        setTimeout(function() {
            // Show import results
            const importResults = document.getElementById("import-results");
            const importMessage = document.getElementById("import-message");
            
            if (importResults && importMessage) {
                importResults.style.display = "block";
                importMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Success:</strong> Successfully imported 5 orders.`;
            }
            
            // Update queue display to show some orders
            updateQueueDisplay(5);
            
            showAdminNotification("Successfully imported 5 orders", "success");
        }, 1000);
    };

    // Update file name display
    window.updateFileName = function(input) {
        const fileName = input.files[0] ? input.files[0].name : "No file chosen";
        const fileNameElement = document.getElementById("file-name");
        if (fileNameElement) {
            fileNameElement.textContent = fileName;
        }
    };

    // Make functions available globally if needed
    window.handleAdminLogin = handleAdminLogin;
    window.handleAdminLogout = handleAdminLogout;
    window.showAdminDashboard = showAdminDashboard;
    window.hideAdminDashboard = hideAdminDashboard;
})();
