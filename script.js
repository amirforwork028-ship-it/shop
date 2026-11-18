const products = [
  { id: 1, name: "iPhone 15", category: "Смартфоны", price: 329990, tag: "ПОПУЛЯРНОЕ", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=700&q=80" },
  { id: 2, name: "Sony WH-1000XM5", category: "Наушники", price: 189990, tag: "ХИТ", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80" },
  { id: 3, name: "MacBook Air M2", category: "Ноутбуки", price: 549990, tag: "ВЫБОР SHOPLY", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80" },
  { id: 4, name: "Apple Watch Series 9", category: "Часы", price: 169990, tag: "", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=700&q=80" },
  { id: 5, name: "iPad Air", category: "Аксессуары", price: 299990, tag: "НОВИНКА", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80" },
  { id: 6, name: "JBL Flip 6", category: "Аксессуары", price: 59990, tag: "", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=80" },
  { id: 7, name: "AirPods Pro", category: "Наушники", price: 119990, tag: "ПОПУЛЯРНОЕ", image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80" },
  { id: 8, name: "Samsung Galaxy S24", category: "Смартфоны", price: 379990, tag: "", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=700&q=80" }
];

const money = value => new Intl.NumberFormat("ru-RU").format(value) + " ₸";
const readStorage = key => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};

let cart = readStorage("shoply-cart");
let favorites = readStorage("shoply-favorites");
let activeCategory = "Все";
let searchQuery = "";
let showFavoritesOnly = false;

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const toast = document.getElementById("toast");

function saveState() {
  localStorage.setItem("shoply-cart", JSON.stringify(cart));
  localStorage.setItem("shoply-favorites", JSON.stringify(favorites));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function getVisibleProducts() {
  let visible = products.filter(product => {
    const matchesCategory = activeCategory === "Все" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery);
    const matchesFavorites = !showFavoritesOnly || favorites.includes(product.id);
    return matchesCategory && matchesSearch && matchesFavorites;
  });

  if (sortSelect.value === "price-asc") visible.sort((a, b) => a.price - b.price);
  if (sortSelect.value === "price-desc") visible.sort((a, b) => b.price - a.price);
  if (sortSelect.value === "name") visible.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return visible;
}

function renderProducts() {
  const visible = getVisibleProducts();
  productGrid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ""}
        <button class="favorite-button ${favorites.includes(product.id) ? "active" : ""}"
          data-favorite="${product.id}" aria-label="${favorites.includes(product.id) ? "Убрать из избранного" : "Добавить в избранное"}">
          ${favorites.includes(product.id) ? "♥" : "♡"}
        </button>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-bottom">
          <span class="product-price">${money(product.price)}</span>
          <button class="add-button" data-add="${product.id}">В корзину +</button>
        </div>
      </div>
    </article>
  `).join("");

  resultsCount.textContent = `Найдено товаров: ${visible.length}`;
  emptyState.classList.toggle("hidden", visible.length !== 0);
  productGrid.classList.toggle("hidden", visible.length === 0);
  document.getElementById("favoritesCount").textContent = favorites.length;
}

function updateHeaderCounters() {
  document.getElementById("cartCount").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("favoritesCount").textContent = favorites.length;
  document.getElementById("drawerCartCount").textContent = `(${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
}

function addToCart(id) {
  const item = cart.find(product => product.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveState();
  updateHeaderCounters();
  renderCart();
  showToast("Товар добавлен в корзину");
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(itemId => itemId !== id);
    showToast("Удалено из избранного");
  } else {
    favorites.push(id);
    showToast("Добавлено в избранное");
  }
  saveState();
  renderProducts();
  updateHeaderCounters();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">Ваша корзина пока пуста.<br>Добавьте товары из каталога.</div>';
  } else {
    cartItems.innerHTML = cart.map(item => {
      const product = products.find(product => product.id === item.id);
      if (!product) return "";
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h4>${product.name}</h4>
            <p>${money(product.price)}</p>
            <div class="quantity-controls">
              <button data-quantity="${product.id}" data-change="-1" aria-label="Уменьшить количество">−</button>
              <span>${item.quantity}</span>
              <button data-quantity="${product.id}" data-change="1" aria-label="Увеличить количество">+</button>
            </div>
          </div>
          <button class="remove-item" data-remove="${product.id}" aria-label="Удалить ${product.name}">×</button>
        </div>
      `;
    }).join("");
  }

  const total = cart.reduce((sum, item) => {
    const product = products.find(product => product.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  document.getElementById("cartTotal").textContent = money(total);
  updateHeaderCounters();
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.classList.remove("hidden");
  document.getElementById("closeCartButton").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.classList.add("hidden");
  document.getElementById("cartButton").focus();
}

productGrid.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest("[data-favorite]");
  if (addButton) addToCart(Number(addButton.dataset.add));
  if (favoriteButton) toggleFavorite(Number(favoriteButton.dataset.favorite));
});

document.getElementById("categoryList").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll(".category-chip").forEach(chip =>
    chip.classList.toggle("active", chip === button)
  );
  showFavoritesOnly = false;
  renderProducts();
});

searchInput.addEventListener("input", event => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderProducts();
});

sortSelect.addEventListener("change", renderProducts);

document.getElementById("clearFiltersButton").addEventListener("click", resetFilters);
document.getElementById("emptyResetButton").addEventListener("click", resetFilters);

function resetFilters() {
  activeCategory = "Все";
  searchQuery = "";
  showFavoritesOnly = false;
  searchInput.value = "";
  sortSelect.value = "default";
  document.querySelectorAll(".category-chip").forEach(chip =>
    chip.classList.toggle("active", chip.dataset.category === "Все")
  );
  renderProducts();
}

document.getElementById("favoritesButton").addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  activeCategory = "Все";
  document.querySelectorAll(".category-chip").forEach(chip =>
    chip.classList.toggle("active", chip.dataset.category === "Все")
  );
  renderProducts();
  document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  showToast(showFavoritesOnly ? "Показаны избранные товары" : "Показаны все товары");
});

document.getElementById("cartButton").addEventListener("click", openCart);
document.getElementById("closeCartButton").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.getElementById("cartItems").addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    const id = Number(quantityButton.dataset.quantity);
    const change = Number(quantityButton.dataset.change);
    const item = cart.find(product => product.id === id);
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) cart = cart.filter(product => product.id !== id);
    }
  }

  if (removeButton) {
    const id = Number(removeButton.dataset.remove);
    cart = cart.filter(product => product.id !== id);
    showToast("Товар удалён из корзины");
  }

  saveState();
  renderCart();
});

document.getElementById("checkoutButton").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Сначала добавьте товары в корзину");
    return;
  }
  showToast("Оформление заказа будет добавлено на следующем этапе");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && cartDrawer.classList.contains("open")) closeCart();
});

renderProducts();
renderCart();


// Демонстрационная авторизация. Для настоящих аккаунтов нужен сервер и база данных.
const authModal = document.getElementById("authModal");
const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
let authMode = "login";
let currentUser = null;

function getAuthUsers() {
  try { return JSON.parse(localStorage.getItem("shoply-users")) || []; }
  catch { return []; }
}
function getAuthSession() {
  try { return JSON.parse(localStorage.getItem("shoply-session")) || null; }
  catch { return null; }
}
function updateAuthHeader() {
  const label = document.getElementById("authButtonLabel");
  const button = document.getElementById("authButton");
  label.textContent = currentUser ? (currentUser.name || "Профиль") : "Войти";
  button.setAttribute("aria-label", currentUser ? "Выйти из аккаунта" : "Войти в аккаунт");
  button.title = currentUser ? "Нажмите, чтобы выйти" : "Войти в аккаунт";
}
function openAuth(mode = "login") {
  setAuthMode(mode);
  authModal.classList.remove("hidden");
  authOverlay.classList.remove("hidden");
  authEmail.focus();
}
function closeAuth() {
  authModal.classList.add("hidden");
  authOverlay.classList.add("hidden");
  authForm.reset();
  authMessage.textContent = "";
}
function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  document.querySelectorAll("[data-auth-mode]").forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === mode));
  document.getElementById("authTitle").textContent = isRegister ? "Создать аккаунт" : "Добро пожаловать";
  document.getElementById("authSubtitle").textContent = isRegister ? "Заполните форму, чтобы зарегистрироваться в Shoply." : "Войдите или создайте аккаунт Shoply.";
  document.getElementById("nameField").classList.toggle("hidden", !isRegister);
  authName.required = isRegister;
  authPassword.autocomplete = isRegister ? "new-password" : "current-password";
  document.getElementById("authSubmit").innerHTML = isRegister ? 'Зарегистрироваться <span>→</span>' : 'Войти <span>→</span>';
  authMessage.textContent = "";
  authMessage.classList.remove("success");
}
async function passwordDigest(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}
authForm.addEventListener("submit", async event => {
  event.preventDefault();
  authMessage.classList.remove("success");
  authMessage.textContent = "";
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const users = getAuthUsers();
  const submit = document.getElementById("authSubmit");
  submit.disabled = true;
  try {
    const passwordHash = await passwordDigest(password);
    if (authMode === "register") {
      const name = authName.value.trim();
      if (name.length < 2) throw new Error("Введите имя (не менее 2 символов).");
      if (users.some(user => user.email === email)) throw new Error("Аккаунт с такой почтой уже существует. Войдите.");
      users.push({ name, email, passwordHash });
      localStorage.setItem("shoply-users", JSON.stringify(users));
      currentUser = { name, email };
      localStorage.setItem("shoply-session", JSON.stringify(currentUser));
      closeAuth();
      updateAuthHeader();
      showToast("Регистрация прошла успешно!");
    } else {
      const user = users.find(item => item.email === email && item.passwordHash === passwordHash);
      if (!user) throw new Error("Неверная почта или пароль.");
      currentUser = { name: user.name, email: user.email };
      localStorage.setItem("shoply-session", JSON.stringify(currentUser));
      closeAuth();
      updateAuthHeader();
      showToast(`С возвращением, ${user.name}!`);
    }
  } catch (error) {
    authMessage.textContent = error.message || "Не удалось выполнить действие. Попробуйте ещё раз.";
  } finally {
    submit.disabled = false;
  }
});
document.getElementById("authButton").addEventListener("click", () => {
  if (currentUser) {
    localStorage.removeItem("shoply-session");
    currentUser = null;
    updateAuthHeader();
    showToast("Вы вышли из аккаунта");
  } else openAuth("login");
});
document.getElementById("authClose").addEventListener("click", closeAuth);
authOverlay.addEventListener("click", closeAuth);
document.querySelectorAll("[data-auth-mode]").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
document.addEventListener("keydown", event => { if (event.key === "Escape" && !authModal.classList.contains("hidden")) closeAuth(); });
currentUser = getAuthSession();
if (currentUser) {
  const existingUser = getAuthUsers().find(user => user.email === currentUser.email);
  if (!existingUser) { currentUser = null; localStorage.removeItem("shoply-session"); }
}
updateAuthHeader();
