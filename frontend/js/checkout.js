if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html';
}

const alertBox = document.getElementById('alert-box');
const payBtn = document.getElementById('pay-btn');

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.innerHTML = '';
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';

  try {
    const data = await api.post('/orders', {
      shipping_name: document.getElementById('shipping_name').value,
      shipping_address: document.getElementById('shipping_address').value,
      shipping_city: document.getElementById('shipping_city').value,
      shipping_zip: document.getElementById('shipping_zip').value,
      card_number: document.getElementById('card_number').value
    });

    localStorage.setItem('cartCount', '');
    window.location.href = `orders.html?placed=${data.orderId}`;
  } catch (err) {
    alertBox.innerHTML = `<div class="alert error">${err.message}</div>`;
    payBtn.disabled = false;
    payBtn.textContent = 'Place Order';
  }
});
