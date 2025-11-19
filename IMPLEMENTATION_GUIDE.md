# BM Jaya Printing - Implementation Guide

## Recent Updates Summary

### 1. ✅ Bug Fix: AsyncSelect Employee Selection (ProductionTab.jsx)
**Issue:** User selection was not persisting when selected.
**Solution:**
- Changed from single-select to multi-select AsyncSelect component
- Fixed the issue by properly mapping employee data from `employees` array returned by API
- Now properly displays and persists selected employees

### 2. ✅ Multiple Workers Support
**Changes:**
- Created new migration: `20251119_add_multiple_workers_and_roles.sql`
- New table: `production_steps_employees` (junction table)
  - Links production steps to multiple employees
  - Supports many-to-many relationships
  
**Database Structure:**
```sql
production_steps_employees
├── id (PRIMARY KEY)
├── production_step_id (FK → production_steps)
├── employee_id (FK → employees)
└── assigned_at (TIMESTAMP)
```

**API Changes:**
- `/api/orders/:orderId/production` - Now returns employee array
- `/api/orders/:orderId/production/:stepNumber` - Returns employees array with id and nama
- `PUT /api/orders/:orderId/production/:stepNumber` - Accepts `employee_ids[]` for bulk assignment

**Frontend Changes:**
- ProductionTab now uses multi-select AsyncSelect
- `handleEmployeeChange()` function manages multiple employee selection
- `handleSaveStep()` sends employee_ids array to backend

### 3. ✅ Role-Based Access Control System
**New Features:**
- **Employee Login:** Karyawan dapat login menggunakan credentials dari tabel `employees`
- **Admin Login:** Admin tetap login menggunakan tabel `users`
- **Role-Based Menu:** Menu ditampilkan sesuai role
  - Admin: Lihat Dashboard, Kelola Pesanan, Manajemen Karyawan
  - Karyawan: Lihat Pesanan Saya, Kelola Pesanan

**Database Changes:**
```sql
-- Added to employees table:
ALTER TABLE employees ADD COLUMN role ENUM('admin', 'karyawan') DEFAULT 'karyawan';
ALTER TABLE employees ADD COLUMN username VARCHAR(100) UNIQUE;
ALTER TABLE employees ADD COLUMN password VARCHAR(255);
```

**Login Endpoint (`/api/login`):**
- First checks `users` table for admin login
- Then checks `employees` table for karyawan login
- Returns appropriate user data including:
  - `role`: 'admin' atau 'karyawan'
  - `type`: 'admin' atau 'employee'
  - For karyawan: includes `nama`, `email`, `no_telpon`

### 4. ✅ Route Protection
**Protected Routes:**
- `/employees` - Only accessible by admin (requireAdmin={true})
- `/dashboard` - For admin
- `/orders` - For all authenticated users

---

## Setup Instructions

### Step 1: Run Migration
```bash
# Execute the migration on your MySQL database
mysql -u root bm_jaya_printing < supabase/migrations/20251119_add_multiple_workers_and_roles.sql
```

### Step 2: Add Employee Login Credentials
Add username and password (bcrypt hashed) to employees table:
```bash
# In backend, you can create an endpoint to hash and set passwords
# Or use this script:

const bcrypt = require('bcryptjs');
const password = bcrypt.hashSync('password123', 10);
// Then INSERT into employees: username='dede', password=hashed_password
```

### Step 3: Test Login
1. **Admin Login:**
   - Use existing admin credentials from `users` table
   - Username: admin / Password: (your admin password)

2. **Employee Login:**
   - Username: (employee username from `employees` table)
   - Password: (employee password set above)

### Step 4: Test Multiple Worker Assignment
1. Create an order
2. Go to Production tab
3. Select "Orang yang Mengerjakan" field
4. Choose multiple employees (try selecting 2-3 employees)
5. Click "Simpan Langkah"
6. Verify names appear correctly

---

## File Changes Summary

### Backend (`backend/server.js`)
- **Login Endpoint:** Enhanced to support both admin and employee login
- **GET `/api/orders/:orderId/production`:** Now joins with junction table, returns employee array
- **GET `/api/orders/:orderId/production/:stepNumber`:** Returns employees array
- **PUT `/api/orders/:orderId/production/:stepNumber`:** Handles `employee_ids[]` for multiple assignments

### Frontend
- **`src/App.jsx`:** 
  - Added role-based access control
  - Protected routes with `requireAdmin` prop
  - Role-aware menu display
  - User info shows role (Admin/Karyawan)

- **`src/components/ProductionTab.jsx`:**
  - Fixed AsyncSelect component (multi-select)
  - New `handleEmployeeChange()` function
  - Updated `handleSaveStep()` to handle employee_ids array
  - Removed unused `Select` import

### Database Migration
- **`supabase/migrations/20251119_add_multiple_workers_and_roles.sql`:**
  - Creates `production_steps_employees` junction table
  - Adds `role`, `username`, `password` to `employees` table
  - Creates view `production_steps_with_employees` for convenience

---

## API Response Examples

### Get Production Steps (with multiple employees)
```json
{
  "success": true,
  "steps": [
    {
      "id": 1,
      "order_id": 1,
      "step_number": 1,
      "step_name": "Desain",
      "status": "selesai",
      "employees": [
        { "id": 1, "nama": "Dede" },
        { "id": 2, "nama": "Ecep" }
      ],
      "photos": "[]",
      "created_at": "2025-11-19T10:00:00Z"
    }
  ]
}
```

### Update Production Step (request)
```json
{
  "employee_ids": [1, 2, 3],
  "status": "selesai",
  "tanggal": "2025-11-19",
  "catatan": "Sudah selesai"
}
```

---

## Future Enhancements

### Already Implemented
✅ Multiple workers per production step
✅ Employee login system
✅ Role-based access control
✅ AsyncSelect bug fix

### Ready to Implement
- [ ] Employee production dashboard (view assigned tasks)
- [ ] Production step assignment notifications
- [ ] Employee productivity reports
- [ ] Assign multiple steps to employee quickly
- [ ] Employee schedule/availability management

---

## Troubleshooting

### AsyncSelect not showing selected values
- Ensure API returns `employees` array with `id` and `nama` fields
- Check browser console for errors
- Verify `handleEmployeeChange` is properly updating state

### Employee can't login
- Confirm employee has `username` and `password` set in database
- Password must be bcrypt hashed
- Check if role is set to 'karyawan'

### Admin menus not showing for admin users
- Verify `user.role === 'admin'` in localStorage
- Check token payload includes `role: 'admin'`
- Refresh page to reload user data

---

## Testing Checklist

- [ ] Admin can login and see all menus
- [ ] Employee can login with credentials
- [ ] Employee login redirects to /orders instead of /dashboard
- [ ] Employee Management menu is hidden for non-admin users
- [ ] Employee can select multiple workers
- [ ] Multiple workers persist after save
- [ ] Worker names display correctly on page reload
- [ ] Production steps initialize correctly
- [ ] Photos can still be uploaded
- [ ] Status changes work properly
- [ ] Edit order still works correctly

---

## Support & Questions

For questions about this implementation, refer to:
- Backend API: `backend/server.js`
- Frontend Routes: `src/App.jsx`
- Production Component: `src/components/ProductionTab.jsx`
- Database: `supabase/migrations/20251119_add_multiple_workers_and_roles.sql`

