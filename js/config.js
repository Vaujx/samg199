/**
 * Configuration for Seoul Grill 199
 * This file contains configuration settings for the application
 */

// Configuration for JSONBin.io API
const CONFIG = {
  JSONBIN_URL: "https://api.jsonbin.io/v3/b",
  MASTER_KEY: "$2a$10$qrZ9tpKi.ajyrHn7A.dMbeABtgoW6dnb6aVVQWDxBjhfPNSw9skEC",
  X_ACCESS_KEY: "$2a$10$V5G6G/GoKByB9rHsvU2bRupT.5uqU15DTZBXguWdHdrkTYi/ljsQG",
  // Bin IDs for different data types
  BINS: {
    PRODUCTS: "", // Will be created on first load
    ORDERS: "", // Will be created on first load
    SYSTEM_STATUS: "", // Will be created on first load
    SYSTEM_LOG: "", // Will be created on first load
  },
  // Default admin password
  ADMIN_PASSWORD: "admin123",
}

// Default products data
const DEFAULT_PRODUCTS = {
  "SET A": {
    price: 900.0,
    contents: [
      "200g POTATO MARBLE",
      "200g SWEETENED BANANA",
      "150g LETTUCE",
      "150g GOCHUJANG SAUCE",
      "150g SSAMJANG SAUCE",
    ],
    image: "images/FamilysetA.jpg",
  },
  "SET B": {
    price: 1260.0,
    contents: ["200g KIMCHI", "200g FISHCAKE", "200g POTATO MARBLE", "200g SWEETENED BANANA", "150g LETTUCE"],
    image: "images/FamilysetB.jpg",
  },
  "SET C": {
    price: 1450.0,
    contents: ["200g KIMCHI", "200g POTATO MARBLE", "200g SWEETENED BANANA", "150g LETTUCE"],
    image: "images/FamilysetC.jpg",
  },
  "TEST ITEM": {
    price: 1.0,
    contents: ["Test item for PayPal integration"],
    image: "images/placeholder.jpg",
  },
}

// Default system status
const DEFAULT_SYSTEM_STATUS = {
  status: 1, // 1 = online, 0 = offline
  updated_by: "system",
  updated_at: new Date().toISOString(),
}

// Default system log
const DEFAULT_SYSTEM_LOG = []

// Default orders
const DEFAULT_ORDERS = []

// Chat responses
const CHAT_RESPONSES = {
  delivery:
    "Delivery typically takes 30-45 minutes depending on your location. We prioritize keeping your Korean BBQ fresh and hot!",
  payment: "We accept cash on delivery, credit/debit cards, and online payments through our secure checkout system.",
  hours: "Seoul Grill 199 is open daily from 11:00 AM to 10:00 PM. Last orders are accepted until 9:30 PM.",
  minimum: "Yes, we have a minimum order of ₱500 for delivery. There is no minimum for pickup orders.",
  dietary:
    "Yes! While our specialty is Korean BBQ, we do offer vegetarian banchan (side dishes) and can customize some sets to be vegetarian-friendly. Please specify your dietary requirements in the order notes.",
  spicy:
    "You can request mild, medium, or spicy for dishes that contain gochujang or other spicy ingredients. Just add a note to your order.",
  cancel:
    "If you need to cancel your order, please call us immediately at 0910-392-6577. Orders can only be cancelled before they are prepared, typically within 5 minutes of ordering.",
  location: "Seoul Grill 199 is located at Iba Zambales. You can find us on Google Maps or contact us for directions.",
}

