/* ===============================
   Global Variables & Cart Setup
=============================== */
// Remove the import line
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let selectedTimeText = "";

/* ===============================
   Utility Functions
=============================== */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  const cartUpdatedEvent = new Event("cartUpdated");
  document.dispatchEvent(cartUpdatedEvent);
  updateCartCount();
  updateCartButton();
}

/* ===============================
   Cart & Product Display Functions
=============================== */
function updateCartButton() {
  const cartButtonContainer = document.getElementById("cart-button-container");
  if (!cartButtonContainer) return;
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  if (itemCount > 0) {
    cartButtonContainer.innerHTML = `
      <button id="go-to-cart" onclick="window.location.href='cart.html'">
        Go to Cart (${itemCount})
      </button>
    `;
  } else {
    cartButtonContainer.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartButton();
  document.addEventListener("cartUpdated", () => {
    updateCartButton();
    updateCartCount();
  });
});

function updateCartDisplay() {
  const cartContainer = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  if (!cartContainer) return;
  cartContainer.innerHTML = "";
  let total = 0;
  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.innerHTML = "";
    return;
  }
  cart.forEach((item) => {
    total += item.price * item.quantity;
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    // Display only product name and quantity
    cartItem.innerHTML = `
      <div>
        <span>${item.name} (Qty: ${item.quantity})</span>
        <button class="remove-from-cart" data-id="${item.id}">Remove</button>
      </div>
    `;
    cartContainer.appendChild(cartItem);
  });
  cartTotal.innerHTML = `<p><strong>Total: $${total.toFixed(2)}</strong></p>`;
  document.querySelectorAll(".remove-from-cart").forEach((button) => {
    button.addEventListener("click", (event) => {
      const productId = parseInt(event.target.getAttribute("data-id"));
      removeFromCart(productId);
    });
  });
}

function removeFromCart(productId) {
  const productIndex = cart.findIndex((item) => item.id === productId);
  if (productIndex > -1) {
    if (cart[productIndex].quantity > 1) {
      cart[productIndex].quantity--;
    } else {
      cart.splice(productIndex, 1);
    }
  }
  saveCart();
  updateCartDisplay();
  updateCartButton();
}

/* ===============================
   Product Page Functions - Dynamic via Google Sheets
=============================== */
// Note: The API_KEY, SHEET_ID, and SHEET_NAME variables are now provided by config.js
async function loadProductData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.values) {
      updateProductsFromSheet(data.values);
    } else {
      console.error('Failed to load product data from Google Sheets.');
    }
  } catch (error) {
    console.error('Error loading product data:', error);
  }
}

