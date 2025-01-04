// Cart functionality
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to display products on the products page
function displayProducts() {
  const products = [
    { id: 1, name: "Product A", price: 10, description: "Description of Product A" },
    { id: 2, name: "Product B", price: 15, description: "Description of Product B" },
    { id: 3, name: "Product C", price: 20, description: "Description of Product C" },
  ];

  const productContainer = document.getElementById("products");
  if (!productContainer) return;

  productContainer.innerHTML = "";

  products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>Price: $${product.price.toFixed(2)}</p>
      <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
    `;
    productContainer.appendChild(productCard);
  });

  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (event) => {
      const productId = parseInt(event.target.getAttribute("data-id"));
      const product = products.find((p) => p.id === productId);
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
  restrictWeekendDates();

  let selectedLocation = "";
  let selectedTime = "";

  // Handle location selection
  document.querySelectorAll(".location-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLocation = button.getAttribute("data-location");
      document.querySelectorAll(".location-option").forEach((btn) => btn.style.border = "none");
      button.style.border = "2px solid #2d89ef";
    });
  });

  // Handle time selection
  document.querySelectorAll(".time-option").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectedTime = button.getAttribute("data-time");
      document.querySelectorAll(".time-option").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  // Checkout button validation and submission
  document.getElementById("checkout-button").addEventListener("click", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const now = new Date();
    const selectedDate = new Date(date + " " + selectedTime);

    // Check if the selected date is a weekend
    const dayOfWeek = selectedDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert("Orders cannot be placed on weekends. Please select a weekday.");
      return;
    }

    // Ensure time is at least 1 hour from now
    if (selectedDate - now < 3600000) {
      alert("Please select a time that is at least 1 hour in the future.");
      return;
    }

    // Ensure required fields are filled
    if (!name || !date || !selectedLocation || !selectedTime) {
      alert(`Please fill out the following missing fields:\n${!name ? '- Name\n' : ''}${!date ? '- Date\n' : ''}${!selectedLocation ? '- Location\n' : ''}${!selectedTime ? '- Time\n' : ''}`);
      return;
    }

    // Store order details in sessionStorage
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    sessionStorage.setItem("orderName", name);
    sessionStorage.setItem("orderLocation", selectedLocation);
    sessionStorage.setItem("orderTime", formatTime(selectedTime, date));
    sessionStorage.setItem("orderDate", date);

    // Redirect to checkout summary
    window.location.href = "checkout-summary.html";
  });
}

// Function to format time based on the selected date
function formatTime(time, date) {
  const dayOfWeek = new Date(date).getUTCDay();
  if (dayOfWeek === 1) { // Monday
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
    button.dataset.time = time;
    timeContainer.appendChild(button);
  });
}

// Function to restrict weekends in the date picker
function restrictWeekendDates() {
  const dateInput = document.getElementById("date");
  if (!dateInput) return;

  dateInput.addEventListener("input", () => {
    const selectedDate = new Date(dateInput.value);
    const day = selectedDate.getUTCDay();

    if (day === 0 || day === 6) {
      alert("Orders cannot be placed on weekends. Please select a weekday.");
      dateInput.value = "";
    }
  });
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
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
});

