const detailBox = document.getElementById('product-detail');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert ${type}">${message}</div>`;
  setTimeout(() => { alertBox.innerHTML = ''; }, 3000);
}

function getProductId() {
  return new URLSearchParams(window.location.search).get('id');
}

async function loadProduct() {
  const id = getProductId();
  if (!id) {
    detailBox.innerHTML = `<div class="empty-state">No product specified.</div>`;
    return;
  }
  try {
    const data = await api.get(`/products/${id}`);
    const p = data.product;
    detailBox.innerHTML = `
      <img src="${p.image_url || 'https://via.placeholder.com/400'}" alt="${p.name}">
      <div class="info">
        <h1>${p.name}</h1>
        <div class="price">$${Number(p.price).toFixed(2)}</div>
        <p>${p.description || 'No description available.'}</p>
        <p class="stock">${p.category_name ? `Category: ${p.category_name} · ` : ''}${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</p>
        <label for="qty">Quantity</label>
        <input type="number" id="qty" class="qty-input" value="1" min="1" max="${p.stock}">
        <br>
        <button class="btn" id="add-btn" ${p.stock < 1 ? 'disabled' : ''}>Add to Cart</button>
      </div>
    `;
    document.getElementById('add-btn').addEventListener('click', () => addToCart(p.id));
  } catch (err) {
    detailBox.innerHTML = `<div class="empty-state">Product not found.</div>`;
  }
}

async function addToCart(productId) {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  const qty = Number(document.getElementById('qty').value) || 1;
  try {
    await api.post('/cart', { product_id: productId, quantity: qty });
    showAlert('Added to cart!', 'success');
    refreshCartBadge();
  } catch (err) {
    showAlert(err.message);
  }
}

loadProduct();
