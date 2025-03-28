/**
* Configuration for Seoul Grill 199
* This file contains configuration settings for the application
*/

// Configuration for JSONBin.io API
const CONFIG = {
   JSONBIN_URL: "https://api.jsonbin.io/v3/b",
   MASTER_KEY: "$2a$10$qrZ9tpKi.ajyrHn7A.dMbeABtgoW6dnb6aVVQWDxBjhfPNSw9skEC", // Replace with your actual Master Key
   X_ACCESS_KEY: "$2a$10$V5G6G/GoKByB9rHsvU2bRupT.5uqU15DTZBXguWdHdrkTYi/ljsQG", // Replace with your actual Access Key
   // Bin IDs for different data types - Using the correct bin IDs from your image
   BINS: {
       PRODUCTS: "67e54b4b896bc979a579869f", // PRODUCTS Bin
       ORDERS: "67e54c15856fe97a50f3f456", // ORDERS Bin
       SYSTEM_STATUS: "67e54b6d8a456b79667dbebe", // SYSTEM_STATUS Bin
       SYSTEM_LOG: "67e54c2b896bc979a579877a", // SYSTEM_LOG Bin
   },
   // Default admin password
   ADMIN_PASSWORD: "admin123",
   // Version number for cache busting
   VERSION: "1.0.0",
   // Auto-initialize on GitHub Pages
   AUTO_INIT: false
};

// Default products data
const DEFAULT_PRODUCTS = {
   "SET A": {
       price: 900.00,
       contents: [
           "200g POTATO MARBLE",
           "200g SWEETENED BANANA",
           "150g LETTUCE",
           "150g GOCHUJANG SAUCE",
           "150g SSAMJANG SAUCE"
       ],
       image: "images/FamilysetA.jpg"
   },
   "SET B": {
       price: 1260.00,
       contents: [
           "200g KIMCHI",
           "200g FISHCAKE",
           "200g POTATO MARBLE",
           "200g SWEETENED BANANA",
           "150g LETTUCE"
       ],
       image: "images/FamilysetB.jpg"
   },
   "SET C": {
       price: 1450.00,
       contents: [
           "200g KIMCHI",
           "200g POTATO MARBLE",
           "200g SWEETENED BANANA",
           "150g LETTUCE"
       ],
       image: "images/FamilysetC.jpg"
   },
   "TEST ITEM": {
       price: 1.00,
       contents: [
           "Test item for PayPal integration"
       ],
       image: "images/placeholder.jpg"
   }
};

// Default system status
const DEFAULT_SYSTEM_STATUS = {
   status: 1, // 1 = online, 0 = offline
   updated_by: "system",
   updated_at: new Date().toISOString()
};

// Default system log
const DEFAULT_SYSTEM_LOG = [];

// Default orders
const DEFAULT_ORDERS = [];

// Chat responses
const CHAT_RESPONSES = {
   delivery: "Delivery typically takes 30-45 minutes depending on your location. We prioritize keeping your Korean BBQ fresh and hot!",
   payment: "We accept cash on delivery, credit/debit cards, and online payments through our secure checkout system.",
   hours: "Seoul Grill 199 is open daily from 11:00 AM to 10:00 PM. Last orders are accepted until 9:30 PM.",
   minimum: "Yes, we have a minimum order of ₱500 for delivery. There is no minimum for pickup orders.",
   dietary: "Yes! While our specialty is Korean BBQ, we do offer vegetarian banchan (side dishes) and can customize some sets to be vegetarian-friendly. Please specify your dietary requirements in the order notes.",
   spicy: "You can request mild, medium, or spicy for dishes that contain gochujang or other spicy ingredients. Just add a note to your order.",
   cancel: "If you need to cancel your order, please call us immediately at 0910-392-6577. Orders can only be cancelled before they are prepared, typically within 5 minutes of ordering.",
   location: "Seoul Grill 199 is located at Iba Zambales. You can find us on Google Maps or contact us for directions."
};
