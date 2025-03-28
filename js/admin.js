/**
 * Admin Panel Functionality
 * This file handles the admin panel functionality
 */

// Check if CONFIG exists, if not create it
if (typeof window.CONFIG === 'undefined') {
    window.CONFIG = {
        ADMIN_PASSWORD: "admin123",
        BIN_IDS: {
            SYSTEM_STATUS: "67e54b6d8a456b79667dbebe",
            ORDERS: "67e54c158561e97a50f3f456",
            SYSTEM_LOG: "67e54c2b8960c979a579877a"
        }
    };
}

// Initialize admin panel
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing admin panel...")

    // Initialize JSONBins
    if (typeof initializeJSONBins === 'function') {
        initializeJSONBins()
            .then(() => {
                console.log("JSONBins initialized for admin panel")

                // Add event listeners
                setupAdminEventListeners()

                // Check if admin is already logged in
                const isLoggedIn = localStorage.getItem("seoul_grill_admin_logged_in") === "true"
                if (isLoggedIn) {
                    console.log("Admin already logged in, showing dashboard")
                    showAdminDashboard()
                } else {
                    console.log("Admin not logged in, showing login form")
                }
            })
            .catch((error) => {
                console.error("Error initializing JSONBins for admin panel:", error)
                alert("There was an error initializing the admin panel. Please try refreshing the page.")
            })
    } else {
        console.warn("initializeJSONBins function not found, setting up event listeners directly")
        setupAdminEventListeners()
        
        // Check if admin is already logged in
        const isLoggedIn = localStorage.getItem("seoul_grill_admin_logged_in") === "true"
        if (isLoggedIn) {
            console.log("Admin already logged in, showing dashboard")
            showAdminDashboard()
        }
    }
})

// Set up admin event listeners
function setupAdminEventListeners() {
    console.log("Setting up admin event listeners")

    // Login button
    const loginButton = document.getElementById("login-button")
    if (loginButton) {
        loginButton.addEventListener("click", handleAdminLogin)
        console.log("Login button event listener added")
    }

    // Enter key in password field
    const passwordInput = document.getElementById("admin_password")
    if (passwordInput) {
        passwordInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                handleAdminLogin()
            }
        })
        console.log("Password input event listener added")
    }

    // Logout button
    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
        logoutButton.addEventListener("click", handleAdminLogout)
        console.log("Logout button event listener added")
    }

    // System status buttons
    const onlineButton = document.getElementById("online-button")
    const offlineButton = document.getElementById("offline-button")

    if (onlineButton) {
        onlineButton.addEventListener("click", () => {
            console.log("Bringing system online...")
            setSystemStatus(true, "admin")
                .then(() => {
                    console.log("System brought online successfully")
                    loadSystemStatus()
                    loadQueuedOrders()
                    loadSystemStatusHistory()
                    showNotification("System brought online successfully", "success")
                })
                .catch((error) => {
                    console.error("Error bringing system online:", error)
                    alert("Error bringing system online. Please try again.")
                })
        })
        console.log("Online button event listener added")
    }

    if (offlineButton) {
        offlineButton.addEventListener("click", () => {
            console.log("Taking system offline...")
            setSystemStatus(false, "admin")
                .then(() => {
                    console.log("System taken offline successfully")
                    loadSystemStatus()
                    loadQueuedOrders()
                    loadSystemStatusHistory()
                    showNotification("System taken offline successfully", "success")
                })
                .catch((error) => {
                    console.error("Error taking system offline:", error)
                    alert("Error taking system offline. Please try again.")
                })
        })
        console.log("Offline button event listener added")
    }

    // Export button
    const exportButton = document.getElementById("export-button")
    if (exportButton) {
        exportButton.addEventListener("click", exportOrders)
        console.log("Export button event listener added")
    }

    // Import button
    const importButton = document.getElementById("import-button")
    if (importButton) {
        importButton.addEventListener("click", importOrders)
        console.log("Import button event listener added")
    }
}

