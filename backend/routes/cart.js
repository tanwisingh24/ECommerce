const express = require('express');
const pool = require('../config/db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate); // every cart route requires login

// GET /api/cart — current user's cart with product details
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price,
              p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    const total = rows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    res.json({ items: rows, total: Number(total.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching cart.' });
  }
});

// POST /api/cart — add item (or increase quantity if it exists)
router.post('/', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const qty = Number(quantity) || 1;

    if (!product_id) return res.status(400).json({ message: 'product_id is required.' });

    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) return res.status(404).json({ message: 'Product not found.' });

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, product_id, qty]
    );

    res.status(201).json({ message: 'Added to cart.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding to cart.' });
  }
});

// PUT /api/cart/:cartItemId — update quantity
router.put('/:cartItemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }
    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.cartItemId, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cart item not found.' });
    res.json({ message: 'Cart updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating cart.' });
  }
});

// DELETE /api/cart/:cartItemId — remove item
router.delete('/:cartItemId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.cartItemId, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cart item not found.' });
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing cart item.' });
  }
});

// DELETE /api/cart — clear entire cart
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error clearing cart.' });
  }
});

module.exports = router;
