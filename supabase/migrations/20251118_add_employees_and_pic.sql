-- Create employees table for employee management
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  no_telpon VARCHAR(15),
  email VARCHAR(100),
  alamat LONGTEXT,
  status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nama (nama),
  INDEX idx_status (status)
);

-- Add pic_id column to production_steps table
ALTER TABLE production_steps 
ADD COLUMN pic_id INT AFTER step_name;

-- Add foreign key constraint
ALTER TABLE production_steps 
ADD CONSTRAINT fk_production_steps_pic_id FOREIGN KEY (pic_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Insert initial employees data
INSERT INTO employees (nama, status) VALUES
('Dede', 'aktif'),
('Ecep', 'aktif'),
('Ade', 'aktif'),
('Anton', 'aktif'),
('Bi Nia', 'aktif'),
('Mah Arul', 'aktif'),
('Anca', 'aktif'),
('Dimas', 'aktif'),
('Tomi', 'aktif'),
('Fajrul', 'aktif'),
('Roni', 'aktif'),
('Ukon', 'aktif'),
('Oki', 'aktif'),
('Agus', 'aktif'),
('Ujang Kewen', 'aktif');