// Handle admin login
function handleAdminLogin() {
    console.log("Handling admin login...")
    const passwordInput = document.getElementById("admin_password")
    if (passwordInput && passwordInput.value === CONFIG.ADMIN_PASSWORD) {
        console.log("Admin login successful")
        localStorage.setItem("seoul_grill_admin_logged_in", "true")
        showAdminDashboard()
        if (typeof showNotification === 'function') {
            showNotification("Login successful", "success")
        }
    } else {
        console.log("Admin login failed - incorrect password")
        alert("Invalid password. Please try again.")
    }
}

// Handle admin logout
function handleAdminLogout(e) {
    if (e) e.preventDefault()
    console.log("Handling admin logout...")
    localStorage.removeItem("seoul_grill_admin_logged_in")
    hideAdminDashboard()
    if (typeof showNotification === 'function') {
        showNotification("Logged out successfully", "info")
    }
    console.log("Admin logged out successfully")
}

// Show admin dashboard
function showAdminDashboard() {
    console.log("Showing admin dashboard")
    const loginElement = document.getElementById("admin-login")
    const dashboardElement = document.getElementById("admin-dashboard")
    
    if (loginElement && dashboardElement) {
        loginElement.style.display = "none"
        dashboardElement.style.display = "block"

        // Load dashboard data
        loadSystemStatus()
        loadQueuedOrders()
        loadSystemStatusHistory()
    } else {
        console.error("Required elements not found")
    }
}

// Hide admin dashboard
function hideAdminDashboard() {
    console.log("Hiding admin dashboard")
    const loginElement = document.getElementById("admin-login")
    const dashboardElement = document.getElementById("admin-dashboard")
    
    if (loginElement && dashboardElement) {
        loginElement.style.display = "block"
        dashboardElement.style.display = "none"
    } else {
        console.error("Required elements not found")
    }
}

// Set system status
async function setSystemStatus(isOnline, performedBy = "system") {
    try {
        console.log(`Setting system status to ${isOnline ? "online" : "offline"}...`)
        
        // Get current system status
        let systemStatus
        if (typeof getBinData === 'function') {
            systemStatus = await getBinData("SYSTEM_STATUS")
        } else {
            // Direct API call if getBinData is not available
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_IDS.SYSTEM_STATUS}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
                }
            })
            
            if (!response.ok) {
                throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            systemStatus = data.record
        }
        
        // Update status
        systemStatus.status = isOnline ? 1 : 0
        systemStatus.updated_by = performedBy
        systemStatus.updated_at = new Date().toISOString()
        
        // Update system status in JSONBin
        if (typeof updateBinData === 'function') {
            await updateBinData("SYSTEM_STATUS", systemStatus)
        } else {
            // Direct API call if updateBinData is not available
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_IDS.SYSTEM_STATUS}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
                },
                body: JSON.stringify(systemStatus)
            })
            
            if (!response.ok) {
                throw new Error(`Failed to update system status: ${response.status} ${response.statusText}`)
            }
        }
        
        // Log status change
        let systemLog
        if (typeof getBinData === 'function') {
            systemLog = await getBinData("SYSTEM_LOG")
        } else {
            // Direct API call if getBinData is not available
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_IDS.SYSTEM_LOG}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
                }
            })
            
            if (response.ok) {
                const data = await response.json()
                systemLog = data.record
            } else {
                console.warn("Could not fetch system log, creating new log")
                systemLog = []
            }
        }
        
        // Add log entry
        systemLog.push({
            action: isOnline ? "system_online" : "system_offline",
            description: `System status changed to ${isOnline ? "online" : "offline"}`,
            performed_by: performedBy,
            performed_at: new Date().toISOString()
        })
        
        // Update system log in JSONBin
        if (typeof updateBinData === 'function') {
            await updateBinData("SYSTEM_LOG", systemLog)
        } else {
            // Direct API call if updateBinData is not available
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_IDS.SYSTEM_LOG}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
                },
                body: JSON.stringify(systemLog)
            })
            
            if (!response.ok) {
                console.warn("Failed to update system log")
            }
        }
        
        // Process queued orders if bringing system online
        if (isOnline && typeof processQueuedOrders === 'function') {
            const queuedOrders = await loadQueuedOrders()
            if (queuedOrders.length > 0) {
                console.log(`Processing ${queuedOrders.length} queued orders...`)
                const results = await processQueuedOrders()
                displayProcessingResults(results)
            }
        }
        
        console.log(`System status set to ${isOnline ? "online" : "offline"} successfully`)
        return true
    } catch (error) {
        console.error(`Error setting system status to ${isOnline ? "online" : "offline"}:`, error)
        throw error
    }
}

