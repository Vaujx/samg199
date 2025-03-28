/**
 * JSONBin.io API Integration
 * This file handles all interactions with the JSONBin.io API
 */

// Use window.showNotification if available, otherwise create a fallback
var showNotification =
  window.showNotification ||
  ((message, type) => {
    console.log(`Notification: ${message} (Type: ${type})`)
  })

// Declare CONFIG and default data variables
const CONFIG = {}
const DEFAULT_PRODUCTS = []
const DEFAULT_ORDERS = []
const DEFAULT_SYSTEM_STATUS = {}
const DEFAULT_SYSTEM_LOG = []

// Initialize JSONBin.io
async function initializeJSONBins() {
  try {
    console.log("Initializing JSONBin.io...")

    // Set the specific bin ID for order tracking - ALWAYS set this first
    if (CONFIG && CONFIG.BINS) {
      CONFIG.BINS.ORDER_TRACKING = "67e60dcc8561e97a50f45273"
      console.log("Set ORDER_TRACKING bin ID:", CONFIG.BINS.ORDER_TRACKING)
    } else {
      console.error("CONFIG or CONFIG.BINS is not defined")
      return false
    }

    // Check if all bin IDs are set in CONFIG
    if (
      CONFIG.BINS.PRODUCTS &&
      CONFIG.BINS.ORDERS &&
      CONFIG.BINS.SYSTEM_STATUS &&
      CONFIG.BINS.SYSTEM_LOG &&
      CONFIG.BINS.ORDER_TRACKING
    ) {
      console.log("Using fixed bin IDs:", CONFIG.BINS)

      // Verify bins exist by trying to access system status
      try {
        await getBinData("SYSTEM_STATUS")
        console.log("Verified bin access is working")
        return true
      } catch (error) {
        console.error("Error accessing bins with fixed IDs:", error)
        return false
      }
    }

    // Check if we have bin IDs in localStorage
    const storedBins = localStorage.getItem("seoul_grill_bins")
    if (storedBins) {
      CONFIG.BINS = JSON.parse(storedBins)
      // Make sure ORDER_TRACKING is always set to the correct value
      CONFIG.BINS.ORDER_TRACKING = "67e60dcc8561e97a50f45273"
      console.log("Loaded bin IDs from localStorage:", CONFIG.BINS)

      // Verify bins still exist by trying to access one
      try {
        await getBinData("SYSTEM_STATUS")
        console.log("Verified bin access is working")
        return true
      } catch (error) {
        console.warn("Stored bins are invalid, recreating them...")
        // Continue to recreate bins
      }
    }

    // Create bins for each data type
    await createBinIfNotExists("PRODUCTS", DEFAULT_PRODUCTS)
    await createBinIfNotExists("ORDERS", DEFAULT_ORDERS)
    await createBinIfNotExists("SYSTEM_STATUS", DEFAULT_SYSTEM_STATUS)
    await createBinIfNotExists("SYSTEM_LOG", DEFAULT_SYSTEM_LOG)
    await createBinIfNotExists("ORDER_TRACKING", [])

    // Save bin IDs to localStorage
    localStorage.setItem("seoul_grill_bins", JSON.stringify(CONFIG.BINS))
    console.log("Created and saved bin IDs:", CONFIG.BINS)

    // Log initialization in system log
    const systemLog = await getBinData("SYSTEM_LOG")
    systemLog.push({
      action: "system_initialized",
      description: "System initialized with default data",
      performed_by: "system",
      performed_at: new Date().toISOString(),
      version: CONFIG.VERSION,
    })
    await updateBinData("SYSTEM_LOG", systemLog)

    return true
  } catch (error) {
    console.error("Error initializing JSONBins:", error)

    // Show error notification if available
    if (typeof showNotification === "function") {
      showNotification("Error initializing database. Some features may not work properly.", "error")
    }

    return false
  }
}

