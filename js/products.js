/**
 * Products Management
 * This file handles loading and displaying products
 */

// Import necessary functions and data
import { getBinData } from "./utils.js" // Assuming getBinData is in utils.js
import { DEFAULT_PRODUCTS } from "./data.js" // Assuming DEFAULT_PRODUCTS is in data.js
import { addToCart } from "./cart.js" // Assuming addToCart is in cart.js

// Load products from JSONBin
async function loadProducts() {
  try {
    const products = await getBinData("PRODUCTS")
    return products
  } catch (error) {
    console.error("Error loading products:", error)
    // Fallback to default products if there's an error
    return DEFAULT_PRODUCTS
  }
}

// Display products on the page
async function displayProducts() {
  const productsGrid = document.getElementById("products-grid")
  if (!productsGrid) return

  try {
    const products = await loadProducts()

    // Clear existing products
    productsGrid.innerHTML = ""

    // Add each product to the grid
    for (const [name, details] of Object.entries(products)) {
      const productCard = document.createElement("div")
      productCard.className = "product-card"

      // Create product HTML with image and details
      let contentsList = ""
      details.contents.forEach((item) => {
        contentsList += `<li>${item}</li>`
      })

      productCard.innerHTML = `
                <h3>${name} - ₱${details.price.toFixed(2)}</h3>
                <ul class="product-contents">
                    ${contentsList}
                </ul>
                <div class="add-to-cart-form">
                    <input type="number" class="quantity-input" value="1" min="1" id="quantity-${name
                      .replace(/\s+/g, "-")
                      .toLowerCase()}">
                    <button type="button" class="add-to-cart-button" data-product="${name}">ADD TO CART</button>
                </div>
            `

      productsGrid.appendChild(productCard)
    }

    // Add event listeners to Add to Cart buttons
    document.querySelectorAll(".add-to-cart-button").forEach((button) => {
      button.addEventListener("click", function () {
        const product = this.getAttribute("data-product")
        const quantityInput = document.getElementById(`quantity-${product.replace(/\s+/g, "-").toLowerCase()}`)
        const quantity = Number.parseInt(quantityInput.value, 10)

        if (quantity > 0) {
          addToCart(product, quantity)
        }
      })
    })
  } catch (error) {
    console.error("Error displaying products:", error)
    productsGrid.innerHTML = "<p>Error loading products. Please try again later.</p>"
  }
}

