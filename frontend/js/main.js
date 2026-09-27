const grid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const alertBox = document.getElementById('alert-box');
const clearBtn = document.getElementById('clear-filters');

let debounceTimer;

function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert ${type}">${message}</div>`;
  setTimeout(() => { alertBox.innerHTML = ''; }, 3000);
}

function renderProducts(products) {
  if (products.length === 0) {
    grid.innerHTML = `<div class="empty-state">No products found.</div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <a href="product.html?id=${p.id}">
        <img src="${p.image_url || 'https://via.placeholder.com/300'}" alt="${p.name}">
      </a>
      <div class="body">
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <div class="stock">${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</div>
        <div class="actions">
          <button class="btn small add-to-cart" data-id="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });
}

async function addToCart(productId) {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  try {
    await api.post('/cart', { product_id: Number(productId), quantity: 1 });
    showAlert('Added to cart!', 'success');
    refreshCartBadge();
  } catch (err) {
    showAlert(err.message);
  }
}

async function loadCategories() {
  try {
    const data = await api.get('/products/categories/all');
    data.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    });
  } catch (_) { /* non-fatal */ }
}

async function loadProducts() {
  const search = searchInput.value.trim();
  const category = categorySelect.value;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);

  try {
    const data = await api.get(`/products?${params.toString()}`);
    renderProducts(data.products);
  } catch (err) {
    showAlert('Could not load products. Is the backend running?');
  }
}

searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadProducts, 350);
});
categorySelect.addEventListener('change', loadProducts);
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  categorySelect.value = '';
  loadProducts();
});

loadCategories();
loadProducts();
