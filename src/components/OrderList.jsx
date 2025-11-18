import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import OrderPreview from './OrderPreview';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [previewOrder, setPreviewOrder] = useState(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const fetchOrders = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = new URL('https://api-inventory.isavralabel.com/bmjaya-printing/api/orders');
      url.searchParams.append('page', page);
      if (search.trim()) {
        url.searchParams.append('search', search);
      }
      
      const response = await axios.get(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch {
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer (1 second)
    debounceTimer.current = setTimeout(() => {
      fetchOrders(1, value);
    }, 1000);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Yakin ingin menghapus pesanan ini?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Pesanan berhasil dihapus');
        fetchOrders(pagination.currentPage);
      }
    } catch {
      toast.error('Gagal menghapus pesanan');
    }
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-';
  };

  const Pagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-700">
          Menampilkan <span className="text-primary-600 font-bold">{Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)}</span> sampai <span className="text-primary-600 font-bold">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> dari <span className="text-primary-600 font-bold">{pagination.totalItems}</span> data
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchOrders(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-gray-700"
          >
            ← Sebelumnya
          </button>
          {pages.map(page => (
            <button
              key={page}
              onClick={() => fetchOrders(page)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                page === pagination.currentPage
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => fetchOrders(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-gray-700"
          >
            Selanjutnya →
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Kelola Pesanan</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Lihat dan kelola semua pesanan cetak Anda</p>
          </div>
          <button
            onClick={() => navigate('/orders/create')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center sm:space-x-2 transition-all transform hover:scale-105 shadow-lg font-semibold text-sm sm:text-base"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Pesanan Baru</span>
            <span className="sm:hidden">Baru</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 sm:w-5 h-4 sm:h-5" />
          <input
            type="text"
            placeholder="Cari No Order atau Nama..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-card-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  No Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nama Pemesan
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Tanggal Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Total Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-400 mb-3" />
                      Belum ada pesanan
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 bg-blue-50">
                      {order.no_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {order.nama_pemesan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(order.tanggal_order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {order.total_order} pcs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-bold rounded-full ${
                        order.tanggal_selesai 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      }`}>
                        {order.tanggal_selesai ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Selesai
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            Proses
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="inline-flex items-center px-3 py-2 rounded-lg bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors font-medium text-xs"
                          title="View Order Detail"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detail
                        </button>
                        <button
                          onClick={() => setPreviewOrder(order)}
                          className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors font-medium text-xs"
                          title="Preview Order"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          SPK
                        </button>
                        <button
                          onClick={() => navigate(`/orders/${order.id}/edit`)}
                          className="inline-flex items-center px-3 py-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors font-medium text-xs"
                          title="Edit Order"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="inline-flex items-center px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium text-xs"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {pagination.totalPages > 1 && <Pagination />}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">Belum ada pesanan</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">No Order</p>
                    <p className="text-base font-bold text-primary-600 truncate">{order.no_order}</p>
                  </div>
                  <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-4 font-bold rounded-full whitespace-nowrap ${
                    order.tanggal_selesai 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  }`}>
                    {order.tanggal_selesai ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Selesai
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Proses
                      </>
                    )}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span className="font-medium text-gray-900">{order.nama_pemesan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="text-gray-900">{formatDate(order.tanggal_order)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah:</span>
                    <span className="font-medium text-gray-900">{order.total_order} pcs</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="inline-flex items-center justify-center px-2 py-2 rounded text-xs bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors font-medium"
                    title="Detail"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Detail
                  </button>
                  <button
                    onClick={() => setPreviewOrder(order)}
                    className="inline-flex items-center justify-center px-2 py-2 rounded text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors font-medium"
                    title="SPK"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    SPK
                  </button>
                  <button
                    onClick={() => navigate(`/orders/${order.id}/edit`)}
                    className="inline-flex items-center justify-center px-2 py-2 rounded text-xs bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors font-medium"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="inline-flex items-center justify-center px-2 py-2 rounded text-xs bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 bg-gray-50 p-3 rounded border border-gray-200">
            <button
              onClick={() => fetchOrders(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-gray-700"
            >
              ← Sblm
            </button>
            <span className="text-xs font-medium text-gray-700">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchOrders(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-gray-700"
            >
              Slnj →
            </button>
          </div>
        )}
      </div>

      {previewOrder && (
        <OrderPreview
          order={previewOrder}
          onClose={() => setPreviewOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderList;