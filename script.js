// ✅ Function to update the "Go to Cart" button with cart count
function updateCartButton() {
  const cartButtonContainer = document.getElementById("cart-button-container");
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

// ✅ Ensure the button updates whenever the cart is modified
document.addEventListener("DOMContentLoaded", () => {
  updateCartButton();
  document.addEventListener("cartUpdated", updateCartButton);
});

// ✅ Trigger "cartUpdated" event when adding to cart
// Function to add items to the cart
function addToCart(product) {
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();

  // Alert the user
  alert(`${product.name} added to the cart!`);

  // Refresh the page to reflect the updated cart
  setTimeout(() => {
    location.reload();
  }, 500); // Adds a small delay to ensure everything is saved
}

// ✅ Trigger "cartUpdated" event when removing from cart
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
  updateCartButton(); // ✅ Update the "Go to Cart" button immediately
}


// Cart functionality
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to display products on the products page
function displayProducts() {
  const products = [
    { id: 1, name: "Cool Ranch Doritos", price: 1.5 },
    { id: 2, name: "Nacho Cheese Doritos", price: 1.5 },
    { id: 3, name: "Cheeto Puffs", price: 1.5 },
    { id: 4, name: "Cheetos", price: 1.5 }
  ];

  const productContainer = document.getElementById("products");
  if (!productContainer) return;

  productContainer.innerHTML = "";

  products.forEach((product) => {
    const stock = localStorage.getItem(`product_${product.id}_stock`) || "Loading...";
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <h3>${product.name}</h3>
      <p>Price: $${product.price.toFixed(2)}</p>
      <p class="stock-info">Stock: ${stock}</p>
      <button class="add-to-cart" data-id="${product.id}" ${stock === "0" ? "disabled" : ""}>
        ${stock === "0" ? "Out of Stock" : "Add to Cart"}
      </button>
    `;
    productContainer.appendChild(productCard);
  });

  // ✅ Attach event listeners to the "Add to Cart" buttons after rendering
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = parseInt(this.getAttribute("data-id"));
      const product = products.find((item) => item.id === productId);
      if (product) {
        addToCart(product);
      }
    });
  });
}

// Function to add items to the cart
function addToCart(product) {
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  alert(`${product.name} added to the cart!`);
  saveCart();
  updateCartDisplay();
}

// Function to update the cart display
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
    cartItem.innerHTML = `
      <div>
        <span>${item.name} - $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</span>
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

// Function to remove items from the cart
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
}

// Function to handle checkout
function handleCheckout() {
  const checkoutForm = document.getElementById("checkout-form");
  if (!checkoutForm) return;

  loadCheckoutFormData();
  populateTimeOptions();

  let selectedLocation = "";
  let selectedTimeText = ""; // Store the time button's text

  // Handle location selection
  document.querySelectorAll(".location-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLocation = button.getAttribute("data-location");
      document.querySelectorAll(".location-option").forEach((btn) => btn.style.border = "none");
      button.style.border = "2px solid #2d89ef";
    });
  });

  // Handle time selection using the exact text from the button
  document.querySelectorAll(".time-option").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectedTimeText = button.textContent.trim(); // Use the exact button text
      document.querySelectorAll(".time-option").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  // Checkout button validation and submission
  document.getElementById("checkout-button").addEventListener("click", (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before proceeding to checkout.");
      return;
    }

    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;

    // Validation for required fields
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
    const selectedDateTime = new Date(`${date} ${selectedTimeText.split(" / ")[0]}`);

    // Prevent weekend orders
    const dayOfWeek = selectedDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert("Orders cannot be placed on weekends. Please select a weekday.");
      return;
    }

    // Ensure the selected date and time is at least 1 hour in the future
    const timeDifference = selectedDateTime - now;
    if (timeDifference < 3600000) {
      alert("Please select a time that is at least 1 hour in the future.");
      return;
    }

    // Store order details in sessionStorage
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    sessionStorage.setItem("orderName", name);
    sessionStorage.setItem("orderLocation", selectedLocation);
sessionStorage.setItem("orderTime", selectedTimeText.replace(" / ", " - "));
    sessionStorage.setItem("orderDate", date);

    // Redirect to checkout summary
    window.location.href = "checkout-summary.html";
  });
}

// Function to format time based on the selected date
function formatTime(time, date) {
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 1) {
    if (time.includes("8:15")) return "8:45 AM";
    if (time.includes("10:15")) return "10:50 AM";
  }
  return time.split(" / ")[0];
}

