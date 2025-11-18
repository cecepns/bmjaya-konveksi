import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import PropTypes from 'prop-types';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [formData, setFormData] = useState({
    nama: '',
    no_telpon: '',
    email: '',
    alamat: '',
    status: 'aktif'
  });

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [currentPage]);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/employees?page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setEmployees(response.data.employees);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nama.trim()) {
      toast.error('Nama karyawan harus diisi');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      if (editingId) {
        // Update existing employee
        await axios.put(
          `https://api-inventory.isavralabel.com/bmjaya-printing/api/employees/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Karyawan berhasil diupdate');
      } else {
        // Create new employee
        await axios.post(
          'https://api-inventory.isavralabel.com/bmjaya-printing/api/employees',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Karyawan berhasil ditambahkan');
      }

      setFormData({
        nama: '',
        no_telpon: '',
        email: '',
        alamat: '',
        status: 'aktif'
      });
      setEditingId(null);
      setShowForm(false);
      setCurrentPage(1);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan karyawan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      nama: employee.nama,
      no_telpon: employee.no_telpon || '',
      email: employee.email || '',
      alamat: employee.alamat || '',
      status: employee.status
    });
    setEditingId(employee.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus karyawan ini?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/employees/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Karyawan berhasil dihapus');
      setCurrentPage(1);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus karyawan');
    }
  };

  const handleCancel = () => {
    setFormData({
      nama: '',
      no_telpon: '',
      email: '',
      alamat: '',
      status: 'aktif'
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Karyawan</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola data karyawan BM Jaya Printing</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Karyawan
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Karyawan *
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama karyawan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  name="no_telpon"
                  value={formData.no_telpon}
                  onChange={handleInputChange}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contoh@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                placeholder="Masukkan alamat karyawan"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Menyimpan...' : (editingId ? 'Update' : 'Tambah')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">No. Telepon</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Belum ada data karyawan
                  </td>
                </tr>
              ) : (
                employees.map((employee, idx) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-700">{(currentPage - 1) * 10 + idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{employee.nama}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{employee.no_telpon || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{employee.email || '-'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        employee.status === 'aktif'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {employee.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * 10 + 1} hingga {Math.min(currentPage * 10, pagination.totalItems)} dari {pagination.totalItems} karyawan
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

EmployeeManagement.propTypes = {
  onBackClick: PropTypes.func
};

export default EmployeeManagement;

