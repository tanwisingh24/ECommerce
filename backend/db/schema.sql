-- ============================================
-- E-Commerce Mini Store — MySQL Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS ecommerce_store;
USE ecommerce_store;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ---------- CART ITEMS ----------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  shipping_name VARCHAR(150),
  shipping_address VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_zip VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ---------- SEED DATA ----------
INSERT INTO categories (name) VALUES
  ('Electronics'), ('Clothing'), ('Home & Kitchen'), ('Books'), ('Accessories')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO products (name, description, price, stock, image_url, category_id) VALUES
('Wireless Headphones', 'Over-ear Bluetooth headphones with noise cancellation.', 59.99, 40, 'https://picsum.photos/seed/headphones/400/400', 1),
('Smart Watch', 'Fitness tracking smart watch with heart-rate monitor.', 89.99, 25, 'https://picsum.photos/seed/watch/400/400', 1),
('Cotton T-Shirt', 'Soft 100% cotton crew-neck t-shirt.', 14.99, 100, 'https://picsum.photos/seed/tshirt/400/400', 2),
('Denim Jacket', 'Classic fit denim jacket.', 49.99, 30, 'https://picsum.photos/seed/jacket/400/400', 2),
('Ceramic Mug Set', 'Set of 4 minimalist ceramic mugs.', 22.50, 60, 'https://picsum.photos/seed/mug/400/400', 3),
('Non-stick Pan', '28cm non-stick frying pan.', 27.00, 45, 'https://picsum.photos/seed/pan/400/400', 3),
('The Midnight Library', 'A best-selling novel about choices and regret.', 12.99, 70, 'https://picsum.photos/seed/book1/400/400', 4),
('Atomic Habits', 'A guide to building good habits and breaking bad ones.', 15.99, 80, 'https://picsum.photos/seed/book2/400/400', 4),
('Leather Wallet', 'Slim genuine leather bifold wallet.', 24.99, 55, 'https://picsum.photos/seed/wallet/400/400', 5),
('Sunglasses', 'UV-protected polarized sunglasses.', 19.99, 65, 'https://picsum.photos/seed/sunglasses/400/400', 5)
ON DUPLICATE KEY UPDATE name = name;
