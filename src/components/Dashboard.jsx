import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Plus, Clock, CheckCircle, Zap, Lightbulb } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://api-inventory.isavralabel.com/bmjaya-printing/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      toast.error('Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, gradient }) => (
    <div className={`${gradient} rounded-xl shadow-card-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-2xl`}>
      <div className="flex items-center">
        <div className={`p-4 rounded-full ${color} backdrop-blur-sm`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-semibold text-white opacity-90">{title}</h3>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Total Pesanan"
          value={stats.totalOrders}
          gradient="bg-gradient-primary"
          color="bg-blue-400 bg-opacity-30"
          icon={<FileText className="h-6 sm:h-8 w-6 sm:w-8 text-white" />}
        />
        
        <StatCard
          title="Pesanan Hari Ini"
          value={stats.todayOrders}
          gradient="bg-gradient-success"
          color="bg-green-400 bg-opacity-30"
          icon={<Plus className="h-6 sm:h-8 w-6 sm:w-8 text-white" />}
        />
        
        <StatCard
          title="Pesanan Tertunda"
          value={stats.pendingOrders}
          gradient="bg-gradient-warning"
          color="bg-yellow-400 bg-opacity-30"
          icon={<Clock className="h-6 sm:h-8 w-6 sm:w-8 text-white" />}
        />
        
        <StatCard
          title="Pesanan Selesai"
          value={stats.completedOrders}
          gradient="bg-gradient-accent"
          color="bg-purple-400 bg-opacity-30"
          icon={<CheckCircle className="h-6 sm:h-8 w-6 sm:w-8 text-white" />}
        />
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-card-lg p-4 sm:p-6 lg:p-8 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-gray-900 flex-shrink-0" />
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Selamat Datang di BM Jaya Printing</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
          Sistem manajemen pesanan yang powerful untuk BM Jaya Printing. Kelola semua pesanan Anda dengan mudah dan efisien.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg border-l-4 border-blue-500 shadow-card">
            <div className="flex items-start gap-3">
              <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Fitur Utama:</h3>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Manajemen pesanan lengkap</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Upload desain dan pola baju</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Generate dan export SPK PDF</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Sistem paginasi otomatis</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg border-l-4 border-purple-500 shadow-card">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Tips Penggunaan:</h3>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Ukuran file gambar maksimal 500KB</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Gunakan deskripsi untuk detail tambahan</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Preview SPK sebelum mencetak</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mr-1 text-green-600 flex-shrink-0 mt-0.5" /> <span>Backup data secara berkala</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;