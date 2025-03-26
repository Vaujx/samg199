/**
 * Main Application
 * This file initializes the application and sets up event listeners
 */

// Declare variables (assuming they are defined in other files)
let initializeJSONBin;
let displayProducts;
let displayCart;
let openCheckoutModal;
let updateCartQuantity;
let isAdminLoggedIn;
let showAdminDashboard;
let showAdminLogin;
let adminLogin;
let adminLogout;
let setSystemStatus;
let loadAdminDashboard;
let exportOrders;
let importOrders;
let getSystemStatus;
let showNotification;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing application...');
        
        // Initialize JSONBin.io
        await initializeJSONBin();
        
        // Set current year in footer
        const currentYearElements = document.querySelectorAll('#current-year');
        currentYearElements.forEach(element => {
            element.textContent = new Date().getFullYear();
        });
        
        // Check which page we're on
        const path = window.location.pathname;
        
        if (path.includes('admin-queue.html')) {
            // Admin page
            initAdminPage();
        } else if (path.includes('about.html')) {
            // About page
            // Nothing special to initialize
        } else {
            // Main page (index.html)
            initMainPage();
        }
        
        console.log('Application initialized successfully.');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Initialize main page
async function initMainPage() {
    try {
        // Display products
        await displayProducts();
        
        // Display cart
        await displayCart();
        
        // Check system status
        await checkSystemStatus();
        
        // Add event listeners
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', openCheckoutModal);
        }
        
        const updateCartButton = document.getElementById('update-cart-button');
        if (updateCartButton) {
            updateCartButton.addEventListener('click', function() {
                // Update cart quantities
                const quantityInputs = document.querySelectorAll('.cart-quantity-input');
                quantityInputs.forEach(input => {
                    const product = input.getAttribute('data-product');
                    const quantity = parseInt(input.value, 10);
                    if (product && quantity) {
                        updateCartQuantity(product, quantity);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error initializing main page:', error);
    }
}

// Initialize admin page
function initAdminPage() {
    try {
        // Check if admin is logged in
        if (isAdminLoggedIn()) {
            showAdminDashboardFunc();
        } else {
            showAdminLoginForm();
        }
        
        // Add event listeners
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.addEventListener('click', function() {
                const passwordInput = document.getElementById('admin_password');
                if (passwordInput) {
                    const password = passwordInput.value;
                    if (adminLogin(password)) {
                        showAdminDashboardFunc();
                    } else {
                        showNotification('Invalid password. Please try again.', 'error');
                    }
                }
            });
        }
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                adminLogout();
                showAdminLoginForm();
            });
        }
        
        const onlineButton = document.getElementById('online-button');
        if (onlineButton) {
            onlineButton.addEventListener('click', async function() {
                await setSystemStatus(true, 'admin');
                await loadAdminDashboard();
            });
        }
        
        const offlineButton = document.getElementById('offline-button');
        if (offlineButton) {
            offlineButton.addEventListener('click', async function() {
                await setSystemStatus(false, 'admin');
                await loadAdminDashboard();
            });
        }
        
        const exportButton = document.getElementById('export-button');
        if (exportButton) {
            exportButton.addEventListener('click', exportOrders);
        }
        
        const importButton = document.getElementById('import-button');
        if (importButton) {
            importButton.addEventListener('click', function() {
                const fileInput = document.getElementById('import-file');
                if (fileInput && fileInput.files && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = async function(e) {
                        const content = e.target.result;
                        const result = await importOrders(content);
                        
                        const importResults = document.getElementById('import-results');
                        const importMessage = document.getElementById('import-message');
                        
                        if (importResults && importMessage) {
                            importResults.style.display = 'block';
                            
                            if (result.success) {
                                importMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Success:</strong> ${result.message}`;
                            } else {
                                importMessage.innerHTML = `<i class="fas fa-times-circle"></i> <strong>Error:</strong> ${result.message}`;
                            }
                        }
                        
                        // Reload admin dashboard
                        await loadAdminDashboard();
                    };
                    
                    reader.readAsText(file);
                } else {
                    showNotification('Please select a file to import.', 'error');
                }
            });
        }
    } catch (error) {
        console.error('Error initializing admin page:', error);
    }
}

// Show admin login
function showAdminLoginForm() {
    const adminLogin = document.getElementById('admin-login');
    const adminDashboard = document.getElementById('admin-dashboard');
    
    if (adminLogin && adminDashboard) {
        adminLogin.style.display = 'block';
        adminDashboard.style.display = 'none';
    }
}

// Show admin dashboard
async function showAdminDashboardFunc() {
    const adminLogin = document.getElementById('admin-login');
    const adminDashboard = document.getElementById('admin-dashboard');
    
    if (adminLogin && adminDashboard) {
        adminLogin.style.display = 'none';
        adminDashboard.style.display = 'block';
        
        // Load admin dashboard data
        await loadAdminDashboard();
    }
}

// Check system status and update UI
async function checkSystemStatus() {
    try {
        const systemOnline = await getSystemStatus();
        
        // Update system status indicator
        const statusIndicator = document.getElementById('system-status-indicator');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (statusIndicator && statusDot && statusText) {
            statusIndicator.className = `system-status-indicator ${systemOnline ? 'status-online' : 'status-offline'}`;
            statusDot.className = `status-dot ${systemOnline ? 'dot-online' : 'dot-offline'}`;
            statusText.textContent = systemOnline ? 'System Online' : 'System Maintenance';
        }
        
        // Show/hide maintenance notice
        const maintenanceNotice = document.getElementById('maintenance-notice');
        if (maintenanceNotice) {
            maintenanceNotice.style.display = systemOnline ? 'none' : 'block';
        }
    } catch (error) {
        console.error('Error checking system status:', error);
    }
}

// Update file name display
function updateFileName(input) {
    const fileName = input.files[0] ? input.files[0].name : 'No file chosen';
    const fileNameElement = document.getElementById('file-name');
    if (fileNameElement) {
        fileNameElement.textContent = fileName;
    }
}
