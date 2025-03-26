/**
 * Admin Panel Functionality
 * This file handles the admin panel functionality
 */

// Dummy declarations for functions and variables that are assumed to be defined elsewhere
// These should be replaced with actual imports or definitions in a real application
const initializeJSONBins = async () => {
  console.warn("initializeJSONBins is a placeholder")
}
const setSystemStatus = async (status, user) => {
  console.warn("setSystemStatus is a placeholder")
}
const getBinData = async (binName) => {
  console.warn("getBinData is a placeholder")
  return []
}
const updateBinData = async (binName, data) => {
  console.warn("updateBinData is a placeholder")
}
const CONFIG = { ADMIN_PASSWORD: "password" } // Replace with actual config

// Initialize admin panel
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing admin panel...")

  // Initialize JSONBins
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
  } else {
    console.log("Admin login failed - incorrect password")
    alert("Invalid password. Please try again.")
  }
}

// Handle admin logout
function handleAdminLogout(e) {
  e.preventDefault()
  console.log("Handling admin logout...")
  localStorage.removeItem("seoul_grill_admin_logged_in")
  hideAdminDashboard()
  console.log("Admin logged out successfully")
}

// Show admin dashboard
function showAdminDashboard() {
  console.log("Showing admin dashboard")
  document.getElementById("admin-login").style.display = "none"
  document.getElementById("admin-dashboard").style.display = "block"

  // Load dashboard data
  loadSystemStatus()
  loadQueuedOrders()
  loadSystemStatusHistory()
}

// Hide admin dashboard
function hideAdminDashboard() {
  console.log("Hiding admin dashboard")
  document.getElementById("admin-login").style.display = "block"
  document.getElementById("admin-dashboard").style.display = "none"
}

// Load system status
async function loadSystemStatus() {
  try {
    console.log("Loading system status...")
    const systemStatus = await getBinData("SYSTEM_STATUS")
    const systemOnline = systemStatus.status === 1

    // Update system status indicator
    const statusElement = document.getElementById("system-status")
    if (statusElement) {
      statusElement.className = `system-status ${systemOnline ? "status-online" : "status-offline"}`
      statusElement.textContent = systemOnline ? "System Online" : "System Offline"
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
    const orders = await getBinData("ORDERS")
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
                    <td>${order.customer_name || "Guest"}</td>
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
    const systemLog = await getBinData("SYSTEM_LOG")
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
    const orders = await getBinData("ORDERS")

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
      const existingOrders = await getBinData("ORDERS")
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
      await updateBinData("ORDERS", existingOrders)

      // Show import results
      const importResults = document.getElementById("import-results")
      const importMessage = document.getElementById("import-message")

      if (importResults && importMessage) {
        importResults.style.display = "block"
        importMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Success:</strong> Successfully imported ${importedCount} orders.`
      }

      // Reload queued orders
      loadQueuedOrders()

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
  document.getElementById("file-name").textContent = fileName
}

// Make toggleOrderDetails globally available
window.toggleOrderDetails = toggleOrderDetails

