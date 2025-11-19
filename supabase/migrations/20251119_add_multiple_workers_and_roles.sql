-- Add role column to employees table
ALTER TABLE employees ADD COLUMN role ENUM('admin', 'karyawan') DEFAULT 'karyawan' AFTER status;

-- Add login credentials to employees table
ALTER TABLE employees ADD COLUMN username VARCHAR(100) UNIQUE AFTER email;
ALTER TABLE employees ADD COLUMN password VARCHAR(255) AFTER username;

-- Create junction table for multiple employees per production step
CREATE TABLE IF NOT EXISTS production_steps_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  production_step_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (production_step_id) REFERENCES production_steps(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_step_employee (production_step_id, employee_id),
  INDEX idx_production_step_id (production_step_id),
  INDEX idx_employee_id (employee_id)
);

-- Create a view to get employee names for each production step (convenience view)
CREATE OR REPLACE VIEW production_steps_with_employees AS
SELECT 
  ps.id,
  ps.order_id,
  ps.step_number,
  ps.step_name,
  ps.tanggal,
  ps.status,
  ps.catatan,
  ps.berat_sebelum,
  ps.berat_sesudah,
  ps.jenis_jahit,
  ps.harga_jahit,
  ps.photos,
  ps.created_at,
  ps.updated_at,
  GROUP_CONCAT(e.id) as employee_ids,
  GROUP_CONCAT(e.nama) as employee_names
FROM production_steps ps
LEFT JOIN production_steps_employees pse ON ps.id = pse.production_step_id
LEFT JOIN employees e ON pse.employee_id = e.id
GROUP BY ps.id;

-- Update employees table: Migrate existing pic_id to production_steps_employees
-- This assumes pic_id was used to store single employee assignments
INSERT IGNORE INTO production_steps_employees (production_step_id, employee_id)
SELECT id, pic_id FROM production_steps WHERE pic_id IS NOT NULL;

-- Note: Keep pic_id column in production_steps for backward compatibility during transition
-- After frontend is updated to use junction table, pic_id can be removed

