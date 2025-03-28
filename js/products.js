/**
* Products Management
* This file handles loading and displaying products
*/

// Load products from JSONBin
async function loadProducts() {
    try {
        console.log("Loading products from JSONBin...");
        const products = await getBinData("PRODUCTS");

        // Check if products is empty or null
        if (!products || Object.keys(products).length === 0) {
            console.log("No products found in JSONBin, using default products");
            return DEFAULT_PRODUCTS;
        }

        console.log("Products loaded successfully:", products);
        return products;
    } catch (error) {
        console.error("Error loading products:", error);
        // Fallback to default products if there's an error
        console.log("Falling back to default products");
        return DEFAULT_PRODUCTS;
    }
}

// Display products on the page
async function displayProducts() {
    const productsGrid = document.getElementById("products-grid");
    if (!productsGrid) {
        console.error("Products grid element not found");
        return;
    }

    try {
        // Clear existing products
        productsGrid.innerHTML = '<div class="loading-indicator">Loading products...</div>';

        // Load products
        const products = await loadProducts();

        // Clear loading indicator
        productsGrid.innerHTML = "";

        // Check if products exist
        if (!products || Object.keys(products).length === 0) {
            productsGrid.innerHTML = "<p>No products available. Please check back later.</p>";
            return;
        }

        console.log("Displaying products:", Object.keys(products));

        // Add each product to the grid
        for (const [name, details] of Object.entries(products)) {
            const productCard = document.createElement("div");
            productCard.className = "product-card";
            
            // Set background image
            if (details.image) {
                productCard.style.backgroundImage = `url('${details.image}')`;
            }

            // Create product HTML with image and details
            let contentsList = "";
            details.contents.forEach((item) => {
                contentsList += `<li>${item}</li>`;
            });

            productCard.innerHTML = `
                <h3>${name} - ₱${details.price.toFixed(2)}</h3>
                <ul class="product-contents">
                    ${contentsList}
                </ul>
                <div class="add-to-cart-form">
                    <input type="number" class="quantity-input" value="1" min="1" id="quantity-${name.replace(/\s+/g, "-").toLowerCase()}">
                    <button type="button" class="add-to-cart-button" data-product="${name}">ADD TO CART</button>
                </div>
            `;

            productsGrid.appendChild(productCard);
        }

        // Add event listeners to Add to Cart buttons
        document.querySelectorAll(".add-to-cart-button").forEach((button) => {
            button.addEventListener("click", function () {
                const product = this.getAttribute("data-product");
                const quantityInput = document.getElementById(`quantity-${product.replace(/\s+/g, "-").toLowerCase()}`);
                const quantity = Number.parseInt(quantityInput.value, 10);

                if (quantity > 0) {
                    addToCart(product, quantity);
                }
            });
        });

        console.log("Products displayed successfully");
    } catch (error) {
        console.error("Error displaying products:", error);
        productsGrid.innerHTML = "<p>Error loading products. Please try again later.</p>";
    }
}

// Add a new product (admin function)
async function addProduct(name, price, contents, imageUrl) {
    try {
        // Validate inputs
        if (!name || !price || !contents || !Array.isArray(contents) || contents.length === 0) {
            throw new Error('Invalid product data');
        }
        
        // Load existing products
        const products = await loadProducts();
        
        // Check if product already exists
        if (products[name]) {
            throw new Error(`Product "${name}" already exists exists`);
        }
        
        // Add new product
        products[name] = {
            price: parseFloat(price),
            contents: contents,
            image: imageUrl || 'images/placeholder.jpg'
        };
        
        // Update products in JSONBin
        await updateBinData('PRODUCTS', products);
        
        // Log product addition
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'product_added',
            description: `Product "${name}" added`,
            performed_by: 'admin',
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error adding product:', error);
        return false;
    }
}

// Update an existing product (admin function)
async function updateProduct(name, price, contents, imageUrl) {
    try {
        // Validate inputs
        if (!name || !price || !contents || !Array.isArray(contents) || contents.length === 0) {
            throw new Error('Invalid product data');
        }
        
        // Load existing products
        const products = await loadProducts();
        
        // Check if product exists
        if (!products[name]) {
            throw new Error(`Product "${name}" not found`);
        }
        
        // Update product
        products[name] = {
            price: parseFloat(price),
            contents: contents,
            image: imageUrl || products[name].image || 'images/placeholder.jpg'
        };
        
        // Update products in JSONBin
        await updateBinData('PRODUCTS', products);
        
        // Log product update
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'product_updated',
            description: `Product "${name}" updated`,
            performed_by: 'admin',
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error updating product:', error);
        return false;
    }
}

// Delete a product (admin function)
async function deleteProduct(name) {
    try {
        // Load existing products
        const products = await loadProducts();
        
        // Check if product exists
        if (!products[name]) {
            throw new Error(`Product "${name}" not found`);
        }
        
        // Delete product
        delete products[name];
        
        // Update products in JSONBin
        await updateBinData('PRODUCTS', products);
        
        // Log product deletion
        const systemLog = await getBinData('SYSTEM_LOG');
        systemLog.push({
            action: 'product_deleted',
            description: `Product "${name}" deleted`,
            performed_by: 'admin',
            performed_at: new Date().toISOString()
        });
        await updateBinData('SYSTEM_LOG', systemLog);
        
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        return false;
    }
}
