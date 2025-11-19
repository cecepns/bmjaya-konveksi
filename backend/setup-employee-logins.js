/**
 * Employee Login Setup Script
 * 
 * This script helps setup login credentials for employees.
 * Run this in Node.js after configuring your database connection.
 * 
 * Usage:
 *   node setup-employee-logins.js
 * 
 * Or in a Node REPL:
 *   const bcrypt = require('bcryptjs');
 *   const password = bcrypt.hashSync('password123', 10);
 *   // Then run SQL: UPDATE employees SET username='nama_karyawan', password='hashed_password' WHERE id=1;
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bm_jaya_printing'
};

async function setupEmployeeLogins() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get all employees
    const [employees] = await connection.execute('SELECT id, nama FROM employees WHERE username IS NULL');

    if (employees.length === 0) {
      console.log('✅ All employees already have login credentials!');
      await connection.end();
      return;
    }

    console.log(`Found ${employees.length} employees without login credentials\n`);

    // Suggest default passwords based on employee names
    for (const employee of employees) {
      // Create default password: nama_karyawan + "2024" (lowercase)
      const defaultPassword = `${employee.nama.toLowerCase().replace(/\s+/g, '')}2024`;
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

      await connection.execute(
        'UPDATE employees SET username = ?, password = ?, role = ? WHERE id = ?',
        [employee.nama.toLowerCase().replace(/\s+/g, ''), hashedPassword, 'karyawan', employee.id]
      );

      console.log(`✅ ${employee.nama}`);
      console.log(`   Username: ${employee.nama.toLowerCase().replace(/\s+/g, '')}`);
      console.log(`   Temp Password: ${defaultPassword}`);
      console.log(`   ⚠️  IMPORTANT: Employee harus change password saat first login!\n`);
    }

    console.log('✨ Setup complete! All employees now have login credentials.');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Share credentials with employees securely');
    console.log('2. Advise them to change password on first login');
    console.log('3. Test login with one employee account\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up employee logins:', error.message);
    process.exit(1);
  }
}

// Run setup
setupEmployeeLogins();

/**
 * ALTERNATIVE: Manual SQL Setup
 * 
 * If you want to set passwords manually:
 * 
 * -- First, enable password field updates
 * UPDATE employees SET 
 *   username = LOWER(REPLACE(nama, ' ', '')),
 *   role = 'karyawan'
 * WHERE username IS NULL;
 * 
 * -- Then manually hash passwords:
 * -- For each employee, hash their name + 2024
 * -- Example password hashes (replace with actual hashes):
 * 
 * UPDATE employees SET password = '$2a$10$...' WHERE id = 1;  -- Dede: dede2024
 * UPDATE employees SET password = '$2a$10$...' WHERE id = 2;  -- Ecep: ecep2024
 * -- etc.
 * 
 * Use an online bcrypt tool or Node.js to generate hashes:
 *   bcrypt.hashSync('password123', 10)
 */