// Load system status
async function loadSystemStatus() {
    try {
        console.log("Loading system status...")
        let systemStatus
        
        if (typeof getBinData === 'function') {
            systemStatus = await getBinData("SYSTEM_STATUS")
        } else {
            // Direct API call if getBinData is not available
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_IDS.SYSTEM_STATUS}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
                }
            })
            
            if (!response.ok) {
                throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            systemStatus = data.record
        }
        
        const systemOnline = systemStatus.status === 1

        // Update system status indicator
        const statusElement = document.getElementById("system-status")
        if (statusElement) {
            statusElement.className = `system-status ${systemOnline ? "status-online" : "status-offline"}`
            statusElement.textContent = systemOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"
        }

        // Update buttons
        const onlineButton = document.getElementById("online-button")
        const offlineButton = document.getElementById("offline-button")

        if (onlineButton) {
            onlineButton.disabled = systemOnline
        }

        if (offlineButton) {
            offlineButton.disabled = !systemOnline
        }

        console.log("System status loaded successfully:", systemOnline ? "Online" : "Offline")
        return systemOnline
    } catch (error) {
        console.error("Error loading system status:", error)
        return true // Default to online if there's an error
    }
}

// Load queued orders
async function loadQueuedOrders() {
    try {
        console.log("Loading queued orders...")
        let orders
        
        if (typeof getBinData === 'function') {
            orders = await getBinData("ORDERS")
        } else {
            // Mock data if getBinData is not available
            orders = []
        }
        
        const queuedOrders = orders.filter((order) => order.status === "queued")

        // Update queue count
        const queueCount = document.getElementById("queue-count")
        if (queueCount) {
            queueCount.textContent = queuedOrders.length
        }

        // Update queue status message
        const queueStatusMessage = document.getElementById("queue-status-message")
        if (queueStatusMessage) {
            if (queuedOrders.length > 0) {
                const systemOnline = await loadSystemStatus()
                if (!systemOnline) {
                    queueStatusMessage.textContent = "These orders will be processed when the system is brought back online."
                } else {
                    queueStatusMessage.textContent = "The system is online. Orders are being processed normally."
                }
            } else {
                queueStatusMessage.textContent = "No orders are currently queued."
            }
        }

        // Show/hide queued orders section
        const queuedOrdersSection = document.getElementById("queued-orders-section")
        if (queuedOrdersSection) {
            queuedOrdersSection.style.display = queuedOrders.length > 0 ? "block" : "none"
        }

        // Update queued orders list
        const queuedOrdersList = document.getElementById("queued-orders-list")
        if (queuedOrdersList && queuedOrders.length > 0) {
            queuedOrdersList.innerHTML = ""

            queuedOrders.forEach((order) => {
                const tr = document.createElement("tr")
                tr.innerHTML = `
                    <td>#${order.order_id}</td>
                    <td>${order.customer_email || order.customer_name || "Guest"}</td>
                    <td>₱${order.total_amount.toFixed(2)}</td>
                    <td>${new Date(order.queued_at).toLocaleString()}</td>
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
                `

                queuedOrdersList.appendChild(tr)
            })
        }

        console.log("Queued orders loaded successfully:", queuedOrders.length, "orders")
        return queuedOrders
    } catch (error) {
        console.error("Error loading queued orders:", error)
        return []
    }
}

