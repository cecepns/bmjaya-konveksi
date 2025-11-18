-- Database: bm_jaya_printing
CREATE DATABASE IF NOT EXISTS bm_jaya_printing;
USE bm_jaya_printing;

-- Table: users (for admin login)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Table: orders
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no_order VARCHAR(50) NOT NULL UNIQUE,
    nama_pemesan VARCHAR(255) NOT NULL,
    tanggal_order DATE NOT NULL,
    tanggal_proof DATE,
    tanggal_selesai DATE,
    model_kerah VARCHAR(100),
    bahan VARCHAR(100),
    jaitan VARCHAR(100),
    jumlah_xs INT DEFAULT 0,
    jumlah_s INT DEFAULT 0,
    jumlah_m INT DEFAULT 0,
    jumlah_l INT DEFAULT 0,
    jumlah_xl INT DEFAULT 0,
    jumlah_xxl INT DEFAULT 0,
    jumlah_xxxl INT DEFAULT 0,
    total_order INT NOT NULL,
    desain_file VARCHAR(255),
    pola_file VARCHAR(255),
    catatan TEXT,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: order_counter (for auto increment order number)
CREATE TABLE order_counter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current_number INT DEFAULT 0
);

-- Insert initial counter
INSERT INTO order_counter (current_number) VALUES (0);