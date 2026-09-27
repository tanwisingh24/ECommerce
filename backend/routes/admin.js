const express = require('express');
const pool = require('../config/db');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/stats — quick dashboard numbers
router.get('/stats', async (req, res) => {
  try {
    const [[{ userCount }]] = await pool.query('SELECT COUNT(*) AS userCount FROM users');
    const [[{ productCount }]] = await pool.query('SELECT COUNT(*) AS productCount FROM products');
    const [[{ orderCount }]] = await pool.query('SELECT COUNT(*) AS orderCount FROM orders');
    const [[{ revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status != 'cancelled'`
    );
    res.json({ userCount, productCount, orderCount, revenue: Number(revenue).toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching stats.' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
});

// PUT /api/admin/users/:id/role — promote/demote a user
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "customer" or "admin".' });
    }
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User role updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating role.' });
  }
});

// GET /api/admin/orders — all orders (with customer name)
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
});

// PUT /api/admin/orders/:id/status — update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${valid.join(', ')}` });
    }
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found.' });
    res.json({ message: 'Order status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating order.' });
  }
});

module.exports = router;