function updateProductsFromSheet(sheetData) {
  const productContainer = document.getElementById("products");
  if (!productContainer) return;
  productContainer.innerHTML = "";
  // Assume the first row is headers; product data starts at row 2 (index 1)
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    const id = i; // Using the row number as product ID
    const name = row[1] || `Product ${id}`;  // Column B: Product Name
    const price = parseFloat(row[3]) || 0;    // Column D: Product Price
    const stock = parseInt(row[4]) || 0;      // Column E: Stock
    // Column F: Image URL (if provided); fallback to default naming convention if not provided
    const image = row[5] && row[5].trim() !== "" ? row[5] : `images/product-${id}.png`;
    // Save stock in localStorage for later validation
    localStorage.setItem(`product_${id}_stock`, stock);
    
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    
    // Check if product is in stock
    const isInStock = stock > 0;
    
    productCard.innerHTML = `
      <div class="product-image-container">
        <img src="${image}" alt="${name}" class="product-image">
      </div>
      <div class="product-details">
        <h3 class="product-name">${name}</h3>
        <p class="product-price">Price: $${price.toFixed(2)}</p>
        <p class="stock-info ${isInStock ? 'in-stock' : 'out-of-stock'}">
          Stock: ${stock}
        </p>
        ${isInStock ? 
          `<div class="quantity-control">
            <button class="quantity-btn minus">-</button>
            <input type="number" min="1" max="${stock}" value="1" class="quantity-input">
            <button class="quantity-btn plus">+</button>
          </div>
          <button class="add-to-cart" data-id="${id}">
            Add to Cart
          </button>` : 
          `<button class="out-of-stock" disabled>Out of Stock</button>`
        }
      </div>
    `;
    
    productContainer.appendChild(productCard);
  }
  
  // Attach event listeners to all "Add to Cart" buttons
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = parseInt(this.getAttribute("data-id"));
      const row = sheetData[productId]; // using row index as product ID
      const quantityInput = this.parentElement.querySelector('.quantity-input');
      const quantity = parseInt(quantityInput.value) || 1;
      
      const product = {
        id: productId,
        name: row[1],
        price: parseFloat(row[3]),
        image: row[5] && row[5].trim() !== "" ? row[5] : `images/product-${productId}.png`
      };
      const currentStock = parseInt(localStorage.getItem(`product_${productId}_stock`)) || 0;
      const existingProduct = cart.find((item) => item.id === productId);
      const currentQuantity = existingProduct ? existingProduct.quantity : 0;
      
      if (currentQuantity + quantity > currentStock) {
        alert("Cannot add more than available stock.");
        return;
      }
      
      addToCart(product, quantity);
      updateCartCount();
      updateCartButton();
    });
  });
  
  // Add event listeners for quantity controls
  document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.quantity-input');
      const max = parseInt(input.getAttribute('max'));
      const currentVal = parseInt(input.value) || 1;
      if (currentVal < max) {
        input.value = currentVal + 1;
      }
    });
  });
  
  document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.quantity-input');
      const currentVal = parseInt(input.value) || 1;
      if (currentVal > 1) {
        input.value = currentVal - 1;
      }
    });
  });
}

function addToCart(product, quantity = 1) {
  const existingProduct = cart.find((item) => item.id === product.id);
  if (existingProduct) {
    existingProduct.quantity += quantity;
  } else {
    cart.push({ ...product, quantity: quantity });
  }
  alert(`${product.name} added to the cart!`);
  saveCart();
  updateCartDisplay();
  updateCartButton();
  updateCartCount();
}

/* ===============================
   Time Options for Checkout (Static Buttons)
=============================== */
function populateTimeOptions() {
  const timeOptions = [
    "8:15/8:45 AM (Before School)",
    "10:15/10:55 AM (Break)",
    "12:55 PM (Lunch)"
  ];
  const timeContainer = document.getElementById("time-options");
  if (!timeContainer) return;
  timeContainer.innerHTML = "";

  timeOptions.forEach((time) => {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("time-option");
    button.textContent = time;
    button.dataset.time = time;

    if (selectedTimeText === time) {
      button.classList.add("selected");
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectedTimeText = button.dataset.time;
      document.querySelectorAll(".time-option").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
    });

    timeContainer.appendChild(button);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.addEventListener("change", populateTimeOptions);
    populateTimeOptions();
  }
});

