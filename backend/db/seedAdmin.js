// Creates (or resets) a demo admin account: admin@ministore.com / admin123
// Run with: node db/seedAdmin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedAdmin() {
  const email = 'admin@ministore.com';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (existing.length > 0) {
    await pool.query('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [passwordHash, 'admin', email]);
    console.log(`Admin account reset: ${email} / ${password}`);
  } else {
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Admin', email, passwordHash, 'admin']
    );
    console.log(`Admin account created: ${email} / ${password}`);
  }

  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
