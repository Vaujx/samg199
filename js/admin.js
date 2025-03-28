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
            SYSTEM_STATUS: "67e54b6d8a456b79667dbebe",
            ORDERS: "67e54c158561e97a50f3f456",
            SYSTEM_LOG: "67e54c2b8960c979a579877a"
        }
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
    function loadDashboardData() {
        console.log("Loading dashboard data");
        
        // For GitHub Pages, we'll use mock data since we can't use server-side code
        updateSystemStatusDisplay(false); // Default to offline
        updateQueueDisplay(0); // Default to 0 queued orders
        
        // If you have a way to fetch data from an external API that works with GitHub Pages,
        // you can implement it here
    }

    // Set up system control buttons
    function setupSystemControls() {
        const onlineButton = document.getElementById("online-button");
        const offlineButton = document.getElementById("offline-button");
        
        if (onlineButton) {
            onlineButton.addEventListener("click", function() {
                console.log("Bringing system online...");
                updateSystemStatusDisplay(true);
                showAdminNotification("System brought online successfully", "success");
            });
        }
        
        if (offlineButton) {
            offlineButton.addEventListener("click", function() {
                console.log("Taking system offline...");
                updateSystemStatusDisplay(false);
                showAdminNotification("System taken offline successfully", "success");
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
        }
        
        if (offlineButton) {
            offlineButton.disabled = !isOnline;
        }
        
        // Update local storage to remember system status
        localStorage.setItem("seoul_grill_system_status", isOnline ? "online" : "offline");
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
                const systemOnline = localStorage.getItem("seoul_grill_system_status") === "online";
                if (!systemOnline) {
                    queueStatusMessage.textContent = "These orders will be processed when the system is brought back online.";
                } else {
                    queueStatusMessage.textContent = "The system is online. Orders are being processed normally.";
                }
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
