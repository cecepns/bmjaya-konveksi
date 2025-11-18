-- Create production_steps table for tracking production workflow
CREATE TABLE IF NOT EXISTS production_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  step_number INT NOT NULL COMMENT '1=Desain, 2=Potong Kertas, 3=Potong Kain Jersey, 4=Potong Kain Polos, 5=Press Jersey, 6=Sablon, 7=Bordir, 8=Jahit',
  step_name VARCHAR(100) NOT NULL,
  tanggal DATE,
  status ENUM('pending', 'selesai') DEFAULT 'pending',
  catatan LONGTEXT,
  berat_sebelum DECIMAL(10, 2) COMMENT 'For step 3: Potong Kain Jersey',
  berat_sesudah DECIMAL(10, 2) COMMENT 'For step 3: Potong Kain Jersey',
  jenis_jahit VARCHAR(100) COMMENT 'For step 8: Jahit',
  harga_jahit DECIMAL(10, 2) COMMENT 'For step 8: Jahit',
  photos JSON COMMENT 'Array of photo filenames',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_step (order_id, step_number),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status)
);