// Toggle order details visibility
function toggleOrderDetails(orderId) {
    const detailsElement = document.getElementById(`order-details-${orderId}`)
    if (detailsElement) {
        detailsElement.style.display = detailsElement.style.display === "none" ? "block" : "none"
    }
}

// Load system status history
async function loadSystemStatusHistory() {
    try {
        console.log("Loading system status history...")
        let systemLog
        
        if (typeof getBinData === 'function') {
            systemLog = await getBinData("SYSTEM_LOG")
        } else {
            // Direct API call if getBinData is not available
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.BIN_IDS.SYSTEM_LOG}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
                }
            })
            
            if (!response.ok) {
                throw new Error(`Failed to fetch system log: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            systemLog = data.record
        }
        
        const statusHistory = systemLog
            .filter((entry) => entry.action === "system_online" || entry.action === "system_offline")
            .slice(-5) // Get last 5 entries

        // Update status history table
        const statusHistoryTable = document.getElementById("status-history")
        if (statusHistoryTable) {
            statusHistoryTable.innerHTML = ""

            if (statusHistory.length === 0) {
                const tr = document.createElement("tr")
                tr.innerHTML = '<td colspan="3">No status changes recorded yet.</td>'
                statusHistoryTable.appendChild(tr)
            } else {
                statusHistory.forEach((entry) => {
                    const tr = document.createElement("tr")
                    tr.innerHTML = `
                        <td>
                            ${
                                entry.action === "system_online"
                                    ? '<span class="status-online"><i class="fas fa-check-circle"></i> System Brought Online</span>'
                                    : '<span class="status-offline"><i class="fas fa-times-circle"></i> System Taken Offline</span>'
                            }
                        </td>
                        <td>${entry.performed_by}</td>
                        <td>${new Date(entry.performed_at).toLocaleString()}</td>
                    `

                    statusHistoryTable.appendChild(tr)
                })
            }
        }

        console.log("System status history loaded successfully:", statusHistory.length, "entries")
        return statusHistory
    } catch (error) {
        console.error("Error loading system status history:", error)
        return []
    }
}

// Display processing results
function displayProcessingResults(results) {
    const processingResults = document.getElementById("processing-results")
    if (!processingResults) return

    // Show processing results section
    processingResults.style.display = "block"

    // Update result counts
    document.getElementById("total-processed").textContent = results.total
    document.getElementById("success-processed").textContent = results.success
    document.getElementById("failed-processed").textContent = results.failed

    // Show/hide failed message
    const failedMessage = document.getElementById("failed-message")
    if (failedMessage) {
        failedMessage.style.display = results.failed > 0 ? "block" : "none"
    }
}

// Helper function to pad strings
function padString(str, length) {
    str = String(str)
    return str.length >= length ? str : str + " ".repeat(length - str.length)
}

// Export orders to text file
async function exportOrders() {
    try {
        console.log("Exporting orders...")
        let orders
        
        if (typeof getBinData === 'function') {
            orders = await getBinData("ORDERS")
        } else {
            // Mock data if getBinData is not available
            orders = []
        }

        if (orders.length === 0) {
            alert("No orders to export")
            return
        }

        // Generate text content
        let content = "SEOUL GRILL 199 - ORDER BACKUP\n"
        content += "Generated: " + new Date().toLocaleString() + "\n"
        content += "=".repeat(80) + "\n\n"

        content += "ORDER ID     STATUS          AMOUNT          CUSTOMER                  DATE\n"
        content += "-".repeat(80) + "\n"

        orders.forEach((order) => {
            content += `#${padString(order.order_id, 10)} ${padString(order.status, 15)} ₱${padString(order.total_amount.toFixed(2), 15)} ${padString(order.customer_name || "Guest", 25)} ${new Date(order.queued_at).toLocaleString()}\n`

            // Write order items
            content += "  Items:\n"
            for (const [product, quantity] of Object.entries(order.items)) {
                content += `    - ${product} x ${quantity}\n`
            }

            // Add processed date if available
            if (order.processed_at) {
                content += `  Processed: ${new Date(order.processed_at).toLocaleString()}\n`
            }

            content += "-".repeat(80) + "\n"
        })

        content += "\nTotal Orders: " + orders.length + "\n"
        content += "End of Backup\n"

        // Create and download file
        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

        const a = document.createElement("a")
        a.href = url
        a.download = `seoul_grill_orders_${timestamp}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // Update last backup info
        const lastBackup = document.getElementById("last-backup")
        if (lastBackup) {
            lastBackup.textContent = `Last backup: ${new Date().toLocaleString()}`
        }

        // Show download link
        const downloadBackup = document.getElementById("download-backup")
        if (downloadBackup) {
            downloadBackup.href = url
            downloadBackup.style.display = "inline-flex"
        }

        if (typeof showNotification === 'function') {
            showNotification("Orders exported successfully", "success")
        }
        console.log("Orders exported successfully")
    } catch (error) {
        console.error("Error exporting orders:", error)
        alert("Error exporting orders. Please try again.")
    }
}

// Import orders from text file
async function importOrders() {
    const fileInput = document.getElementById("import-file")
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please select a file to import.")
        return
    }

    console.log("Importing orders...")
    const file = fileInput.files[0]
    const reader = new FileReader()

    reader.onload = async (e) => {
        try {
            const content = e.target.result
            const lines = content.split("\n")

            let currentOrder = null
            let importedCount = 0
            let orderItems = {}

            // Get current orders
            let existingOrders
            if (typeof getBinData === 'function') {
                existingOrders = await getBinData("ORDERS")
            } else {
                // Mock data if getBinData is not available
                existingOrders = []
            }
            
            const existingOrderIds = new Set(existingOrders.map((order) => order.order_id))

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
                    continue
                }

                // Check if this is an order line (starts with #)
                const orderMatch = line.match(/^#(\d+)\s+(\w+)\s+₱([\d,.]+)\s+(.+?)\s+(.+)$/)
                if (orderMatch) {
                    // If we have a previous order, save it first
                    if (currentOrder) {
                        // Only add if order ID doesn't already exist
                        if (!existingOrderIds.has(currentOrder.order_id)) {
                            currentOrder.items = orderItems
                            existingOrders.push(currentOrder)
                            existingOrderIds.add(currentOrder.order_id)
                            importedCount++
                        }
                        orderItems = {}
                    }

                    // Parse the new order
                    const orderId = orderMatch[1]
                    const status = orderMatch[2]
                    const amount = Number.parseFloat(orderMatch[3].replace(",", ""))
                    const customer = orderMatch[4].trim()
                    const date = orderMatch[5].trim()

                    currentOrder = {
                        order_id: orderId,
                        status: status,
                        total_amount: amount,
                        customer_name: customer !== "Guest" ? customer : null,
                        queued_at: new Date(date).toISOString(),
                        processed_at: null,
                    }
                }
                // Check if this is an item line
                else if (currentOrder && line.match(/^\s+- (.+) x (\d+)$/)) {
                    const itemMatch = line.match(/^\s+- (.+) x (\d+)$/)
                    const product = itemMatch[1]
                    const quantity = Number.parseInt(itemMatch[2], 10)
                    orderItems[product] = quantity
                }
                // Check if this is a processed date line
                else if (currentOrder && line.match(/^\s+Processed: (.+)$/)) {
                    const processedMatch = line.match(/^\s+Processed: (.+)$/)
                    currentOrder.processed_at = new Date(processedMatch[1]).toISOString()
                }
            }

            // Save the last order if exists
            if (currentOrder && !existingOrderIds.has(currentOrder.order_id)) {
                currentOrder.items = orderItems
                existingOrders.push(currentOrder)
                importedCount++
            }

            // Update orders in JSONBin
            if (typeof updateBinData === 'function') {
                await updateBinData("ORDERS", existingOrders)
            } else {
                console.warn("updateBinData function not available, orders not saved")
            }

            // Show import results
            const importResults = document.getElementById("import-results")
            const importMessage = document.getElementById("import-message")

            if (importResults && importMessage) {
                importResults.style.display = "block"
                importMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Success:</strong> Successfully imported ${importedCount} orders.`
            }

            // Reload queued orders
            loadQueuedOrders()

            if (typeof showNotification === 'function') {
                showNotification(`Successfully imported ${importedCount} orders`, "success")
            }
            console.log("Orders imported successfully:", importedCount, "orders")
        } catch (error) {
            console.error("Error importing orders:", error)

            // Show error message
            const importResults = document.getElementById("import-results")
            const importMessage = document.getElementById("import-message")

            if (importResults && importMessage) {
                importResults.style.display = "block"
                importMessage.innerHTML = `<i class="fas fa-times-circle"></i> <strong>Error:</strong> ${error.message}`
            }
        }
    }

    reader.readAsText(file)
}

