import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const OrderPreview = ({ order, onClose }) => {
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-';
  };

  const exportToImage = async () => {
    try {
      const element = document.getElementById('spk-preview');
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      // Convert canvas to JPG and download
      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SPK_${order.no_order}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
      
      toast.success('SPK berhasil diexport ke gambar JPG');
    } catch (error) {
      console.error('Image export error:', error);
      toast.error('Gagal export SPK ke gambar');
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('spk-preview');
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`SPK_${order.no_order}.pdf`);
      toast.success('SPK berhasil diexport ke PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Gagal export SPK ke PDF');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-base sm:text-xl font-bold text-gray-900"> SPK - <span className="text-primary-600 truncate">{order.no_order}</span></h2>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={exportToImage}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm flex items-center gap-1 transition-all transform hover:scale-105 shadow-md font-medium"
              title="Download gambar JPG"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Download JPG</span>
              <span className="sm:hidden">Download JPG</span>
            </button>
            <button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm flex items-center gap-1 transition-all transform hover:scale-105 shadow-md font-medium"
              title="Export ke PDF"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1.5 transition-colors"
              title="Tutup"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div id="spk-preview" className="p-3 sm:p-4 bg-white" style={{ fontSize: '11px', '--tw-text-opacity': 1 }}>
          {/* Header */}
          <div className="text-center mb-2 sm:mb-3 pb-2 sm:pb-3 border-b-2 border-primary-600">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-700 tracking-wide mb-0.5 sm:mb-1">BM JAYA</h1>
            <p className="text-xs sm:text-sm font-semibold text-primary-600">Konveksi • Sablon • Printing</p>
            <div className="text-xs text-gray-700 space-y-0 mb-2 mt-1">
              <p className="text-xs">Perumahan Cicalengka Cengkeh Indah (CCI) Block C4 No. 1</p>
              <p className="text-xs">Kec. Cicalengka Kab. Bandung</p>
              <p className="text-xs">WA: 085222278432 - 081321304496</p>
            </div>
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded p-1.5 sm:p-2 mt-1">
              <p className="text-xs text-gray-600 font-medium">SURAT PERINTAH KERJA (SPK)</p>
              <p className="text-sm sm:text-base font-bold text-primary-700 mt-0">No. {order.no_order}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-300">
            <div className="border border-gray-200 rounded">
              <div className="bg-blue-100 px-3 py-1.5">
                <h3 className="font-bold text-sm text-primary-700">Informasi Pesanan</h3>
              </div>
              <div className="space-y-1 text-xs p-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Nama Pemesan:</span>
                  <span className="text-gray-900">{order.nama_pemesan}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Tgl Order:</span>
                  <span className="text-gray-900">{formatDate(order.tanggal_order)}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Tgl Proof:</span>
                  <span className="text-gray-900">{formatDate(order.tanggal_proof)}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Tgl Selesai:</span>
                  <span className="text-gray-900">{formatDate(order.tanggal_selesai)}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded">
              <div className="bg-purple-100 px-2 sm:px-3 py-1.5">
                <h3 className="font-bold text-xs sm:text-sm text-primary-700">Spesifikasi Produk</h3>
              </div>
              <div className="space-y-1 text-xs p-2 sm:p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">Model Kerah:</span>
                  <span className="text-gray-900">{order.model_kerah || '-'}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">Bahan:</span>
                  <span className="text-gray-900">{order.bahan || '-'}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">Jaitan:</span>
                  <span className="text-gray-900">{order.jaitan || '-'}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700">Total:</span>
                  <span className="font-bold text-primary-600 bg-primary-100 px-1.5 py-0 rounded text-xs">{order.total_order} pcs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Size Breakdown */}
          <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-300">
            <h3 className="font-bold text-xs sm:text-sm mb-1 text-primary-700">Rincian Ukuran</h3>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-600 to-primary-700">
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">XS</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">S</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">M</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">L</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">XL</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">XXL</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-semibold">XXXL</th>
                    <th className="border border-primary-700 px-1 py-1 text-white font-bold bg-primary-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_xs || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_s || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_m || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_l || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_xl || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_xxl || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-semibold text-gray-900">{order.jumlah_xxxl || 0}</td>
                    <td className="border border-gray-200 px-1 py-1 text-center font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700">{order.total_order}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Images */}
          {(order.desain_file || order.pola_file) && (
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-300">
              <h3 className="font-bold text-xs sm:text-sm mb-1 text-primary-700">Gambar Referensi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2">
                {order.desain_file && (
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="bg-blue-100 px-2 py-0.5">
                      <h4 className="font-bold text-xs text-gray-800">Desain</h4>
                    </div>
                    <div className="p-1.5 bg-white flex justify-center">
                      <img
                        src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${order.desain_file}`}
                        alt="Desain"
                        className="max-w-full h-auto rounded max-h-24 sm:max-h-32"
                      />
                    </div>
                  </div>
                )}
                {order.pola_file && (
                  <div className="rounded overflow-hidden border border-gray-200">
                    <div className="bg-purple-100 px-2 py-0.5">
                      <h4 className="font-bold text-xs text-gray-800">Pola Baju</h4>
                    </div>
                    <div className="p-1.5 bg-white flex justify-center">
                      <img
                        src={`https://api-inventory.isavralabel.com/bmjaya-printing/uploads/${order.pola_file}`}
                        alt="Pola"
                        className="max-w-full h-auto rounded max-h-24 sm:max-h-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {order.deskripsi && (
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-300 rounded">
              <div className="bg-amber-100 px-2 py-1">
                <h3 className="font-bold text-sm text-primary-700">Deskripsi</h3>
              </div>
              <div className="p-2 text-xs">
                <div 
                  className="max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: order.deskripsi }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {order.catatan && (
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-300 rounded">
              <div className="bg-orange-100 px-2 py-1">
                <h3 className="font-bold text-sm text-primary-700">Catatan</h3>
              </div>
              <div className="p-2 text-xs">
                <p className="whitespace-pre-wrap text-gray-800">{order.catatan}</p>
              </div>
            </div>
          )}

          {/* Footer Signature */}
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t-2 border-gray-300">
            <p className="text-center text-xs text-gray-600 mb-1.5 sm:mb-2 font-semibold">Tanda Tangan & Paraf Pengerjaan:</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-0.5 sm:gap-1 text-center">
              {['Printing', 'Pres', 'Potong', 'Jahit', 'QC'].map((item) => (
                <div key={item} className="bg-gray-50 rounded p-1 border border-gray-200">
                  <p className="font-medium text-gray-700 mb-2 text-xs">{item}</p>
                  <div className="border-t border-gray-400 pt-0.5">
                    <p className="text-xs text-gray-500">&nbsp;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

OrderPreview.propTypes = {
  order: PropTypes.shape({
    no_order: PropTypes.string.isRequired,
    nama_pemesan: PropTypes.string,
    tanggal_order: PropTypes.string,
    tanggal_proof: PropTypes.string,
    tanggal_selesai: PropTypes.string,
    model_kerah: PropTypes.string,
    bahan: PropTypes.string,
    jaitan: PropTypes.string,
    total_order: PropTypes.number,
    jumlah_xs: PropTypes.number,
    jumlah_s: PropTypes.number,
    jumlah_m: PropTypes.number,
    jumlah_l: PropTypes.number,
    jumlah_xl: PropTypes.number,
    jumlah_xxl: PropTypes.number,
    jumlah_xxxl: PropTypes.number,
    desain_file: PropTypes.string,
    pola_file: PropTypes.string,
    deskripsi: PropTypes.string,
    catatan: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default OrderPreview;