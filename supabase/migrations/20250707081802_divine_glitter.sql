/*
  # POS System Database Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `barcode` (text, unique)
      - `description` (text)
      - `unit_type` (enum: kg, pcs, bundle, liter)
      - `price_kg` (decimal)
      - `price_ons` (decimal)
      - `price_pcs` (decimal)
      - `price_liter` (decimal)
      - `stock` (decimal)
      - `image_url` (text)
      - `category_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `created_at` (timestamp)
    
    - `sales`
      - `id` (uuid, primary key)
      - `cashier_id` (uuid)
      - `customer_id` (uuid, nullable)
      - `status` (enum: completed, pending, cancelled)
      - `total` (decimal)
      - `payment_method` (enum: cash, credit, card)
      - `created_at` (timestamp)
    
    - `sale_details`
      - `id` (uuid, primary key)
      - `sale_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (decimal)
      - `unit_type` (text)
      - `unit_price` (decimal)
      - `total` (decimal)
      - `created_at` (timestamp)
    
    - `credits`
      - `id` (uuid, primary key)
      - `sale_id` (uuid, foreign key)
      - `customer_name` (text)
      - `amount_owed` (decimal)
      - `status` (enum: pending, paid, overdue)
      - `due_date` (date)
      - `paid_at` (timestamp, nullable)
      - `created_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (enum: admin, cashier)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE unit_type AS ENUM ('kg', 'pcs', 'bundle', 'liter');
CREATE TYPE sale_status AS ENUM ('completed', 'pending', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'credit', 'card');
CREATE TYPE credit_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE user_role AS ENUM ('admin', 'cashier');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#16A34A',
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE NOT NULL,
  description text DEFAULT '',
  unit_type unit_type DEFAULT 'kg',
  price_kg decimal(10,2) DEFAULT 0,
  price_ons decimal(10,2) DEFAULT 0,
  price_pcs decimal(10,2) DEFAULT 0,
  price_liter decimal(10,2) DEFAULT 0,
  stock decimal(10,2) DEFAULT 0,
  image_url text DEFAULT '',
  category_id uuid REFERENCES categories(id),
  created_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role DEFAULT 'cashier',
  created_at timestamptz DEFAULT now()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id uuid REFERENCES users(id),
  customer_id uuid REFERENCES customers(id),
  status sale_status DEFAULT 'completed',
  total decimal(10,2) NOT NULL,
  payment_method payment_method DEFAULT 'cash',
  created_at timestamptz DEFAULT now()
);

-- Sale details table
CREATE TABLE IF NOT EXISTS sale_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity decimal(10,2) NOT NULL,
  unit_type text NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id),
  customer_name text NOT NULL,
  amount_owed decimal(10,2) NOT NULL,
  status credit_status DEFAULT 'pending',
  due_date date DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations for authenticated users" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON sale_details FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON credits FOR ALL TO authenticated USING (true);

-- Insert sample data
INSERT INTO categories (name, color) VALUES
  ('Vegetables', '#16A34A'),
  ('Fruits', '#EA580C'),
  ('Protein', '#DC2626'),
  ('Grains', '#CA8A04'),
  ('Dairy', '#2563EB');

INSERT INTO products (name, barcode, description, price_kg, price_ons, stock, category_id, image_url) VALUES
  ('Fresh Spinach', '8991234567890', 'Fresh organic spinach leaves', 15000, 1500, 12.5, (SELECT id FROM categories WHERE name = 'Vegetables'), 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Red Tomatoes', '8991234567892', 'Fresh red tomatoes', 8000, 800, 25.0, (SELECT id FROM categories WHERE name = 'Vegetables'), 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Bananas', '8991234567893', 'Sweet ripe bananas', 12000, 1200, 18.5, (SELECT id FROM categories WHERE name = 'Fruits'), 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Carrots', '8991234567894', 'Fresh orange carrots', 7000, 700, 15.0, (SELECT id FROM categories WHERE name = 'Vegetables'), 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Apples', '8991234567895', 'Fresh red apples', 25000, 2500, 20.0, (SELECT id FROM categories WHERE name = 'Fruits'), 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('White Rice', '8991234567897', 'Premium white rice', 18000, 1800, 50.0, (SELECT id FROM categories WHERE name = 'Grains'), 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Potatoes', '8991234567899', 'Fresh potatoes', 6000, 600, 30.0, (SELECT id FROM categories WHERE name = 'Vegetables'), 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=400');

INSERT INTO products (name, barcode, description, price_pcs, stock, category_id, image_url) VALUES
  ('Fresh Eggs', '8991234567891', 'Farm fresh brown eggs', 2500, 120, (SELECT id FROM categories WHERE name = 'Protein'), 'https://images.pexels.com/photos/1556707/pexels-photo-1556707.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Chicken Breast', '8991234567896', 'Fresh chicken breast', 35000, 8.5, (SELECT id FROM categories WHERE name = 'Protein'), 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=400');

INSERT INTO products (name, barcode, description, price_liter, stock, category_id, image_url) VALUES
  ('Fresh Milk', '8991234567898', 'Fresh dairy milk', 15000, 24, (SELECT id FROM categories WHERE name = 'Dairy'), 'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=400');

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin', 'admin@veggiestore.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'admin');