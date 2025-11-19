const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'bm-jaya-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads-bmjaya-printing')));

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bm_jaya_printing'
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads-bmjaya-printing'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 }, // 500KB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Login (supports both admin users and employees)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    
    // Try to find user in users table first (admin)
    const [adminUsers] = await connection.execute(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username]
    );

    if (adminUsers.length > 0) {
      const user = adminUsers[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        await connection.end();
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'admin', type: 'admin' },
        JWT_SECRET,
        { expiresIn: '360d' }
      );

      await connection.end();
      return res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, role: 'admin' }
      });
    }

    // Try to find user in employees table (karyawan)
    const [employees] = await connection.execute(
      'SELECT id, nama, username, password, role, email, no_telpon FROM employees WHERE username = ?',
      [username]
    );

    if (employees.length === 0) {
      await connection.end();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const employee = employees[0];
    const isValidPassword = await bcrypt.compare(password, employee.password);

    if (!isValidPassword) {
      await connection.end();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: employee.id, username: employee.username, nama: employee.nama, role: employee.role || 'karyawan', type: 'employee' },
      JWT_SECRET,
      { expiresIn: '360d' }
    );

    await connection.end();
    res.json({
      success: true,
      token,
      user: { 
        id: employee.id, 
        username: employee.username, 
        nama: employee.nama,
        email: employee.email,
        no_telpon: employee.no_telpon,
        role: employee.role || 'karyawan' 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate order number
async function generateOrderNumber() {
  const connection = await mysql.createConnection(dbConfig);
  
  await connection.execute('UPDATE order_counter SET current_number = current_number + 1');
  const [result] = await connection.execute('SELECT current_number FROM order_counter LIMIT 1');
  
  await connection.end();
  
  const number = result[0].current_number;
  return `BM-${String(number).padStart(5, '0')}`;
}

// Create order
app.post('/api/orders', authenticateToken, upload.fields([
  { name: 'desain_file', maxCount: 1 },
  { name: 'pola_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const orderData = req.body;
    const noOrder = await generateOrderNumber();
    
    const desainFile = req.files.desain_file ? req.files.desain_file[0].filename : null;
    const polaFile = req.files.pola_file ? req.files.pola_file[0].filename : null;

    const [result] = await connection.execute(`
      INSERT INTO orders (
        no_order, nama_pemesan, tanggal_order, tanggal_proof, tanggal_selesai,
        model_kerah, bahan, jaitan, jumlah_xs, jumlah_s, jumlah_m, jumlah_l,
        jumlah_xl, jumlah_xxl, jumlah_xxxl, total_order, desain_file,
        pola_file, catatan, deskripsi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      noOrder, orderData.nama_pemesan, orderData.tanggal_order,
      orderData.tanggal_proof || null, orderData.tanggal_selesai || null,
      orderData.model_kerah, orderData.bahan, orderData.jaitan,
      orderData.jumlah_xs || 0, orderData.jumlah_s || 0, orderData.jumlah_m || 0,
      orderData.jumlah_l || 0, orderData.jumlah_xl || 0, orderData.jumlah_xxl || 0,
      orderData.jumlah_xxxl || 0, orderData.total_order, desainFile, polaFile,
      orderData.catatan, orderData.deskripsi
    ]);

    await connection.end();

    res.json({
      success: true,
      message: 'Order created successfully',
      orderId: result.insertId,
      noOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders with pagination and search
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 10;
    const offset = (page - 1) * limit;

    const connection = await mysql.createConnection(dbConfig);
    
    let query = 'SELECT * FROM orders';
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    const params = [];
    
    if (search.trim()) {
      const searchTerm = `%${search}%`;
      query += ' WHERE no_order LIKE ? OR nama_pemesan LIKE ?';
      countQuery += ' WHERE no_order LIKE ? OR nama_pemesan LIKE ?';
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [orders] = await connection.execute(query, params);

    const countParams = search.trim() ? [`%${search}%`, `%${search}%`] : [];
    const [countResult] = await connection.execute(countQuery, countParams);
    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / limit);

    await connection.end();

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalOrders,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [req.params.id]
    );

    await connection.end();

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      order: orders[0]
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order
app.put('/api/orders/:id', authenticateToken, upload.fields([
  { name: 'desain_file', maxCount: 1 },
  { name: 'pola_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const orderData = req.body;
    const orderId = req.params.id;
    
    // Get existing order to handle file updates
    const [existingOrders] = await connection.execute(
      'SELECT desain_file, pola_file FROM orders WHERE id = ?',
      [orderId]
    );

    if (existingOrders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const existingOrder = existingOrders[0];
    
    let desainFile = existingOrder.desain_file;
    let polaFile = existingOrder.pola_file;

    // Handle new file uploads
    if (req.files.desain_file) {
      desainFile = req.files.desain_file[0].filename;
      // Delete old file if exists
      if (existingOrder.desain_file) {
        try {
          await fs.unlink(path.join(__dirname, 'uploads-bmjaya-printing', existingOrder.desain_file));
        } catch (err) {
          console.log('Error deleting old desain file:', err);
        }
      }
    }

    if (req.files.pola_file) {
      polaFile = req.files.pola_file[0].filename;
      // Delete old file if exists
      if (existingOrder.pola_file) {
        try {
          await fs.unlink(path.join(__dirname, 'uploads-bmjaya-printing', existingOrder.pola_file));
        } catch (err) {
          console.log('Error deleting old pola file:', err);
        }
      }
    }

    await connection.execute(`
      UPDATE orders SET 
        nama_pemesan = ?, tanggal_order = ?, tanggal_proof = ?, tanggal_selesai = ?,
        model_kerah = ?, bahan = ?, jaitan = ?, jumlah_xs = ?, jumlah_s = ?, 
        jumlah_m = ?, jumlah_l = ?, jumlah_xl = ?, jumlah_xxl = ?, jumlah_xxxl = ?,
        total_order = ?, desain_file = ?, pola_file = ?, catatan = ?, deskripsi = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      orderData.nama_pemesan, orderData.tanggal_order,
      orderData.tanggal_proof || null, orderData.tanggal_selesai || null,
      orderData.model_kerah, orderData.bahan, orderData.jaitan,
      orderData.jumlah_xs || 0, orderData.jumlah_s || 0, orderData.jumlah_m || 0,
      orderData.jumlah_l || 0, orderData.jumlah_xl || 0, orderData.jumlah_xxl || 0,
      orderData.jumlah_xxxl || 0, orderData.total_order, desainFile, polaFile,
      orderData.catatan, orderData.deskripsi, orderId
    ]);

    await connection.end();

    res.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get order files to delete them
    const [orders] = await connection.execute(
      'SELECT desain_file, pola_file FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    // Delete order from database
    await connection.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    await connection.end();

    // Delete files if they exist
    if (order.desain_file) {
      try {
        await fs.unlink(path.join(__dirname, 'uploads-bmjaya-printing', order.desain_file));
      } catch (err) {
        console.log('Error deleting desain file:', err);
      }
    }

    if (order.pola_file) {
      try {
        await fs.unlink(path.join(__dirname, 'uploads-bmjaya-printing', order.pola_file));
      } catch (err) {
        console.log('Error deleting pola file:', err);
      }
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [totalOrdersResult] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    const [todayOrdersResult] = await connection.execute('SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = CURDATE()');
    const [pendingOrdersResult] = await connection.execute('SELECT COUNT(*) as total FROM orders WHERE tanggal_selesai IS NULL');
    const [completedOrdersResult] = await connection.execute('SELECT COUNT(*) as total FROM orders WHERE tanggal_selesai IS NOT NULL');

    await connection.end();

    res.json({
      success: true,
      stats: {
        totalOrders: totalOrdersResult[0].total,
        todayOrders: todayOrdersResult[0].total,
        pendingOrders: pendingOrdersResult[0].total,
        completedOrders: completedOrdersResult[0].total
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Employee Management Routes

// Get all employees with pagination and search
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const limit = 10;
    const offset = (page - 1) * limit;

    const connection = await mysql.createConnection(dbConfig);
    
    let query = 'SELECT * FROM employees';
    let countQuery = 'SELECT COUNT(*) as total FROM employees';
    const params = [];
    
    // Add search filter if provided
    if (search.trim()) {
      const searchTerm = `%${search}%`;
      query += ' WHERE nama LIKE ? OR no_telpon LIKE ? OR email LIKE ?';
      countQuery += ' WHERE nama LIKE ? OR no_telpon LIKE ? OR email LIKE ?';
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY nama ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [employees] = await connection.execute(query, params);

    const countParams = search.trim() ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const [countResult] = await connection.execute(countQuery, countParams);
    const totalEmployees = countResult[0].total;
    const totalPages = Math.ceil(totalEmployees / limit);

    await connection.end();

    res.json({
      success: true,
      employees,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalEmployees,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new employee
app.post('/api/employees', authenticateToken, async (req, res) => {
  try {
    const { nama, no_telpon, email, alamat, status } = req.body;
    
    if (!nama) {
      return res.status(400).json({ message: 'Nama karyawan harus diisi' });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    const [result] = await connection.execute(
      'INSERT INTO employees (nama, no_telpon, email, alamat, status) VALUES (?, ?, ?, ?, ?)',
      [nama, no_telpon || null, email || null, alamat || null, status || 'aktif']
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Karyawan berhasil ditambahkan',
      employeeId: result.insertId
    });
  } catch (error) {
    console.error('Create employee error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nama karyawan sudah terdaftar' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { nama, no_telpon, email, alamat, status } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute(
      'UPDATE employees SET nama = ?, no_telpon = ?, email = ?, alamat = ?, status = ? WHERE id = ?',
      [nama, no_telpon || null, email || null, alamat || null, status || 'aktif', req.params.id]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Karyawan berhasil diupdate'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [result] = await connection.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Karyawan tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Karyawan berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Production Steps Routes

// Initialize production steps for an order
app.post('/api/orders/:orderId/production/init', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    // Define all 9 production steps (including Packing & QC)
    const steps = [
      { step_number: 1, step_name: 'Desain' },
      { step_number: 2, step_name: 'Potong Kertas' },
      { step_number: 3, step_name: 'Potong Kain Jersey' },
      { step_number: 4, step_name: 'Potong Kain Polos' },
      { step_number: 5, step_name: 'Press Jersey' },
      { step_number: 6, step_name: 'Sablon' },
      { step_number: 7, step_name: 'Bordir' },
      { step_number: 8, step_name: 'Jahit' },
      { step_number: 9, step_name: 'Packing & QC' }
    ];

    // Check if order exists
    const [orders] = await connection.execute('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Initialize steps if not already created
    for (const step of steps) {
      await connection.execute(
        `INSERT IGNORE INTO production_steps (order_id, step_number, step_name, status, photos)
         VALUES (?, ?, ?, 'pending', JSON_ARRAY())`,
        [orderId, step.step_number, step.step_name]
      );
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Production steps initialized'
    });
  } catch (error) {
    console.error('Production init error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all production steps for an order (with employee details)
app.get('/api/orders/:orderId/production', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    const [steps] = await connection.execute(
      `SELECT ps.*, 
              GROUP_CONCAT(CONCAT(e.id, ':', e.nama) SEPARATOR '|') as employees_data
       FROM production_steps ps
       LEFT JOIN production_steps_employees pse ON ps.id = pse.production_step_id
       LEFT JOIN employees e ON pse.employee_id = e.id
       WHERE ps.order_id = ? 
       GROUP BY ps.id
       ORDER BY ps.step_number ASC`,
      [orderId]
    );

    // Transform employees_data into array format
    const stepsWithEmployees = steps.map(step => ({
      ...step,
      employees: step.employees_data 
        ? step.employees_data.split('|').map(emp => {
            const [id, nama] = emp.split(':');
            return { id: parseInt(id), nama };
          })
        : []
    }));

    await connection.end();

    res.json({
      success: true,
      steps: stepsWithEmployees
    });
  } catch (error) {
    console.error('Get production steps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single production step (with employees)
app.get('/api/orders/:orderId/production/:stepNumber', authenticateToken, async (req, res) => {
  try {
    const { orderId, stepNumber } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    const [steps] = await connection.execute(
      `SELECT ps.*, 
              GROUP_CONCAT(CONCAT(e.id, ':', e.nama) SEPARATOR '|') as employees_data
       FROM production_steps ps
       LEFT JOIN production_steps_employees pse ON ps.id = pse.production_step_id
       LEFT JOIN employees e ON pse.employee_id = e.id
       WHERE ps.order_id = ? AND ps.step_number = ?
       GROUP BY ps.id`,
      [orderId, stepNumber]
    );

    await connection.end();

    if (steps.length === 0) {
      return res.status(404).json({ message: 'Production step not found' });
    }

    const step = steps[0];
    step.employees = step.employees_data 
      ? step.employees_data.split('|').map(emp => {
          const [id, nama] = emp.split(':');
          return { id: parseInt(id), nama };
        })
      : [];

    res.json({
      success: true,
      step
    });
  } catch (error) {
    console.error('Get production step error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update production step (supports multiple employees)
app.put('/api/orders/:orderId/production/:stepNumber', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    const { orderId, stepNumber } = req.params;
    const { tanggal, status, catatan, berat_sebelum, berat_sesudah, jenis_jahit, harga_jahit, employee_ids, deletePhotos } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    // Get existing step
    const [existingSteps] = await connection.execute(
      `SELECT id, photos FROM production_steps WHERE order_id = ? AND step_number = ?`,
      [orderId, stepNumber]
    );

    if (existingSteps.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Production step not found' });
    }

    const stepId = existingSteps[0].id;
    let photos = existingSteps[0].photos ? JSON.parse(existingSteps[0].photos) : [];

    // Handle new photos
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => file.filename);
      photos = [...photos, ...newPhotos];
    }

    // Handle deleted photos
    if (deletePhotos) {
      const photosToDelete = Array.isArray(deletePhotos) ? deletePhotos : [deletePhotos];
      for (const photo of photosToDelete) {
        try {
          await fs.unlink(path.join(__dirname, 'uploads-bmjaya-printing', photo));
        } catch (err) {
          console.log('Error deleting photo:', err);
        }
      }
      photos = photos.filter(p => !photosToDelete.includes(p));
    }

    // Update step
    await connection.execute(
      `UPDATE production_steps SET
        tanggal = ?,
        status = ?,
        catatan = ?,
        berat_sebelum = ?,
        berat_sesudah = ?,
        jenis_jahit = ?,
        harga_jahit = ?,
        photos = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ? AND step_number = ?`,
      [
        tanggal || null,
        status || 'pending',
        catatan || null,
        berat_sebelum || null,
        berat_sesudah || null,
        jenis_jahit || null,
        harga_jahit || null,
        JSON.stringify(photos),
        orderId,
        stepNumber
      ]
    );

    // Update employee assignments if provided
    if (employee_ids) {
      const empIds = Array.isArray(employee_ids) ? employee_ids : [employee_ids];
      
      // Delete existing assignments
      await connection.execute(
        'DELETE FROM production_steps_employees WHERE production_step_id = ?',
        [stepId]
      );

      // Insert new assignments
      for (const empId of empIds) {
        if (empId) {
          await connection.execute(
            'INSERT INTO production_steps_employees (production_step_id, employee_id) VALUES (?, ?)',
            [stepId, empId]
          );
        }
      }
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Production step updated successfully'
    });
  } catch (error) {
    console.error('Update production step error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete production step photo
app.delete('/api/orders/:orderId/production/:stepNumber/photo/:photoName', authenticateToken, async (req, res) => {
  try {
    const { orderId, stepNumber, photoName } = req.params;
    const connection = await mysql.createConnection(dbConfig);

    // Get current photos
    const [steps] = await connection.execute(
      `SELECT photos FROM production_steps WHERE order_id = ? AND step_number = ?`,
      [orderId, stepNumber]
    );

    if (steps.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Production step not found' });
    }

    let photos = steps[0].photos ? JSON.parse(steps[0].photos) : [];
    photos = photos.filter(p => p !== photoName);

    // Update photos
    await connection.execute(
      `UPDATE production_steps SET photos = ?, updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ? AND step_number = ?`,
      [JSON.stringify(photos), orderId, stepNumber]
    );

    await connection.end();

    // Delete file
    try {
      await fs.unlink(path.join(__dirname, 'uploads-bmjaya-printing', photoName));
    } catch (err) {
      console.log('Error deleting photo file:', err);
    }

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});