// Update file name display
function updateFileName(input) {
    const fileName = input.files[0] ? input.files[0].name : "No file chosen"
    const fileNameElement = document.getElementById("file-name")
    if (fileNameElement) {
        fileNameElement.textContent = fileName
    }
}

// Custom notification function if global one isn't available
function showNotification(message, type = "info") {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type)
    } else {
        console.log(`NOTIFICATION: ${message} (${type})`)
        // Only show alert for errors
        if (type === "error") {
            alert(message)
        }
    }
}

// Make functions globally available
window.toggleOrderDetails = toggleOrderDetails
window.handleAdminLogin = handleAdminLogin
window.handleAdminLogout = handleAdminLogout
window.showAdminDashboard = showAdminDashboard
window.hideAdminDashboard = hideAdminDashboard
window.updateFileName = updateFileName
window.setSystemStatus = setSystemStatus

// If we need to directly access JSONBin without the helper functions
window.directGetBinData = async function(binType) {
    try {
        const binId = CONFIG.BIN_IDS[binType]
        if (!binId) {
            throw new Error(`No bin ID configured for ${binType}`)
        }
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
            }
        })
        
        if (!response.ok) {
            throw new Error(`Failed to fetch bin data: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        return data.record
    } catch (error) {
        console.error(`Error getting bin data for ${binType}:`, error)
        throw error
    }
}

window.directUpdateBinData = async function(binType, data) {
    try {
        const binId = CONFIG.BIN_IDS[binType]
        if (!binId) {
            throw new Error(`No bin ID configured for ${binType}`)
        }
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.MASTER_KEY || "$2a$10$Ht/Qs9XzKYW5H1eCy.xdcuDIHleLdQxJFIjS6UMNUKEbDULGpjFAe"
            },
            body: JSON.stringify(data)
        })
        
        if (!response.ok) {
            throw new Error(`Failed to update bin data: ${response.status} ${response.statusText}`)
        }
        
        const responseData = await response.json()
        return responseData.record
    } catch (error) {
        console.error(`Error updating bin data for ${binType}:`, error)
        throw error
    }
}

// Fallback functions if the global ones aren't available
if (typeof getBinData !== 'function') {
    window.getBinData = window.directGetBinData
}

if (typeof updateBinData !== 'function') {
    window.updateBinData = window.directUpdateBinData
}

// Initialize JSONBins if the global function isn't available
if (typeof initializeJSONBins !== 'function') {
    window.initializeJSONBins = async function() {
        console.log("Using fallback initializeJSONBins function")
        // Just return true since we're using direct API calls
        return true
    }
}

// Process queued orders if the global function isn't available
if (typeof processQueuedOrders !== 'function') {
    window.processQueuedOrders = async function() {
        console.log("Using fallback processQueuedOrders function")
        // Return mock results
        return {
            total: 0,
            success: 0,
            failed: 0
        }
    }
}