/* ===============================
   Checkout Form Handling
=============================== */
function handleCheckout() {
  const checkoutForm = document.getElementById("checkout-form");
  if (!checkoutForm) return;
  loadCheckoutFormData();
  populateTimeOptions();
  let selectedLocation = "";
  document.querySelectorAll(".location-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLocation = button.getAttribute("data-location");
      document.querySelectorAll(".location-option").forEach((btn) => (btn.style.border = "none"));
      button.style.border = "2px solid #ffca12";
    });
  });
  document.getElementById("checkout-button").addEventListener("click", (e) => {
    e.preventDefault();
    // If shop is closed, ensure pickup date is on or after the closed-until date.
    const statusElement = document.getElementById("shop-status");
    if (statusElement && statusElement.textContent.startsWith("Closed")) {
      const regex = /Closed until (\d{1,2}\/\d{1,2}\/\d{4})/;
      const match = statusElement.textContent.match(regex);
      if (match && match[1]) {
        const closeUntil = new Date(match[1]);
        const selectedDate = document.getElementById("date").value;
        if (selectedDate) {
          const pickupDate = new Date(selectedDate);
          if (pickupDate < closeUntil) {
            alert("Pickup date must be on or after " + match[1] + " since the shop is closed until then.");
            return;
          }
        } else {
          alert("Please select a pickup date.");
          return;
        }
      }
    }
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before proceeding to checkout.");
      return;
    }
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    if (!name || !date || !selectedLocation || !selectedTimeText) {
      let errorMessage = "Please fill out the following missing fields:\n";
      if (!name) errorMessage += "- Name\n";
      if (!selectedLocation) errorMessage += "- Location\n";
      if (!date) errorMessage += "- Date\n";
      if (!selectedTimeText) errorMessage += "- Time\n";
      alert(errorMessage);
      return;
    }
    const now = new Date();
    const selectedTimeForValidation = selectedTimeText.split("/")[0].trim();
    const selectedDateTime = new Date(date + " " + selectedTimeForValidation);
    if (selectedDateTime - now < 600000) {
      alert("Please select a pickup time that is at least 10 minutes from now.");
      return;
    }
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    sessionStorage.setItem("orderName", name);
    sessionStorage.setItem("orderLocation", selectedLocation);
    sessionStorage.setItem("orderTime", selectedTimeText);
    sessionStorage.setItem("orderDate", date);
    window.location.href = "checkout-summary.html";
  });
}

function loadCheckoutFormData() {
  const name = localStorage.getItem("checkoutFormName");
  const date = localStorage.getItem("checkoutFormDate");
  if (name) document.getElementById("name").value = name;
  if (date) document.getElementById("date").value = date;
}

/* ===============================
   Checkout Summary Loading with Dynamic Time Adjustment
=============================== */
function loadCheckoutSummary() {
  const checkoutCart = JSON.parse(sessionStorage.getItem("checkoutCart")) || [];
  const orderName = sessionStorage.getItem("orderName") || "No Name Provided";
  const orderLocation = sessionStorage.getItem("orderLocation") || "No Location Selected";
  const orderDate = sessionStorage.getItem("orderDate") || "No Date Selected";
  let orderTime = sessionStorage.getItem("orderTime") || "No Time Selected";
  if (orderDate && orderTime.includes("/")) {
    const dateObj = new Date(orderDate + "T00:00:00");
    const day = dateObj.getDay();
    const parts = orderTime.split("/");
    if (day === 1) {
      orderTime = parts[1].trim();
    } else if (day >= 2 && day <= 5) {
      orderTime = parts[0].trim();
    }
  }
  const orderSummary = document.getElementById("order-summary");
  let total = 0;
  orderSummary.innerHTML = "";
  checkoutCart.forEach((item) => {
    total += item.price * item.quantity;
    orderSummary.innerHTML += `<p>${item.name} (Qty: ${item.quantity})</p>`;
  });
  document.getElementById("order-name").textContent = orderName;
  document.getElementById("order-location").textContent = orderLocation;
  document.getElementById("order-date").textContent = orderDate;
  document.getElementById("order-time").textContent = orderTime;
  document.getElementById("total-price").textContent = total.toFixed(2);
  document.getElementById("order-date-time").textContent = `${orderDate} - ${orderTime}`;
}

/* ===============================
   Shop Status & Stock Integration via Google Sheets
=============================== */


