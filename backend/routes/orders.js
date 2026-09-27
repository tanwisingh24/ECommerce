const express = require('express');
const pool = require('../config/db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/orders — checkout: turns the user's cart into an order
// (Payment is simulated — no real payment gateway is integrated.)
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { shipping_name, shipping_address, shipping_city, shipping_zip, card_number } = req.body;

    if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip) {
      connection.release();
      return res.status(400).json({ message: 'Complete shipping details are required.' });
    }
    // Very light "fake payment" validation — just checks a card-like number was provided.
    if (!card_number || card_number.replace(/\s/g, '').length < 12) {
      connection.release();
      return res.status(400).json({ message: 'A valid card number is required (simulated payment).' });
    }

    await connection.beginTransaction();

    const [cartRows] = await connection.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ? FOR UPDATE`,
      [req.user.id]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    for (const item of cartRows) {
      if (item.quantity > item.stock) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: `Not enough stock for "${item.name}".` });
      }
    }

    const total = cartRows.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total, status, shipping_name, shipping_address, shipping_city, shipping_zip)
       VALUES (?, ?, 'paid', ?, ?, ?, ?)`,
      [req.user.id, total, shipping_name, shipping_address, shipping_city, shipping_zip]
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await connection.commit();
    connection.release();

    res.status(201).json({ message: 'Order placed successfully.', orderId, total: Number(total.toFixed(2)) });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    res.status(500).json({ message: 'Server error during checkout.' });
  }
});

// GET /api/orders — logged-in user's own order history
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
});

// GET /api/orders/:id — one order with its items (must belong to the user)
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found.' });

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ order: orders[0], items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching order.' });
  }
});

module.exports = router;
