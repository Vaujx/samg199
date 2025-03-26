/**
 * JSONBin.io API Integration
 * This file handles all interactions with the JSONBin.io API
 */

// Define CONFIG and default data
const CONFIG = {
  JSONBIN_URL: "https://api.jsonbin.io/v3/b",
  MASTER_KEY: "$2b$10$ZfKJO7VE/w9vGqKdyE8Lu.yZIY93Kz5/i3j4Vz9/45s.m2x.0P.Wq", // Replace with your actual master key
  BINS: {},
}

const DEFAULT_PRODUCTS = []
const DEFAULT_ORDERS = []
const DEFAULT_SYSTEM_STATUS = { status: 1, updated_by: "system", updated_at: new Date().toISOString() }
const DEFAULT_SYSTEM_LOG = []

// Initialize JSONBin.io
async function initializeJSONBins() {
  try {
    console.log("Initializing JSONBin.io...")

    // Check if we have bin IDs in localStorage
    const storedBins = localStorage.getItem("seoul_grill_bins")
    if (storedBins) {
      CONFIG.BINS = JSON.parse(storedBins)
      console.log("Loaded bin IDs from localStorage:", CONFIG.BINS)
      return true
    }

    // Create bins for each data type
    await createBinIfNotExists("PRODUCTS", DEFAULT_PRODUCTS)
    await createBinIfNotExists("ORDERS", DEFAULT_ORDERS)
    await createBinIfNotExists("SYSTEM_STATUS", DEFAULT_SYSTEM_STATUS)
    await createBinIfNotExists("SYSTEM_LOG", DEFAULT_SYSTEM_LOG)

    // Save bin IDs to localStorage
    localStorage.setItem("seoul_grill_bins", JSON.stringify(CONFIG.BINS))
    console.log("Created and saved bin IDs:", CONFIG.BINS)

    return true
  } catch (error) {
    console.error("Error initializing JSONBins:", error)
    return false
  }
}

// Create a bin if it doesn't exist
async function createBinIfNotExists(binType, defaultData) {
  if (CONFIG.BINS[binType]) {
    return CONFIG.BINS[binType]
  }

  try {
    const response = await fetch(CONFIG.JSONBIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CONFIG.MASTER_KEY,
        "X-Bin-Private": "false",
      },
      body: JSON.stringify(defaultData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create ${binType} bin: ${response.status}`)
    }

    const data = await response.json()
    CONFIG.BINS[binType] = data.metadata.id
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
    return data.record
  } catch (error) {
    console.error(`Error getting ${binType} data:`, error)

    // Return default data if available
    if (binType === "PRODUCTS") {
      return DEFAULT_PRODUCTS
    } else if (binType === "SYSTEM_STATUS") {
      return DEFAULT_SYSTEM_STATUS
    } else if (binType === "SYSTEM_LOG") {
      return DEFAULT_SYSTEM_LOG
    } else if (binType === "ORDERS") {
      return DEFAULT_ORDERS
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

    const response = await fetch(`${CONFIG.JSONBIN_URL}/${CONFIG.BINS[binType]}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CONFIG.MASTER_KEY,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update ${binType} data: ${response.status}`)
    }

    const responseData = await response.json()
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

// Set system status
async function setSystemStatus(isOnline, updatedBy = "system") {
  try {
    // Get current system status
    const systemStatus = await getBinData("SYSTEM_STATUS")
    const wasOnline = systemStatus.status === 1
    const goingOnline = isOnline

    // Update system status
    systemStatus.status = isOnline ? 1 : 0
    systemStatus.updated_by = updatedBy
    systemStatus.updated_at = new Date().toISOString()

    // Update system status in bin
    await updateBinData("SYSTEM_STATUS", systemStatus)

    // Log status change
    const logEntry = {
      action: isOnline ? "system_online" : "system_offline",
      description: isOnline ? "System brought online" : "System taken offline",
      performed_by: updatedBy,
      performed_at: new Date().toISOString(),
    }

    const systemLog = await getBinData("SYSTEM_LOG")
    systemLog.push(logEntry)
    await updateBinData("SYSTEM_LOG", systemLog)

    // Process queued orders if going from offline to online
    if (!wasOnline && goingOnline) {
      await processQueuedOrders()
    }

    return true
  } catch (error) {
    console.error("Error setting system status:", error)
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
        order.status = "processed"
        order.processed_at = new Date().toISOString()
        successCount++

        // Log order processed
        const systemLog = await getBinData("SYSTEM_LOG")
        systemLog.push({
          action: "order_processed",
          description: `Order #${order.order_id} processed`,
          performed_by: "system",
          performed_at: new Date().toISOString(),
        })
        await updateBinData("SYSTEM_LOG", systemLog)
      } catch (error) {
        console.error(`Error processing order ${order.order_id}:`, error)
        order.status = "failed"
        failedCount++
      }
    }

    // Update orders in bin
    await updateBinData("ORDERS", orders)

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

// Queue an order
async function queueOrder(order) {
  try {
    // Get current orders
    const orders = await getBinData("ORDERS")

    // Add order to queue
    orders.push(order)

    // Update orders in bin
    await updateBinData("ORDERS", orders)

    // Log order queued
    const systemLog = await getBinData("SYSTEM_LOG")
    systemLog.push({
      action: "order_queued",
      description: `Order #${order.order_id} queued`,
      performed_by: order.customer_name || "Guest",
      performed_at: new Date().toISOString(),
    })
    await updateBinData("SYSTEM_LOG", systemLog)

    return true
  } catch (error) {
    console.error("Error queuing order:", error)
    return false
  }
}

