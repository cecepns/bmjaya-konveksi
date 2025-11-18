import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, Calendar, Package, Shirt, Flag } from 'lucide-react';
import OrderPreview from './OrderPreview';
import ProductionTab from './ProductionTab';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const fetchOrderData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrder(response.data.order);
      }
    } catch (error) {
      toast.error('Gagal memuat data pesanan');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Pesanan tidak ditemukan</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (order.tanggal_selesai) return 'bg-green-100 text-green-800';
    if (order.tanggal_proof) return 'bg-blue-100 text-blue-800';
    return 'bg-amber-100 text-amber-800';
  };

  const getStatusText = () => {
    if (order.tanggal_selesai) return 'Selesai';
    if (order.tanggal_proof) return 'Dalam Produksi';
    return 'Menunggu Proof';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/orders')}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Detail Pesanan</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm font-mono font-semibold text-primary-600">{order.no_order}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          Lihat SPK
        </button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Pemesan</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{order.nama_pemesan}</p>
            </div>
            <Package className="w-8 h-8 text-blue-100" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{order.total_order} pcs</p>
            </div>
            <Shirt className="w-8 h-8 text-purple-100" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Order</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(order.tanggal_order)}</p>
            </div>
            <Calendar className="w-8 h-8 text-cyan-100" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Bahan</p>
              <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{order.bahan || '-'}</p>
            </div>
            <Flag className="w-8 h-8 text-orange-100" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Detail Pesanan
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'production'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Produksi
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Informasi Pesanan
                  </h3>
                  <div className="space-y-4">
                    <div className="border-b border-blue-100 pb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Nama Pemesan</p>
                      <p className="font-semibold text-gray-900 text-base">{order.nama_pemesan}</p>
                    </div>
                    <div className="border-b border-blue-100 pb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tanggal Order</p>
                      <p className="font-semibold text-gray-900 text-base">{formatDate(order.tanggal_order)}</p>
                    </div>
                    <div className="border-b border-blue-100 pb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tanggal Proof</p>
                      <p className="font-semibold text-gray-900 text-base">{order.tanggal_proof ? formatDate(order.tanggal_proof) : <span className="text-gray-400">Belum ada</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tanggal Selesai</p>
                      <p className="font-semibold text-gray-900 text-base">{order.tanggal_selesai ? formatDate(order.tanggal_selesai) : <span className="text-gray-400">Belum selesai</span>}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Shirt className="w-5 h-5 text-purple-600" />
                    Spesifikasi Produk
                  </h3>
                  <div className="space-y-4">
                    <div className="border-b border-purple-100 pb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Model Kerah</p>
                      <p className="font-semibold text-gray-900 text-base">{order.model_kerah || '-'}</p>
                    </div>
                    <div className="border-b border-purple-100 pb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Bahan</p>
                      <p className="font-semibold text-gray-900 text-base">{order.bahan || '-'}</p>
                    </div>
                    <div className="border-b border-purple-100 pb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Jaitan</p>
                      <p className="font-semibold text-gray-900 text-base">{order.jaitan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Order</p>
                      <p className="font-bold text-primary-600 text-2xl">{order.total_order} <span className="text-sm text-gray-600">pcs</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Size Breakdown */}
              <div className="bg-gradient-to-br from-green-50 to-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Rincian Ukuran
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-100 border-b-2 border-green-300">
                        <th className="px-4 py-3 text-center font-bold text-gray-800">XS</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-800">S</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-800">M</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-800">L</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-800">XL</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-800">XXL</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-800">XXXL</th>
                        <th className="px-4 py-3 text-center font-bold text-white bg-primary-600 rounded-r">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-green-100 transition-colors">
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_xs || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_s || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_m || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_l || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_xl || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_xxl || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">{order.jumlah_xxxl || 0}</td>
                        <td className="px-4 py-3 text-center font-bold text-white bg-primary-600 text-lg rounded-r">{order.total_order}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Images */}
              {(order.desain_file || order.pola_file) && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-5">📸 Gambar Referensi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {order.desain_file && (
                      <div className="border-2 border-blue-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <div className="bg-blue-600 px-4 py-3">
                          <p className="text-sm font-bold text-white">🎨 Desain</p>
                        </div>
                        <div className="p-4 flex justify-center bg-white min-h-64">
                          <img
                            src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${order.desain_file}`}
                            alt="Desain"
                            className="max-w-full h-auto max-h-64 rounded"
                          />
                        </div>
                      </div>
                    )}
                    {order.pola_file && (
                      <div className="border-2 border-purple-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <div className="bg-purple-600 px-4 py-3">
                          <p className="text-sm font-bold text-white">👕 Pola Baju</p>
                        </div>
                        <div className="p-4 flex justify-center bg-white min-h-64">
                          <img
                            src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${order.pola_file}`}
                            alt="Pola"
                            className="max-w-full h-auto max-h-64 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {order.deskripsi && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-50 border border-cyan-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    Deskripsi Detail
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: order.deskripsi }}
                  />
                </div>
              )}

              {/* Notes */}
              {order.catatan && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-400 border border-amber-200 rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-amber-600" />
                    ⚠️ Catatan Penting
                  </h3>
                  <p className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed bg-white bg-opacity-50 p-4 rounded border border-amber-100">{order.catatan}</p>
                </div>
              )}

              {/* Edit Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => navigate(`/orders/${order.id}/edit`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Edit Pesanan
                </button>
              </div>
            </div>
          )}

          {activeTab === 'production' && (
            <ProductionTab orderId={order.id} orderNumber={order.no_order} />
          )}
        </div>
      </div>

      {/* Order Preview Modal */}
      {showPreview && (
        <OrderPreview
          order={order}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default OrderDetail;


