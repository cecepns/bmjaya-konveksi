import { useState } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home, Clipboard, Users, Menu, X, LogOut } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import OrderDetail from './components/OrderDetail';
import EmployeeManagement from './components/EmployeeManagement';
import './index.css';

const logo = '/logo.png';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requireAdmin: PropTypes.bool
  };
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin) {
    const isAdmin = user.role === 'admin' || user.type === 'admin';
    if (!isAdmin) {
      return <Navigate to="/orders" replace />;
    }
  }
  
  return children;
}

// Layout Component (Sidebar + Main)
function MainLayout({ children }) {
  MainLayout.propTypes = {
    children: PropTypes.node.isRequired
  };
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Check if user is admin (role should be admin or type should be admin for backward compatibility)
  const isAdmin = user.role === 'admin' || user.type === 'admin';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static w-64 bg-white shadow-lg overflow-y-auto z-40 transition-transform duration-300 ease-in-out h-screen`}>
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex justify-center items-center flex-1">
              <img src={logo} alt="BM Jaya Printing" className="w-24 lg:w-28 h-auto" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {/* Show Dashboard for all users if admin, show Production Dashboard for karyawan */}
            <button
              onClick={() => {
                navigate(isAdmin ? '/dashboard' : '/orders');
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors text-sm ${
                isActive(isAdmin ? '/dashboard' : '/orders')
                  ? 'bg-primary-100 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <Home className="w-5 h-5 mr-3 flex-shrink-0" />
                {isAdmin ? 'Dashboard' : 'Pesanan Saya'}
              </span>
            </button>
            
            {/* Show Orders Management for all users */}
            <button
              onClick={() => {
                navigate('/orders');
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors text-sm ${
                isActive('/orders')
                  ? 'bg-primary-100 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                <Clipboard className="w-5 h-5 mr-3 flex-shrink-0" />
                Kelola Pesanan
              </span>
            </button>

            {/* Show Employee Management only for admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  navigate('/employees');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors text-sm ${
                  isActive('/employees')
                    ? 'bg-primary-100 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center">
                  <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                  Manajemen Karyawan
                </span>
              </button>
            )}
          </nav>

          {/* Divider */}
          <div className="my-6 lg:my-8 border-t border-gray-200"></div>

          {/* User Info & Logout */}
          <div className="space-y-4">
            <div className="px-4 py-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Pengguna</p>
              <p className="text-sm font-medium text-gray-700 truncate">{user.nama || user.username}</p>
              <p className="text-xs text-gray-500 mt-1">{isAdmin ? 'Admin' : 'Karyawan'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Top Bar */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img src={logo} alt="BM Jaya Printing" className="w-16 h-auto" />
          <div className="w-6"></div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrderList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/orders/create"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrderForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/orders/:id/edit"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrderForm isEdit={true} />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <OrderDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute requireAdmin={true}>
              <MainLayout>
                <EmployeeManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;