// Create a bin if it doesn't exist
async function createBinIfNotExists(binType, defaultData) {
  if (CONFIG.BINS[binType]) {
    return CONFIG.BINS[binType]
  }

  try {
    console.log(`Creating ${binType} bin...`)
    const response = await fetch(CONFIG.JSONBIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CONFIG.MASTER_KEY,
        "X-Bin-Private": "false",
        "X-Bin-Name": `seoul_grill_${binType.toLowerCase()}_${Date.now()}`,
      },
      body: JSON.stringify(defaultData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create ${binType} bin: ${response.status}`)
    }

    const data = await response.json()
    CONFIG.BINS[binType] = data.metadata.id
    console.log(`Created ${binType} bin with ID: ${CONFIG.BINS[binType]}`)
    return data.metadata.id
  } catch (error) {
    console.error(`Error creating ${binType} bin:`, error)
    throw error
  }
}

// Get data from a bin
async function getBinData(binType) {
  try {
    if (!CONFIG.BINS[binType]) {
      throw new Error(`Bin ID for ${binType} not found`)
    }

    console.log(`Fetching ${binType} data...`)
    const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}/latest`, {
      method: "GET",
      headers: {
        "X-Master-Key": CONFIG.MASTER_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get ${binType} data: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched ${binType} data`)
    return data.record
  } catch (error) {
    console.error(`Error getting ${binType} data:`, error)

    // Return default data if available
    console.log(`Returning default ${binType} data`)
    if (binType === "PRODUCTS") {
      return DEFAULT_PRODUCTS
    } else if (binType === "SYSTEM_STATUS") {
      return DEFAULT_SYSTEM_STATUS
    } else if (binType === "SYSTEM_LOG") {
      return DEFAULT_SYSTEM_LOG
    } else if (binType === "ORDERS") {
      return DEFAULT_ORDERS
    } else if (binType === "ORDER_TRACKING") {
      return []
    }

    return null
  }
}

// Update data in a bin
async function updateBinData(binType, data) {
  try {
    if (!CONFIG.BINS[binType]) {
      throw new Error(`Bin ID for ${binType} not found`)
    }

    console.log(`Updating ${binType} data...`, data)
    const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CONFIG.MASTER_KEY,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update ${binType} data: ${response.status} - ${errorText}`)
    }

    const responseData = await response.json()
    console.log(`Successfully updated ${binType} data`)
    return responseData.record
  } catch (error) {
    console.error(`Error updating ${binType} data:`, error)
    throw error
  }
}

// Get system status
async function getSystemStatus() {
  try {
    const systemStatus = await getBinData("SYSTEM_STATUS")
    return systemStatus.status === 1
  } catch (error) {
    console.error("Error getting system status:", error)
    return true // Default to online if there's an error
  }
}

// Queue an order
async function queueOrder(order) {
  try {
    console.log("Queueing order:", order)

    // Get current orders
    const orders = await getBinData("ORDERS")

    // Add order to queue
    orders.push(order)

    // Update orders in bin
    await updateBinData("ORDERS", orders)

    // Add to order tracking - IMPORTANT: This is a separate operation
    const trackingSuccess = await addOrderToTracking(order)
    if (!trackingSuccess) {
      console.error("Failed to add order to tracking, but order was queued")
    }

    // Log order queued
    const systemLog = await getBinData("SYSTEM_LOG")
    systemLog.push({
      action: "order_queued",
      description: `Order #${order.order_id} queued`,
      performed_by: order.customer_email || "Guest",
      performed_at: new Date().toISOString(),
    })
    await updateBinData("SYSTEM_LOG", systemLog)

    console.log("Order queued successfully")
    return true
  } catch (error) {
    console.error("Error queuing order:", error)
    return false
  }
}

// Add order to tracking
async function addOrderToTracking(order) {
  try {
    console.log("Adding order to tracking:", order)

    // Ensure order has customer_email
    if (!order.customer_email) {
      console.error("Order is missing customer_email, cannot add to tracking")
      return false
    }

    // Get current tracking data
    let trackingData = await getBinData("ORDER_TRACKING")
    console.log("Current tracking data:", trackingData)

    // Ensure trackingData is an array
    if (!Array.isArray(trackingData)) {
      console.warn("ORDER_TRACKING data is not an array, initializing as empty array")
      trackingData = []
    }

    // Add new order to tracking
    trackingData.push(order)

    // Update tracking data in bin
    await updateBinData("ORDER_TRACKING", trackingData)

    console.log("Order added to tracking successfully")
    return true
  } catch (error) {
    console.error("Error adding order to tracking:", error)

    // Try one more time with a fresh empty array if it failed
    try {
      console.log("Retrying with fresh array...")
      await updateBinData("ORDER_TRACKING", [order])
      console.log("Order added to tracking successfully on retry")
      return true
    } catch (retryError) {
      console.error("Error on retry:", retryError)
      return false
    }
  }
}

// Get order tracking by email
async function getOrderTrackingByEmail(email) {
  try {
    console.log(`Getting order tracking for email: ${email}`)

    // Get all tracking data
    const trackingData = await getBinData("ORDER_TRACKING")
    console.log("Retrieved tracking data:", trackingData)

    // Ensure trackingData is an array
    if (!Array.isArray(trackingData)) {
      console.warn("ORDER_TRACKING data is not an array, returning empty array")
      return []
    }

    // Filter by email
    const customerOrders = trackingData.filter((order) => order.customer_email === email)

    console.log(`Found ${customerOrders.length} orders for email: ${email}`)
    return customerOrders
  } catch (error) {
    console.error(`Error getting order tracking for email ${email}:`, error)
    return []
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus, updatedBy = "system") {
  try {
    // Update in ORDERS bin
    const orders = await getBinData("ORDERS")
    const orderIndex = orders.findIndex((order) => order.order_id === orderId)

    if (orderIndex !== -1) {
      const oldStatus = orders[orderIndex].status
      orders[orderIndex].status = newStatus

      if (newStatus === "processed" && oldStatus !== "processed") {
        orders[orderIndex].processed_at = new Date().toISOString()
      }

      await updateBinData("ORDERS", orders)
    }

    // Update in ORDER_TRACKING bin
    let trackingData = await getBinData("ORDER_TRACKING")

    // Ensure trackingData is an array
    if (!Array.isArray(trackingData)) {
      console.warn("ORDER_TRACKING data is not an array, initializing as empty array")
      trackingData = []
    } else {
      const trackingIndex = trackingData.findIndex((order) => order.order_id === orderId)

      if (trackingIndex !== -1) {
        const oldStatus = trackingData[trackingIndex].status
        trackingData[trackingIndex].status = newStatus

        if (newStatus === "processed" && oldStatus !== "processed") {
          trackingData[trackingIndex].processed_at = new Date().toISOString()
        }

        await updateBinData("ORDER_TRACKING", trackingData)
      }
    }

    // Log status change
    const systemLog = await getBinData("SYSTEM_LOG")
    systemLog.push({
      action: "order_status_updated",
      description: `Order #${orderId} status changed to ${newStatus}`,
      performed_by: updatedBy,
      performed_at: new Date().toISOString(),
    })
    await updateBinData("SYSTEM_LOG", systemLog)

    console.log(`Order #${orderId} status updated to ${newStatus}`)
    return true
  } catch (error) {
    console.error(`Error updating order #${orderId} status:`, error)
    return false
  }
}

// Process queued orders
async function processQueuedOrders() {
  try {
    const orders = await getBinData("ORDERS")
    const queuedOrders = orders.filter((order) => order.status === "queued")

    if (queuedOrders.length === 0) {
      return {
        success: 0,
        failed: 0,
        total: 0,
      }
    }

    let successCount = 0
    let failedCount = 0

    // Process each queued order
    for (const order of queuedOrders) {
      try {
        // Update order status
        await updateOrderStatus(order.order_id, "processed", "system")
        successCount++
      } catch (error) {
        console.error(`Error processing order ${order.order_id}:`, error)
        failedCount++
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      total: queuedOrders.length,
    }
  } catch (error) {
    console.error("Error processing queued orders:", error)
    return {
      success: 0,
      failed: 0,
      total: 0,
      error: error.message,
    }
  }
}

// Make functions available globally
window.initializeJSONBins = initializeJSONBins
window.getBinData = getBinData
window.updateBinData = updateBinData
window.getSystemStatus = getSystemStatus
window.queueOrder = queueOrder
window.addOrderToTracking = addOrderToTracking
window.getOrderTrackingByEmail = getOrderTrackingByEmail
window.updateOrderStatus = updateOrderStatus
window.processQueuedOrders = processQueuedOrders

