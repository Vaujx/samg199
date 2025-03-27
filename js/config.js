/**
* Configuration for Seoul Grill 199
* This file contains configuration settings for the application
*/

// Configuration for JSONBin.io API
const CONFIG = {
   JSONBIN_URL: "https://api.jsonbin.io/v3/b",
   MASTER_KEY: "$2a$10$qrZ9tpKi.ajyrHn7A.dMbeABtgoW6dnb6aVVQWDxBjhfPNSw9skEC", // Replace with your actual Master Key
   X_ACCESS_KEY: "$2a$10$Fo4DZvMjTCYvNe2qeN1Y8eDIRR2nfwizqPVLDM.llf07CA4DpOgZa", // Replace with your actual Access Key
   // Bin IDs for different data types
   BINS: {
       PRODUCTS: "67e54b4b8960c979a5798697 ", // Replace with the ID from the script
       ORDERS: "67e54c158561e97a50f3f456 ", // Replace with the ID from the script
       SYSTEM_STATUS: "67e54b6d8a456b79667dbebe ", // Replace with the ID from the script
       SYSTEM_LOG: "67e54c2b8960c979a579877a ", // Replace with the ID from the script
   },
   // Default admin password
   ADMIN_PASSWORD: "admin123",
   // Version number for cache busting
   VERSION: "1.0.0",
   // Auto-initialize on GitHub Pages
   AUTO_INIT: false // Set to false since we're using predefined bin IDs
};
