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

  // Load saved form data
  loadCheckoutFormData();

  // Dynamically populate time options based on the day of the week
  const dayOfWeek = new Date().getDay();
  const timeOptions = dayOfWeek === 1
    ? ["8:45 AM (Before School)", "10:50 AM (Break)", "12:55 PM (Lunch)"] // Monday
    : ["8:15 AM (Before School)", "10:15 AM (Break)", "12:55 PM (Lunch)"]; // Tuesday to Friday

  const timeContainer = document.getElementById("time-options");
  timeContainer.innerHTML = "";
  timeOptions.forEach((time) => {
    const button = document.createElement("button");
    button.classList.add("time-option");
    button.textContent = time;
    button.dataset.time = time;
    timeContainer.appendChild(button);
  });

  let selectedLocation = "";
  let selectedTime = "";

  // Handle location selection
  document.querySelectorAll(".location-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLocation = button.getAttribute("data-location");
      document.querySelectorAll(".location-option").forEach((btn) => btn.classList.remove("selected"));
      button.classList.add("selected");
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

  // Save form data on input change
  checkoutForm.addEventListener("input", saveCheckoutFormData);

  // Handle form submission
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty. Please add items to the cart before checking out.");
      return;
    }

    if (!selectedLocation) {
      alert("Please select a location.");
      return;
    }

    if (!selectedTime) {
      alert("Please select a time.");
      return;
    }

    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;

    // Store order details in sessionStorage
    sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
    sessionStorage.setItem("orderName", name);
    sessionStorage.setItem("orderLocation", selectedLocation);
    sessionStorage.setItem("orderTime", selectedTime);
    sessionStorage.setItem("orderDate", date);

    window.location.href = "checkout-summary.html";
  });
}

// Save form data to localStorage
function saveCheckoutFormData() {
  const name = document.getElementById("name").value;
  const date = document.getElementById("date").value;
  localStorage.setItem("checkoutFormName", name);
  localStorage.setItem("checkoutFormDate", date);
}

// Load form data from localStorage
function loadCheckoutFormData() {
  const name = localStorage.getItem("checkoutFormName");
  const date = localStorage.getItem("checkoutFormDate");

  if (name) document.getElementById("name").value = name;
  if (date) document.getElementById("date").value = date;
}

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Initialize functionality
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("products")) {
    displayProducts();
  }

  if (document.getElementById("cart-items")) {
    updateCartDisplay();
    handleCheckout();
  }

  if (document.getElementById("order-summary")) {
    loadCheckoutSummary();
  }
});
