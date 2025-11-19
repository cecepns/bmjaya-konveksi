import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, X, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import AsyncSelect from 'react-select/async';

const PRODUCTION_STEPS = [
  { number: 1, name: 'Desain', hasWeight: false, hasJahit: false },
  { number: 2, name: 'Potong Kertas', hasWeight: false, hasJahit: false },
  { number: 3, name: 'Potong Kain Jersey', hasWeight: true, hasJahit: false },
  { number: 4, name: 'Potong Kain Polos', hasWeight: false, hasJahit: false },
  { number: 5, name: 'Press Jersey', hasWeight: false, hasJahit: false },
  { number: 6, name: 'Sablon', hasWeight: false, hasJahit: false },
  { number: 7, name: 'Bordir', hasWeight: false, hasJahit: false },
  { number: 8, name: 'Jahit', hasWeight: false, hasJahit: true },
  { number: 9, name: 'Packing & QC', hasWeight: false, hasJahit: false }
];

const ProductionTab = ({ orderId, orderNumber }) => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(null);
  const [saving, setSaving] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => {
    initializeAndFetchSteps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Async function untuk fetch employees dengan paginasi dan search
  const loadEmployeesOptions = async (searchValue = '') => {
    try {
      const token = localStorage.getItem('token');
      const page = 1; // Always start from page 1 for search/initial load
      
      // Build URL with search parameter if provided
      let url = `https://api-inventory.isavralabel.com/bmjaya-printing/api/employees?page=${page}`;
      if (searchValue && searchValue.trim()) {
        url += `&search=${encodeURIComponent(searchValue)}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const options = response.data.employees.map((emp) => ({
          value: emp.id,
          label: emp.nama,
          nama: emp.nama,
          no_telpon: emp.no_telpon,
          email: emp.email
        }));

        return options;
      }

      return [];
    } catch (error) {
      console.error('Fetch employees error:', error);
      return [];
    }
  };

  const initializeAndFetchSteps = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Initialize production steps
      await axios.post(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}/production/init`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch steps
      fetchSteps();
    } catch (error) {
      console.error('Init error:', error);
      // Try to fetch anyway in case steps already exist
      fetchSteps();
    }
  };

  const fetchSteps = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}/production`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSteps(response.data.steps);
        setExpandedStep(1); // Expand first step by default
      }
    } catch {
      toast.error('Gagal memuat data produksi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (stepNumber, newStatus) => {
    setSaving(stepNumber);
    try {
      const token = localStorage.getItem('token');
      const step = steps.find(s => s.step_number === stepNumber);

      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('tanggal', step.tanggal || '');
      formData.append('catatan', step.catatan || '');
      if (step.pic_id) formData.append('pic_id', step.pic_id);
      if (step.berat_sebelum) formData.append('berat_sebelum', step.berat_sebelum);
      if (step.berat_sesudah) formData.append('berat_sesudah', step.berat_sesudah);
      if (step.jenis_jahit) formData.append('jenis_jahit', step.jenis_jahit);
      if (step.harga_jahit) formData.append('harga_jahit', step.harga_jahit);

      await axios.put(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}/production/${stepNumber}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      // Update local state
      setSteps(prev => prev.map(s =>
        s.step_number === stepNumber ? { ...s, status: newStatus } : s
      ));

      toast.success('Status berhasil diupdate');
    } catch (error) {
      console.error('Status change error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Gagal mengupdate status');
    } finally {
      setSaving(null);
    }
  };

  const handleInputChange = (stepNumber, field, value) => {
    setSteps(prev => prev.map(s =>
      s.step_number === stepNumber ? { ...s, [field]: value } : s
    ));
  };

  const handleEmployeeChange = (stepNumber, selectedOptions) => {
    // Store both the employee IDs and names for display
    const employees = selectedOptions || [];
    const employeeIds = employees.map(e => e.value);
    
    setSteps(prev => prev.map(s =>
      s.step_number === stepNumber 
        ? { 
            ...s, 
            employee_ids: employeeIds,
            employees: employees.map(e => ({ id: e.value, nama: e.label }))
          } 
        : s
    ));
  };

  const handleSaveStep = async (stepNumber) => {
    setSaving(stepNumber);
    try {
      const token = localStorage.getItem('token');
      const step = steps.find(s => s.step_number === stepNumber);

      const formData = new FormData();
      formData.append('tanggal', step.tanggal || '');
      formData.append('status', step.status || 'pending');
      formData.append('catatan', step.catatan || '');
      
      // Handle both old pic_id and new employee_ids
      if (step.employee_ids && step.employee_ids.length > 0) {
        step.employee_ids.forEach((id, idx) => {
          formData.append(`employee_ids[${idx}]`, id);
        });
      } else if (step.pic_id) {
        // Backward compatibility
        formData.append('employee_ids[0]', step.pic_id);
      }

      const stepConfig = PRODUCTION_STEPS.find(s => s.number === stepNumber);
      if (stepConfig.hasWeight) {
        formData.append('berat_sebelum', step.berat_sebelum || '');
        formData.append('berat_sesudah', step.berat_sesudah || '');
      }

      if (stepConfig.hasJahit) {
        formData.append('jenis_jahit', step.jenis_jahit || '');
        formData.append('harga_jahit', step.harga_jahit || '');
      }

      await axios.put(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}/production/${stepNumber}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Langkah produksi berhasil disimpan');
      fetchSteps();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan langkah produksi');
    } finally {
      setSaving(null);
    }
  };

  const handlePhotoUpload = async (e, stepNumber) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(stepNumber);
    try {
      const token = localStorage.getItem('token');
      const step = steps.find(s => s.step_number === stepNumber);

      const formData = new FormData();
      formData.append('tanggal', step.tanggal || '');
      formData.append('status', step.status || 'pending');
      formData.append('catatan', step.catatan || '');
      if (step.pic_id) formData.append('pic_id', step.pic_id);

      // Add all selected files
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }

      const stepConfig = PRODUCTION_STEPS.find(s => s.number === stepNumber);
      if (stepConfig.hasWeight) {
        formData.append('berat_sebelum', step.berat_sebelum || '');
        formData.append('berat_sesudah', step.berat_sesudah || '');
      }

      if (stepConfig.hasJahit) {
        formData.append('jenis_jahit', step.jenis_jahit || '');
        formData.append('harga_jahit', step.harga_jahit || '');
      }

      await axios.put(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}/production/${stepNumber}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Foto berhasil diupload');
      fetchSteps();
    } catch {
      toast.error('Gagal upload foto');
    } finally {
      setSaving(null);
      // Reset file input
      if (fileInputRefs.current[stepNumber]) {
        fileInputRefs.current[stepNumber].value = '';
      }
    }
  };

  const handleDeletePhoto = async (stepNumber, photoName) => {
    if (!window.confirm('Yakin ingin menghapus foto ini?')) return;

    setSaving(stepNumber);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${orderId}/production/${stepNumber}/photo/${photoName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Foto berhasil dihapus');
      fetchSteps();
    } catch {
      toast.error('Gagal menghapus foto');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">SPK {orderNumber}</span> - 
          {' '}
          <span className="text-green-600 font-medium">
            {steps.filter(s => s.status === 'selesai').length}
          </span>
          {' '}dari {' '}
          <span className="font-medium">
            {steps.length}
          </span>
          {' '}langkah selesai
        </p>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
            style={{ width: `${steps.length > 0 ? (steps.filter(s => s.status === 'selesai').length / steps.length) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Production Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const stepConfig = PRODUCTION_STEPS.find(s => s.number === step.step_number);
          const isExpanded = expandedStep === step.step_number;
          const photos = step.photos ? JSON.parse(step.photos) : [];
          const sisaKain = step.berat_sebelum && step.berat_sesudah 
            ? (parseFloat(step.berat_sebelum) - parseFloat(step.berat_sesudah)).toFixed(2)
            : null;

          return (
            <div
              key={step.step_number}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Step Header */}
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
                className={`w-full px-4 py-4 flex items-center justify-between bg-gradient-to-r transition-colors ${
                  step.status === 'selesai'
                    ? 'from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
                    : 'from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 text-left min-w-0">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step.status === 'selesai'
                      ? 'bg-green-200 text-green-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {step.step_number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{stepConfig.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {step.status === 'selesai' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-200 text-green-700 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {step.tanggal && (
                        <span className="text-xs text-gray-600">
                          {new Date(step.tanggal).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Step Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
                  {/* PIC Selection - Multiple Employees Support */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orang yang Mengerjakan (Bisa Lebih dari 1)
                    </label>
                    <AsyncSelect
                      name="pic_employees"
                      loadOptions={loadEmployeesOptions}
                      defaultOptions={true}
                      value={step.employees && step.employees.length > 0 
                        ? step.employees.map(emp => ({
                            value: emp.id,
                            label: emp.nama
                          }))
                        : []}
                      onChange={(options) => handleEmployeeChange(step.step_number, options)}
                      placeholder="-- Pilih Karyawan --"
                      isClearable
                      isSearchable
                      isMulti={true}
                      cacheOptions
                      classNamePrefix="react-select"
                      noOptionsMessage={() => 'Tidak ada karyawan'}
                      loadingMessage={() => 'Memuat...'}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          borderRadius: '0.375rem',
                          padding: '0',
                          '&:focus-within': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
                          }
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
                          color: state.isSelected ? 'white' : '#000',
                          cursor: 'pointer'
                        })
                      }}
                    />
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Pengerjaan
                    </label>
                    <input
                      type="date"
                      value={step.tanggal || ''}
                      onChange={(e) => handleInputChange(step.step_number, 'tanggal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Weight Fields (for step 3) */}
                  {stepConfig.hasWeight && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Berat Sebelum (kg)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={step.berat_sebelum || ''}
                            onChange={(e) => handleInputChange(step.step_number, 'berat_sebelum', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Berat Sesudah (kg)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={step.berat_sesudah || ''}
                            onChange={(e) => handleInputChange(step.step_number, 'berat_sesudah', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      {sisaKain !== null && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Sisa Kain:</span> {sisaKain} kg
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Jahit Fields (for step 8) */}
                  {stepConfig.hasJahit && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis Jahit
                        </label>
                        <input
                          type="text"
                          value={step.jenis_jahit || ''}
                          onChange={(e) => handleInputChange(step.step_number, 'jenis_jahit', e.target.value)}
                          placeholder="Jahit Biasa, Jahit Terang, dll"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Harga Jahit (Rp)
                        </label>
                        <input
                          type="number"
                          value={step.harga_jahit || ''}
                          onChange={(e) => handleInputChange(step.step_number, 'harga_jahit', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      value={step.catatan || ''}
                      onChange={(e) => handleInputChange(step.step_number, 'catatan', e.target.value)}
                      rows={3}
                      placeholder="Tambahkan catatan untuk langkah ini..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Foto ({photos.length})
                    </label>
                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-700">Pilih foto atau drag & drop</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 500KB)</p>
                      </div>
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[step.step_number] = el)}
                        onChange={(e) => handlePhotoUpload(e, step.step_number)}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </label>

                    {/* Photo Gallery */}
                    {photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {photos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${photo}`}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => handleDeletePhoto(step.step_number, photo)}
                              disabled={saving === step.step_number}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleSaveStep(step.step_number)}
                      disabled={saving === step.step_number}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving === step.step_number ? 'Menyimpan...' : 'Simpan Langkah'}
                    </button>
                    <button
                      onClick={() => handleStatusChange(step.step_number, step.status === 'selesai' ? 'pending' : 'selesai')}
                      disabled={saving === step.step_number}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        step.status === 'selesai'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {step.status === 'selesai' ? 'Tandai Pending' : 'Tandai Selesai'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

ProductionTab.propTypes = {
  orderId: PropTypes.number.isRequired,
  orderNumber: PropTypes.string.isRequired
};

export default ProductionTab;


