const Auth = {
  getToken() { return localStorage.getItem('token'); },
  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() { const u = this.getUser(); return !!u && u.role === 'admin'; },
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
};

/** Renders the shared header/nav into <header id="site-header"> on every page. */
function renderNav() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const user = Auth.getUser();
  const cartCount = localStorage.getItem('cartCount') || '';

  let links = `
    <a href="index.html">Shop</a>
  `;

  if (user) {
    links += `<a href="cart.html">Cart${cartCount ? ` <span class="cart-badge">${cartCount}</span>` : ''}</a>`;
    links += `<a href="orders.html">My Orders</a>`;
    if (user.role === 'admin') links += `<a href="admin.html">Admin</a>`;
    links += `<a href="#" id="logout-link">Logout (${user.name})</a>`;
  } else {
    links += `<a href="cart.html">Cart</a>`;
    links += `<a href="login.html">Login</a>`;
    links += `<a href="register.html">Register</a>`;
  }

  header.innerHTML = `
    <div class="nav-wrap">
      <a class="brand" href="index.html">🛍️ MiniStore</a>
      <nav class="nav-links">${links}</nav>
    </div>
  `;

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); });
  }
}

/** Refreshes the cart-count badge by querying the server (only if logged in). */
async function refreshCartBadge() {
  if (!Auth.isLoggedIn()) return;
  try {
    const data = await api.get('/cart');
    const count = data.items.reduce((sum, i) => sum + i.quantity, 0);
    localStorage.setItem('cartCount', count > 0 ? String(count) : '');
    renderNav();
  } catch (_) { /* ignore — e.g. expired token */ }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  refreshCartBadge();
});
