/**
 * Products API
 * This file handles product-related operations
 */

// Import necessary functions/variables (replace with actual import statements if available)
// For demonstration purposes, we'll declare them here.  In a real application,
// these would likely be imported from other modules.
async function getBinData(key) {
    // Placeholder implementation
    console.warn("getBinData is a placeholder. Implement the actual data retrieval.");
    return {}; // Return an empty object as a default
}

async function updateBinData(key, data) {
    // Placeholder implementation
    console.warn("updateBinData is a placeholder. Implement the actual data update.");
}

const DEFAULT_DATA = {
    PRODUCTS: {}
};

async function addToCart(productName, quantity) {
    // Placeholder implementation
    console.warn(`addToCart is a placeholder. Implement the actual add to cart logic for ${productName} (Quantity: ${quantity})`);
}


// Get all products
async function getProducts() {
    try {
        return await getBinData('PRODUCTS');
    } catch (error) {
        console.error('Error getting products:', error);
        return DEFAULT_DATA.PRODUCTS;
    }
}

// Get a single product by name
async function getProduct(productName) {
    try {
        const products = await getProducts();
        return products[productName];
    } catch (error) {
        console.error(`Error getting product ${productName}:`, error);
        return null;
    }
}

// Add a new product
async function addProduct(productName, productData) {
    try {
        const products = await getProducts();
        
        // Check if product already exists
        if (products[productName]) {
            throw new Error(`Product ${productName} already exists`);
        }
        
        // Add new product
        products[productName] = productData;
        
        // Update products in bin
        await updateBinData('PRODUCTS', products);
        
        return true;
    } catch (error) {
        console.error(`Error adding product ${productName}:`, error);
        return false;
    }
}

// Update an existing product
async function updateProduct(productName, productData) {
    try {
        const products = await getProducts();
        
        // Check if product exists
        if (!products[productName]) {
            throw new Error(`Product ${productName} not found`);
        }
        
        // Update product
        products[productName] = productData;
        
        // Update products in bin
        await updateBinData('PRODUCTS', products);
        
        return true;
    } catch (error) {
        console.error(`Error updating product ${productName}:`, error);
        return false;
    }
}

// Delete a product
async function deleteProduct(productName) {
    try {
        const products = await getProducts();
        
        // Check if product exists
        if (!products[productName]) {
            throw new Error(`Product ${productName} not found`);
        }
        
        // Delete product
        delete products[productName];
        
        // Update products in bin
        await updateBinData('PRODUCTS', products);
        
        return true;
    } catch (error) {
        console.error(`Error deleting product ${productName}:`, error);
        return false;
    }
}

// Display products on the page
async function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    try {
        const products = await getProducts();
        
        // Clear existing products
        productsGrid.innerHTML = '';
        
        // Add each product to the grid
        for (const [name, details] of Object.entries(products)) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Create list of contents
            const contentsList = details.contents.map(item => `<li>${item}</li>`).join('');
            
            // Create product card HTML
            productCard.innerHTML = `
                <h3>${name} - ₱${details.price.toFixed(2)}</h3>
                <ul class="product-contents">
                    ${contentsList}
                </ul>
                <div class="add-to-cart-form">
                    <input type="number" class="quantity-input" value="1" min="1" id="quantity-${name.replace(/\s+/g, '-').toLowerCase()}">
                    <button type="button" class="add-to-cart-button" data-product="${name}">
                        Add to Cart
                    </button>
                </div>
            `;
            
            productsGrid.appendChild(productCard);
        }
        
        // Add event listeners to Add to Cart buttons
        document.querySelectorAll('.add-to-cart-button').forEach(button => {
            button.addEventListener('click', function() {
                const product = this.getAttribute('data-product');
                const quantityInput = document.getElementById(`quantity-${product.replace(/\s+/g, '-').toLowerCase()}`);
                const quantity = parseInt(quantityInput.value, 10);
                
                if (quantity > 0) {
                    addToCart(product, quantity);
                }
            });
        });
    } catch (error) {
        console.error('Error displaying products:', error);
        productsGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}
