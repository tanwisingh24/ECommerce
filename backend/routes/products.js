const express = require('express');
const pool = require('../config/db');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();

// GET /api/products  (public, supports ?search=&category=)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let sql = `SELECT p.*, c.name AS category_name FROM products p
               LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }
    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching products.' });
  }
});

// GET /api/products/categories  (public) — placed before /:id so it isn't shadowed
router.get('/categories/all', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
});

// GET /api/products/:id  (public)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching product.' });
  }
});

// POST /api/products  (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, image_url, category_id } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO products (name, description, price, stock, image_url, category_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, price, stock || 0, image_url || null, category_id || null]
    );
    res.status(201).json({ message: 'Product created.', productId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating product.' });
  }
});

// PUT /api/products/:id  (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, image_url, category_id } = req.body;
    const [result] = await pool.query(
      `UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, category_id=?
       WHERE id=?`,
      [name, description || null, price, stock, image_url || null, category_id || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating product.' });
  }
});

// DELETE /api/products/:id  (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting product.' });
  }
});

module.exports = router;