// Function to populate time options dynamically
function populateTimeOptions() {
  const timeOptions = [
    "8:15 AM / 8:45 AM (Before School)",
    "10:15 AM / 10:50 AM (Break)",
    "12:55 PM (Lunch)",
  ];

  const timeContainer = document.getElementById("time-options");
  if (!timeContainer) return;

  timeContainer.innerHTML = "";
  timeOptions.forEach((time) => {
    const button = document.createElement("button");
    button.classList.add("time-option");
    button.textContent = time;
    button.dataset.time = time; // Store the exact text
    timeContainer.appendChild(button);
  });
}

// Function to restrict weekends in the date picker
function restrictWeekendDates() {
  const dateInput = document.getElementById("date");
  if (!dateInput) return;

  dateInput.addEventListener("input", () => {
    const selectedDate = new Date(dateInput.value);
    const day = selectedDate.getDay();

    if (day === 0 || day === 6) {
      alert("Orders cannot be placed on weekends. Please select a weekday.");
      dateInput.value = "";
    }
  });
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));

  // Dispatch custom event to update the UI
  const cartUpdatedEvent = new Event("cartUpdated");
  document.dispatchEvent(cartUpdatedEvent);
}

// Load form data from localStorage
function loadCheckoutFormData() {
  const name = localStorage.getItem("checkoutFormName");
  const date = localStorage.getItem("checkoutFormDate");

  if (name) document.getElementById("name").value = name;
  if (date) document.getElementById("date").value = date;
}

// Load checkout summary from sessionStorage
function loadCheckoutSummary() {
  const checkoutCart = JSON.parse(sessionStorage.getItem("checkoutCart")) || [];
  const orderName = sessionStorage.getItem("orderName") || "XXX";
  const orderLocation = sessionStorage.getItem("orderLocation") || "XXX";
  const orderDate = sessionStorage.getItem("orderDate") || "XXX";
  const orderTime = sessionStorage.getItem("orderTime") || "XXX";

  const orderSummary = document.getElementById("order-summary");
  let total = 0;

  orderSummary.innerHTML = "";
  checkoutCart.forEach((item) => {
    total += item.price * item.quantity;
    orderSummary.innerHTML += `<p>${item.name} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</p>`;
  });

  document.getElementById("order-name").textContent = orderName;
  document.getElementById("order-location").textContent = orderLocation;
  document.getElementById("summary-order-date").textContent = orderDate;
  document.getElementById("summary-order-time").textContent = orderTime;
}

// Initialize functionality
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("products")) displayProducts();
  if (document.getElementById("cart-items")) updateCartDisplay();
  if (document.getElementById("checkout-form")) handleCheckout();
  if (document.getElementById("order-summary")) loadCheckoutSummary();
  updateCartButton(); // ✅ Update the button on page load
});

// Google Sheets API Integration for Stock Tracking
const API_KEY = 'AIzaSyDqd1fC7NRMLVMDHMvhNtZC5O8rJqjNNeE';  // Your API Key
const SHEET_ID = '13DiBvVe-jNM_o2CjdZXm34jLS0konxycmssb4BKpx8k';  // Your Sheet ID
const SHEET_NAME = 'Sheet1';  // Your Sheet Name

// Function to update stock in Google Sheets
async function updateStockInSheet(productId, newStock) {
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!E${productId + 1}?valueInputOption=RAW&key=${API_KEY}`;

  const body = {
    range: `${SHEET_NAME}!E${productId + 1}`,
    majorDimension: 'ROWS',
    values: [[newStock]],
  };

  try {
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('Error updating stock in Google Sheets:', response.statusText);
    } else {
      console.log('Stock updated successfully.');
    }
  } catch (error) {
    console.error('Error updating stock:', error);
  }
}

// Function to load stock data from Google Sheets
async function loadStockData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.values) {
      updateProductStock(data.values);
    } else {
      console.error('Failed to load stock data from Google Sheets.');
    }
  } catch (error) {
    console.error('Error loading stock data:', error);
  }
}

// Function to update product stock on the products page
function updateProductStock(sheetData) {
  const products = document.querySelectorAll('.product-card');

  products.forEach((product, index) => {
    if (sheetData[index + 1] && sheetData[index + 1][4] !== undefined) {
      const stockValue = sheetData[index + 1][4];
      const stockElement = product.querySelector('.stock-info');

      // Ensure stockElement exists before updating it
      if (stockElement) {
        stockElement.textContent = `Stock: ${stockValue}`;
        localStorage.setItem(`product_${index + 1}_stock`, stockValue);
      } else {
        console.error(`Stock element not found for product at index ${index}`);
      }
    }
  });
}

// Call the loadStockData function on page load
document.addEventListener('DOMContentLoaded', loadStockData);
document.addEventListener("cartUpdated", updateCartButton);
