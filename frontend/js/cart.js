const itemsBox = document.getElementById('cart-items');
const summaryBox = document.getElementById('cart-summary');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert ${type}">${message}</div>`;
  setTimeout(() => { alertBox.innerHTML = ''; }, 3000);
}

if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html';
}

async function loadCart() {
  try {
    const data = await api.get('/cart');
    renderCart(data.items, data.total);
  } catch (err) {
    showAlert('Could not load your cart.');
  }
}

function renderCart(items, total) {
  if (items.length === 0) {
    itemsBox.innerHTML = `<div class="empty-state">Your cart is empty. <a href="index.html">Go shopping →</a></div>`;
    summaryBox.innerHTML = '';
    return;
  }

  itemsBox.innerHTML = items.map(i => `
    <div class="cart-item">
      <img src="${i.image_url || 'https://via.placeholder.com/64'}" alt="${i.name}">
      <div class="name">${i.name}<br><span style="color:#6b7280;font-weight:400">$${Number(i.price).toFixed(2)} each</span></div>
      <input type="number" class="qty-input" min="1" max="${i.stock}" value="${i.quantity}" data-id="${i.cart_item_id}">
      <div style="width:70px;text-align:right;font-weight:600">$${(i.price * i.quantity).toFixed(2)}</div>
      <button class="btn danger small remove-btn" data-id="${i.cart_item_id}">Remove</button>
    </div>
  `).join('');

  summaryBox.innerHTML = `
    <div class="cart-summary">
      <div class="row"><span>Items</span><span>${items.reduce((s, i) => s + i.quantity, 0)}</span></div>
      <div class="row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      <button class="btn" style="width:100%;margin-top:14px" id="checkout-btn">Proceed to Checkout</button>
    </div>
  `;

  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => updateQty(input.dataset.id, input.value));
  });
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn.dataset.id));
  });
  document.getElementById('checkout-btn').addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
}

async function updateQty(cartItemId, quantity) {
  try {
    await api.put(`/cart/${cartItemId}`, { quantity: Number(quantity) });
    loadCart();
    refreshCartBadge();
  } catch (err) {
    showAlert(err.message);
  }
}

async function removeItem(cartItemId) {
  try {
    await api.del(`/cart/${cartItemId}`);
    loadCart();
    refreshCartBadge();
  } catch (err) {
    showAlert(err.message);
  }
}

loadCart();
