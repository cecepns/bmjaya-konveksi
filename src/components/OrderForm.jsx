import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import imageCompression from 'browser-image-compression';
import { ArrowLeft, Upload, X } from 'lucide-react';
import 'react-quill/dist/quill.snow.css';

const OrderForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [formData, setFormData] = useState({
    nama_pemesan: '',
    tanggal_order: '',
    tanggal_proof: '',
    tanggal_selesai: '',
    model_kerah: '',
    bahan: '',
    jaitan: '',
    jumlah_xs: 0,
    jumlah_s: 0,
    jumlah_m: 0,
    jumlah_l: 0,
    jumlah_xl: 0,
    jumlah_xxl: 0,
    jumlah_xxxl: 0,
    total_order: 0,
    catatan: '',
    deskripsi: ''
  });
  
  const [files, setFiles] = useState({
    desain_file: null,
    pola_file: null
  });
  
  const [loading, setLoading] = useState(false);
  const desainInputRef = useRef();
  const polaInputRef = useRef();

  // Fetch order data for editing
  useEffect(() => {
    if (isEdit && id) {
      fetchOrderData();
    }
  }, [isEdit, id]);

  const fetchOrderData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const orderData = response.data.order;
        setOrder(orderData);
        setFormData({
          nama_pemesan: orderData.nama_pemesan || '',
          tanggal_order: orderData.tanggal_order ? orderData.tanggal_order.split('T')[0] : '',
          tanggal_proof: orderData.tanggal_proof ? orderData.tanggal_proof.split('T')[0] : '',
          tanggal_selesai: orderData.tanggal_selesai ? orderData.tanggal_selesai.split('T')[0] : '',
          model_kerah: orderData.model_kerah || '',
          bahan: orderData.bahan || '',
          jaitan: orderData.jaitan || '',
          jumlah_xs: orderData.jumlah_xs || 0,
          jumlah_s: orderData.jumlah_s || 0,
          jumlah_m: orderData.jumlah_m || 0,
          jumlah_l: orderData.jumlah_l || 0,
          jumlah_xl: orderData.jumlah_xl || 0,
          jumlah_xxl: orderData.jumlah_xxl || 0,
          jumlah_xxxl: orderData.jumlah_xxxl || 0,
          total_order: orderData.total_order || 0,
          catatan: orderData.catatan || '',
          deskripsi: orderData.deskripsi || ''
        });
      }
    } catch (error) {
      toast.error('Gagal memuat data pesanan');
      navigate('/orders');
    }
  };

  useEffect(() => {
    const total = parseInt(formData.jumlah_xs) + parseInt(formData.jumlah_s) + 
                  parseInt(formData.jumlah_m) + parseInt(formData.jumlah_l) + 
                  parseInt(formData.jumlah_xl) + parseInt(formData.jumlah_xxl) + 
                  parseInt(formData.jumlah_xxxl);
    setFormData(prev => ({ ...prev, total_order: total }));
  }, [formData.jumlah_xs, formData.jumlah_s, formData.jumlah_m, formData.jumlah_l, 
      formData.jumlah_xl, formData.jumlah_xxl, formData.jumlah_xxxl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuillChange = (value) => {
    setFormData(prev => ({
      ...prev,
      deskripsi: value
    }));
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.5, // 500KB
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      throw new Error('Gagal mengkompresi gambar');
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);
      setFiles(prev => ({
        ...prev,
        [type]: compressedFile
      }));
      toast.success(`${type === 'desain_file' ? 'Desain' : 'Pola'} berhasil dikompresi`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      if (files.desain_file) {
        submitData.append('desain_file', files.desain_file);
      }
      if (files.pola_file) {
        submitData.append('pola_file', files.pola_file);
      }

      const url = isEdit 
        ? `https://api-inventory.isavralabel.com/bmjaya-printing/api/orders/${id}`
        : 'https://api-inventory.isavralabel.com/bmjaya-printing/api/orders';
      
      const method = isEdit ? 'put' : 'post';

      const response = await axios[method](url, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(`Pesanan berhasil ${isEdit ? 'diupdate' : 'ditambahkan'}`);
        navigate('/orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Gagal ${isEdit ? 'mengupdate' : 'menambahkan'} pesanan`);
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Pesanan' : 'Tambah Pesanan'}
        </h1>
        <button
          onClick={() => navigate('/orders')}
          className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 sm:h-5 w-4 sm:w-5" />
          <span>Kembali</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pemesan *
              </label>
              <input
                type="text"
                name="nama_pemesan"
                value={formData.nama_pemesan}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Order *
              </label>
              <input
                type="date"
                name="tanggal_order"
                value={formData.tanggal_order}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Proof
              </label>
              <input
                type="date"
                name="tanggal_proof"
                value={formData.tanggal_proof}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai
              </label>
              <input
                type="date"
                name="tanggal_selesai"
                value={formData.tanggal_selesai}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Kerah
              </label>
              <input
                type="text"
                name="model_kerah"
                value={formData.model_kerah}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bahan
              </label>
              <input
                type="text"
                name="bahan"
                value={formData.bahan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jaitan
              </label>
              <input
                type="text"
                name="jaitan"
                value={formData.jaitan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Size Quantities */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Jumlah per Ukuran</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
              {['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'].map(size => (
                <div key={size}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    {size.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    name={`jumlah_${size}`}
                    value={formData[`jumlah_${size}`]}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-semibold">Total Order: {formData.total_order} pcs</span>
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Desain 
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center w-full px-3 sm:px-4 py-4 sm:py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-700">Pilih file desain atau drag & drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 500KB)</p>
                  </div>
                  <input
                    type="file"
                    ref={desainInputRef}
                    onChange={(e) => handleFileChange(e, 'desain_file')}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
                
                {/* Preview Images */}
                <div className="space-y-2">
                  {files.desain_file && (
                    <div className="relative">
                      <p className="text-xs text-gray-600 mb-2 font-semibold text-green-600">✓ File Baru (Akan diupload):</p>
                      <div className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-green-300">
                        <img
                          src={URL.createObjectURL(files.desain_file)}
                          alt="Desain preview"
                          className="w-full h-32 sm:h-40 md:h-48 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFiles(prev => ({ ...prev, desain_file: null }));
                            desainInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {isEdit && order?.desain_file && !files.desain_file && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2 font-semibold">Desain Saat Ini:</p>
                      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${order.desain_file}`}
                          alt="Current desain"
                          className="w-full h-32 sm:h-40 md:h-48 object-contain"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
                            e.target.style.padding = '20px';
                            e.target.style.color = '#9CA3AF';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Pola Baju 
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center w-full px-3 sm:px-4 py-4 sm:py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-700">Pilih file pola atau drag & drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (Max 500KB)</p>
                  </div>
                  <input
                    type="file"
                    ref={polaInputRef}
                    onChange={(e) => handleFileChange(e, 'pola_file')}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
                
                {/* Preview Images */}
                <div className="space-y-2">
                  {files.pola_file && (
                    <div className="relative">
                      <p className="text-xs text-gray-600 mb-2 font-semibold text-green-600">✓ File Baru (Akan diupload):</p>
                      <div className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-green-300">
                        <img
                          src={URL.createObjectURL(files.pola_file)}
                          alt="Pola preview"
                          className="w-full h-32 sm:h-40 md:h-48 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFiles(prev => ({ ...prev, pola_file: null }));
                            polaInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {isEdit && order?.pola_file && !files.pola_file && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2 font-semibold">Pola Saat Ini:</p>
                      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${order.pola_file}`}
                          alt="Current pola"
                          className="w-full h-32 sm:h-40 md:h-48 object-contain"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
                            e.target.style.padding = '20px';
                            e.target.style.color = '#9CA3AF';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <ReactQuill
              theme="snow"
              value={formData.deskripsi}
              onChange={handleQuillChange}
              modules={quillModules}
              className="bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="px-4 sm:px-6 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memproses...' : (isEdit ? 'Update Pesanan' : 'Simpan Pesanan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;