/* ===============================
   DOMContentLoaded Initialization
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("products")) loadProductData();
  if (document.getElementById("cart-items")) updateCartDisplay();
  if (document.getElementById("checkout-form")) handleCheckout();
  if (document.getElementById("order-summary")) loadCheckoutSummary();
  updateCartButton();
  loadShopStatus();
});

async function loadShopStatus() {
  try {
    const statusUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!H2?key=${API_KEY}`;
    const dateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!H3?key=${API_KEY}`;
    const [statusResponse, dateResponse] = await Promise.all([fetch(statusUrl), fetch(dateUrl)]);
    const statusData = await statusResponse.json();
    const dateData = await dateResponse.json();
    let statusElement = document.getElementById("shop-status");

    let closeDate = "";
    if (dateData.values && dateData.values[0] && dateData.values[0][0]) {
      closeDate = dateData.values[0][0];
    }

    if (statusData.values && statusData.values[0] && statusData.values[0][0]) {
      const statusValue = statusData.values[0][0];

      if (statusValue === "2" && closeDate) {
        const [month, day, year] = closeDate.split('/');
        const parsedCloseDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
        const now = new Date();
        if (parsedCloseDate < now) {
          statusElement.outerHTML = `<button id="shop-status" class="present">Open</button>`;
          return;
        }
        statusElement.outerHTML = `<button id="shop-status" class="absent">Closed until ${closeDate}</button>`;
      } else if (statusValue === "1") {
        statusElement.outerHTML = `<button id="shop-status" class="present">Open</button>`;
      } else {
        statusElement.outerHTML = `<button id="shop-status">Unknown</button>`;
      }
    } else {
      statusElement.outerHTML = `<button id="shop-status">Unknown</button>`;
    }
  } catch (error) {
    console.error("loadShopStatus error:", error);
    let statusElement = document.getElementById("shop-status");
    if (statusElement) {
      statusElement.outerHTML = `<button id="shop-status">Error</button>`;
    }
  }
}

function handleCheckout() {
  const checkoutForm = document.getElementById("checkout-form");
  if (!checkoutForm) return;
  loadCheckoutFormData();
  populateTimeOptions();
  let selectedLocation = "";
  document.querySelectorAll(".location-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLocation = button.getAttribute("data-location");
      document.querySelectorAll(".location-option").forEach((btn) => (btn.style.border = "none"));
      button.style.border = "2px solid #ffca12";
    });
  });
  document.getElementById("checkout-button").addEventListener("click", (e) => {
    e.preventDefault();
    const statusElement = document.getElementById("shop-status");
    if (statusElement && statusElement.textContent.startsWith("Closed")) {
      const regex = /Closed until (\d{1,2}\/\d{1,2}\/\d{4})/;
      const match = statusElement.textContent.match(regex);
      if (match && match[1]) {
        const [month, day, year] = match[1].split('/');
        const closeUntil = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
        const selectedDate = document.getElementById("date").value;
        if (selectedDate) {
          const pickupDate = new Date(selectedDate + "T00:00:00");
          if (pickupDate < closeUntil) {
            alert("The shop is closed until " + match[1] + ". Please choose a pickup date after that.");
            return;
          }
        } else {
          alert("Please select a pickup date.");
          return;
        }
      }
    }
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before proceeding to checkout.");
      return;
    }
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    if (!name || !date || !selectedLocation || !selectedTimeText) {
      let errorMessage = "Please fill out the following missing fields:\n";
      if (!name) errorMessage += "- Name\n";
      if (!selectedLocation) errorMessage += "- Location\n";
      if (!date) errorMessage += "- Date\n";
      if (!selectedTimeText) errorMessage += "- Time\n";
      alert(errorMessage);
      return;
    }
    const now = new Date();
    const selectedTimeForValidation = selectedTimeText.split("/")[0].trim();
    const selectedDateTime = new Date(date + " " + selectedTimeForValidation);
    if (selectedDateTime - now < 600000) {
      alert("Please select a pickup time that is at least 10 minutes from now.");
      return;
    }
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    sessionStorage.setItem("orderName", name);
    sessionStorage.setItem("orderLocation", selectedLocation);
    sessionStorage.setItem("orderTime", selectedTimeText);
    sessionStorage.setItem("orderDate", date);
    window.location.href = "checkout-summary.html";
  });
}

function loadProducts() {
  const productsContainer = document.getElementById('products');
  
  if (!productsContainer) return;
  
  // Clear any existing content
  productsContainer.innerHTML = '';
  
  // Check if products exist in config
  if (!products || !Array.isArray(products) || products.length === 0) {
    productsContainer.innerHTML = '<p class="empty-products">No products available at this time.</p>';
    console.error('Products array is missing or empty in config.js');
    return;
  }
  
  // Loop through products and create product cards
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    productCard.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-image">
      </div>
      <div class="product-details">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">$${product.price.toFixed(2)}</p>
        <p class="product-description">${product.description || ''}</p>
        <div class="quantity-control">
          <button class="quantity-btn minus">-</button>
          <input type="number" min="1" value="1" class="quantity-input">
          <button class="quantity-btn plus">+</button>
        </div>
        <div class="product-actions">
          <button class="add-to-cart" data-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
    
    productsContainer.appendChild(productCard);
    
    // Add event listener to the Add to Cart button
    const addToCartBtn = productCard.querySelector('.add-to-cart');
    addToCartBtn.addEventListener('click', function() {
      const quantityInput = productCard.querySelector('.quantity-input');
      const quantity = parseInt(quantityInput.value) || 1;
      addToCart(product, quantity); // FIX 1: Pass the actual quantity to addToCart
      updateCartCount();
      updateCartButton(); // FIX 2: Update the cart button immediately
    });
    
    // Add event listeners for quantity controls
    const plusBtn = productCard.querySelector('.quantity-btn.plus');
    const minusBtn = productCard.querySelector('.quantity-btn.minus');
    const quantityInput = productCard.querySelector('.quantity-input');
    
    plusBtn.addEventListener('click', function() {
      const currentVal = parseInt(quantityInput.value) || 1;
      quantityInput.value = currentVal + 1;
    });
    
    minusBtn.addEventListener('click', function() {
      const currentVal = parseInt(quantityInput.value) || 1;
      if (currentVal > 1) {
        quantityInput.value = currentVal - 1;
      }
    });
  });
  
  // Make sure the cart button is updated
  updateCartButton();
}

// Function to load featured products
function loadFeaturedProducts() {
  const featuredContainer = document.getElementById('featured-products-carousel');
  
  if (!featuredContainer) return;
  
  // Clear any existing content
  featuredContainer.innerHTML = '';
  
  // Check if products exist in config
  if (!products || !Array.isArray(products) || products.length === 0) {
    featuredContainer.innerHTML = '<p class="empty-products">No featured products available.</p>';
    console.error('Products array is missing or empty in config.js');
    return;
  }
  
  // Get 3-4 featured products (or all if less than that)
  const featuredProducts = products.slice(0, Math.min(4, products.length));
  
  // Create featured product cards
  featuredProducts.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'featured-product-card';
    
    productCard.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-image">
      </div>
      <div class="product-details">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">$${product.price.toFixed(2)}</p>
        <div class="product-actions">
          <button class="add-to-cart" data-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
    
    featuredContainer.appendChild(productCard);
    
    // Add event listener to the Add to Cart button
    const addToCartBtn = productCard.querySelector('.add-to-cart');
    addToCartBtn.addEventListener('click', function() {
      addToCart(product, 1);
      updateCartCount();
    });
  });
}

// Function to update cart count in the header
function updateCartCount() {
  const cartCountElement = document.querySelector('.cart-count');
  if (!cartCountElement) return;
  
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  cartCountElement.textContent = itemCount;
}

// Function to update shop status
function updateShopStatus() {
  const statusElement = document.getElementById('shop-status');
  if (!statusElement) return;
  
  // Check if shopStatus is defined in config.js
  if (typeof shopStatus === 'undefined') {
    statusElement.textContent = 'Status Unknown';
    console.error('shopStatus is not defined in config.js');
    return;
  }
  
  if (shopStatus === 'open') {
    statusElement.textContent = 'Open';
    statusElement.classList.remove('absent');
  } else {
    statusElement.textContent = 'Closed';
    statusElement.classList.add('absent');
  }
}