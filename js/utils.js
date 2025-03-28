/**
* Utility Functions
* This file contains utility functions used throughout the application
*/

// Show notification
function showNotification(message, type = "success") {
   const notification = document.getElementById("notification");
   const notificationMessage = document.getElementById("notification-message");

   if (!notification || !notificationMessage) {
       console.log(`Notification: ${message} (Type: ${type})`);
       return;
   }

   // Set message
   notificationMessage.textContent = message;

   // Set icon based on type
   const icon = notification.querySelector("i");
   if (icon) {
       if (type === "success") {
           icon.className = "fas fa-check-circle";
           icon.style.color = "#4CAF50";
       } else if (type === "error") {
           icon.className = "fas fa-times-circle";
           icon.style.color = "#F44336";
       } else if (type === "warning") {
           icon.className = "fas fa-exclamation-triangle";
           icon.style.color = "#FF9800";
       } else if (type === "info") {
           icon.className = "fas fa-info-circle";
           icon.style.color = "#2196F3";
       }
   }

   // Show notification
   notification.style.display = "block";

   // Auto-hide after 4 seconds
   setTimeout(() => {
       notification.style.display = "none";
   }, 4000);
}

// Format currency
function formatCurrency(amount) {
   return "₱" + Number.parseFloat(amount).toFixed(2);
}

// Format date
function formatDate(dateString) {
   const date = new Date(dateString);
   return date.toLocaleString("en-US", {
       year: "numeric",
       month: "short",
       day: "numeric",
       hour: "numeric",
       minute: "2-digit",
       hour12: true,
   });
}

// Generate a unique ID
function generateId() {
   return Math.floor(100000 + Math.random() * 900000).toString();
}

// Pad string to specified length
function padString(str, length, char = " ") {
   str = String(str);
   return str.length >= length ? str : str + char.repeat(length - str.length);
}

// Parse URL parameters
function getUrlParams() {
   const params = {};
   const queryString = window.location.search.substring(1);
   const pairs = queryString.split("&");

   for (const pair of pairs) {
       const [key, value] = pair.split("=");
       if (key) {
           params[decodeURIComponent(key)] = decodeURIComponent(value || "");
       }
   }

   return params;
}

// Validate email
function validateEmail(email) {
   const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return re.test(String(email).toLowerCase());
}

// Validate phone number
function validatePhone(phone) {
   const re = /^\d{10,15}$/;
   return re.test(String(phone).replace(/[^0-9]/g, ""));
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
   let timeout;
   return function (...args) {
       clearTimeout(timeout);
       timeout = setTimeout(() => func.apply(this, args), wait);
   };
}
