// ---------- Access guard ----------
if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
  window.location.href = 'index.html';
}

const alertBox = document.getElementById('alert-box');
const statGrid = document.getElementById('stat-grid');

function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert ${type}">${message}</div>`;
  setTimeout(() => { alertBox.innerHTML = ''; }, 3000);
}

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['products', 'orders', 'users'].forEach(tab => {
      document.getElementById(`tab-${tab}`).style.display = tab === btn.dataset.tab ? 'block' : 'none';
    });
  });
});

// ---------- Stats ----------
async function loadStats() {
  try {
    const s = await api.get('/admin/stats');
    statGrid.innerHTML = `
      <div class="stat-card"><div class="label">Users</div><div class="value">${s.userCount}</div></div>
      <div class="stat-card"><div class="label">Products</div><div class="value">${s.productCount}</div></div>
      <div class="stat-card"><div class="label">Orders</div><div class="value">${s.orderCount}</div></div>
      <div class="stat-card"><div class="label">Revenue</div><div class="value">$${s.revenue}</div></div>
    `;
  } catch (err) {
    showAlert('Could not load stats.');
  }
}

// ---------- Products ----------
let categoriesCache = [];

async function loadCategoriesForForm() {
  if (categoriesCache.length) return categoriesCache;
  const data = await api.get('/products/categories/all');
  categoriesCache = data.categories;
  return categoriesCache;
}

async function loadAdminProducts() {
  try {
    const data = await api.get('/products');
    const box = document.getElementById('admin-products-table');
    if (data.products.length === 0) {
      box.innerHTML = `<div class="empty-state">No products yet.</div>`;
      return;
    }
    box.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th></th></tr></thead>
        <tbody>
          ${data.products.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>$${Number(p.price).toFixed(2)}</td>
              <td>${p.stock}</td>
              <td>${p.category_name || '—'}</td>
              <td>
                <button class="btn secondary small edit-product-btn" data-id="${p.id}">Edit</button>
                <button class="btn danger small delete-product-btn" data-id="${p.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductForm(data.products.find(p => p.id == btn.dataset.id)));
    });
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  } catch (err) {
    showAlert('Could not load products.');
  }
}

async function openProductForm(product = null) {
  const categories = await loadCategoriesForForm();
  const wrap = document.getElementById('product-form-wrap');

  wrap.innerHTML = `
    <div class="form-card" style="max-width:480px;margin:0 0 20px">
      <h3 style="margin-top:0">${product ? 'Edit Product' : 'New Product'}</h3>
      <form id="product-form">
        <label for="p-name">Name</label>
        <input type="text" id="p-name" value="${product ? product.name.replace(/"/g, '&quot;') : ''}" required>

        <label for="p-desc">Description</label>
        <textarea id="p-desc" rows="3">${product ? (product.description || '') : ''}</textarea>

        <label for="p-price">Price ($)</label>
        <input type="number" id="p-price" step="0.01" min="0" value="${product ? product.price : ''}" required>

        <label for="p-stock">Stock</label>
        <input type="number" id="p-stock" min="0" value="${product ? product.stock : 0}" required>

        <label for="p-image">Image URL</label>
        <input type="text" id="p-image" value="${product ? (product.image_url || '') : ''}">

        <label for="p-category">Category</label>
        <select id="p-category">
          <option value="">None</option>
          ${categories.map(c => `<option value="${c.id}" ${product && product.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>

        <div style="display:flex;gap:10px">
          <button type="submit" class="btn">${product ? 'Save Changes' : 'Create Product'}</button>
          <button type="button" class="btn secondary" id="cancel-form-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('cancel-form-btn').addEventListener('click', () => { wrap.innerHTML = ''; });

  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('p-name').value,
      description: document.getElementById('p-desc').value,
      price: Number(document.getElementById('p-price').value),
      stock: Number(document.getElementById('p-stock').value),
      image_url: document.getElementById('p-image').value,
      category_id: document.getElementById('p-category').value || null
    };
    try {
      if (product) {
        await api.put(`/products/${product.id}`, payload);
        showAlert('Product updated.', 'success');
      } else {
        await api.post('/products', payload);
        showAlert('Product created.', 'success');
      }
      wrap.innerHTML = '';
      loadAdminProducts();
      loadStats();
    } catch (err) {
      showAlert(err.message);
    }
  });
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await api.del(`/products/${id}`);
    showAlert('Product deleted.', 'success');
    loadAdminProducts();
    loadStats();
  } catch (err) {
    showAlert(err.message);
  }
}

document.getElementById('new-product-btn').addEventListener('click', () => openProductForm());

// ---------- Orders ----------
const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

async function loadAdminOrders() {
  try {
    const data = await api.get('/admin/orders');
    const box = document.getElementById('admin-orders-table');
    if (data.orders.length === 0) {
      box.innerHTML = `<div class="empty-state">No orders yet.</div>`;
      return;
    }
    box.innerHTML = `
      <table>
        <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${data.orders.map(o => `
            <tr>
              <td>#${o.id}</td>
              <td>${o.customer_name}<br><span style="color:#6b7280;font-size:0.8rem">${o.customer_email}</span></td>
              <td>${new Date(o.created_at).toLocaleDateString()}</td>
              <td>$${Number(o.total).toFixed(2)}</td>
              <td>
                <select class="status-select" data-id="${o.id}">
                  ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', () => updateOrderStatus(sel.dataset.id, sel.value));
    });
  } catch (err) {
    showAlert('Could not load orders.');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await api.put(`/admin/orders/${orderId}/status`, { status });
    showAlert('Order status updated.', 'success');
  } catch (err) {
    showAlert(err.message);
  }
}

// ---------- Users ----------
async function loadAdminUsers() {
  try {
    const data = await api.get('/admin/users');
    const box = document.getElementById('admin-users-table');
    box.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
        <tbody>
          ${data.users.map(u => `
            <tr>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td>
                <select class="role-select" data-id="${u.id}">
                  <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>customer</option>
                  <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                </select>
              </td>
              <td>${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.querySelectorAll('.role-select').forEach(sel => {
      sel.addEventListener('change', () => updateUserRole(sel.dataset.id, sel.value));
    });
  } catch (err) {
    showAlert('Could not load users.');
  }
}

async function updateUserRole(userId, role) {
  try {
    await api.put(`/admin/users/${userId}/role`, { role });
    showAlert('User role updated.', 'success');
  } catch (err) {
    showAlert(err.message);
  }
}

// ---------- Init ----------
loadStats();
loadAdminProducts();
loadAdminOrders();
loadAdminUsers();
