if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html';
}

const ordersBox = document.getElementById('orders-box');
const alertBox = document.getElementById('alert-box');

async function loadOrders() {
  const placedId = new URLSearchParams(window.location.search).get('placed');
  if (placedId) {
    alertBox.innerHTML = `<div class="alert success">Order #${placedId} placed successfully! Thank you for your purchase.</div>`;
  }

  try {
    const data = await api.get('/orders');
    renderOrders(data.orders);
  } catch (err) {
    ordersBox.innerHTML = `<div class="empty-state">Could not load orders.</div>`;
  }
}

function renderOrders(orders) {
  if (orders.length === 0) {
    ordersBox.innerHTML = `<div class="empty-state">You haven't placed any orders yet. <a href="index.html">Start shopping →</a></div>`;
    return;
  }

  ordersBox.innerHTML = `
    <table>
      <thead>
        <tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>#${o.id}</td>
            <td>${new Date(o.created_at).toLocaleDateString()}</td>
            <td>$${Number(o.total).toFixed(2)}</td>
            <td><span class="badge ${o.status}">${o.status}</span></td>
            <td><button class="btn secondary small view-btn" data-id="${o.id}">View Details</button></td>
          </tr>
          <tr id="detail-${o.id}" style="display:none"><td colspan="5"><div id="detail-content-${o.id}"></div></td></tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleDetail(btn.dataset.id));
  });
}

async function toggleDetail(orderId) {
  const row = document.getElementById(`detail-${orderId}`);
  const content = document.getElementById(`detail-content-${orderId}`);

  if (row.style.display === 'table-row') {
    row.style.display = 'none';
    return;
  }

  if (!content.dataset.loaded) {
    try {
      const data = await api.get(`/orders/${orderId}`);
      content.innerHTML = `
        <p><strong>Ship to:</strong> ${data.order.shipping_name}, ${data.order.shipping_address}, ${data.order.shipping_city} ${data.order.shipping_zip}</p>
        <table>
          <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${data.items.map(i => `
              <tr><td>${i.product_name}</td><td>$${Number(i.price).toFixed(2)}</td><td>${i.quantity}</td><td>$${(i.price * i.quantity).toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
      content.dataset.loaded = '1';
    } catch (err) {
      content.innerHTML = `<div class="alert error">Could not load order details.</div>`;
    }
  }
  row.style.display = 'table-row';
}

loadOrders();
