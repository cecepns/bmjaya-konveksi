# Implementasi Paginasi React Select di BM Jaya Printing

## Overview
Dokumentasi ini menjelaskan cara implementasi paginasi di React Select dengan AsyncSelect component untuk employee management pada Production Tab.

## Perubahan Backend (server.js)

### Endpoint: GET `/api/employees`
Endpoint ini sudah diupdate untuk mendukung pagination dan search:

```javascript
GET /api/employees?page=1&search=nama_karyawan

Query Parameters:
- page (opsional, default: 1): Halaman yang ingin ditampilkan
- search (opsional): Keyword pencarian (cari di: nama, no_telpon, email)

Response:
{
  "success": true,
  "employees": [
    { "id": 1, "nama": "John Doe", "no_telpon": "081234567890", "email": "john@example.com", ... },
    ...
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

**Feature:**
- ✅ Limit: 10 data per halaman
- ✅ Search: Cari berdasarkan nama, nomor telepon, atau email
- ✅ Sorting: Urut berdasarkan nama (ASC)
- ✅ Pagination: Support multiple pages

---

## Perubahan Frontend (ProductionTab.jsx)

### 1. Import AsyncSelect
```jsx
import AsyncSelect from 'react-select/async';
```

### 2. Function: loadEmployeesOptions
```jsx
const loadEmployeesOptions = async (searchValue = '') => {
  try {
    const token = localStorage.getItem('token');
    const page = 1; // Selalu mulai dari halaman 1
    
    // Build URL dengan parameter search
    let url = `https://api-inventory.isavralabel.com/bmjaya-printing/api/employees?page=${page}`;
    if (searchValue && searchValue.trim()) {
      url += `&search=${encodeURIComponent(searchValue)}`;
    }
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      return response.data.employees.map((emp) => ({
        value: emp.id,
        label: emp.nama,
        nama: emp.nama,
        no_telpon: emp.no_telpon,
        email: emp.email
      }));
    }
    return [];
  } catch (error) {
    console.error('Fetch employees error:', error);
    return [];
  }
};
```

**Penjelasan:**
- Function ini dipanggil oleh AsyncSelect untuk fetch data
- Saat user mengetik, `searchValue` berisi keyword yang dicari
- Default load menampilkan 10 karyawan pertama
- Return format: Array of options dengan `{ value, label }`

### 3. AsyncSelect Component
```jsx
<AsyncSelect
  name="pic_employee"
  loadOptions={loadEmployeesOptions}           // Function untuk load options
  defaultOptions={true}                        // ✅ Load default data saat init
  value={step.pic_id ? {
    value: step.pic_id,
    label: step.pic_nama || ''
  } : null}
  onChange={(option) => handleInputChange(step.step_number, 'pic_id', option ? option.value : null)}
  placeholder="-- Pilih Karyawan --"
  isClearable                                  // Tombol X untuk clear
  isSearchable                                 // Enable search input
  isMulti={false}                              // Single select (bukan multi)
  cacheOptions                                 // Cache hasil untuk performa
  classNamePrefix="react-select"
  noOptionsMessage={() => 'Tidak ada karyawan'}
  loadingMessage={() => 'Memuat...'}
  styles={{...}}
/>
```

**Key Props:**
- `loadOptions`: Function yang di-trigger saat dropdown dibuka atau user search
- `defaultOptions={true}`: **PENTING** - Memastikan data default dimuat saat select dibuka
- `cacheOptions`: Cache hasil search untuk mengurangi API calls
- `isClearable` & `isSearchable`: UX improvements

---

## Workflow

### Initial Load (Saat Select Dibuka)
1. AsyncSelect trigger `loadOptions('')` (dengan search string kosong)
2. Frontend kirim GET request: `/api/employees?page=1`
3. Backend return 10 data pertama + pagination info
4. Options ditampilkan di dropdown

### Saat User Search
1. User mengetik di search box
2. AsyncSelect trigger `loadOptions('search_query')`
3. Frontend kirim GET request: `/api/employees?page=1&search=search_query`
4. Backend filter data berdasarkan search term
5. Options updated dengan hasil search (max 10 data)

### Pagination (Jika diperlukan untuk load halaman berikutnya)
- Saat ini: Selalu fetch halaman 1 untuk search
- Untuk load page 2+: Perlu tambahan logic dengan `onMenuScrollToBottom` event

---

## Features & Keunggulan

| Feature | Status | Keterangan |
|---------|--------|-----------|
| Default Load | ✅ | 10 data pertama muncul saat select dibuka |
| Search Real-time | ✅ | Search by nama, no_telpon, atau email |
| Pagination | ✅ | Backend support, frontend dapat di-extend untuk infinite scroll |
| Caching | ✅ | Cache options untuk perf optimal |
| Loading State | ✅ | Tampil "Memuat..." saat fetch data |
| Empty State | ✅ | Tampil "Tidak ada karyawan" jika tidak ada hasil |
| Clearable | ✅ | User bisa clear selection dengan tombol X |
| Searchable | ✅ | Search input untuk filter quick |

---

## Contoh Implementasi Infinite Scroll (Optional)

Jika Anda ingin tambah fitur infinite scroll untuk load halaman berikutnya:

```jsx
const [employeePage, setEmployeePage] = useState(1);
const [allEmployeeOptions, setAllEmployeeOptions] = useState([]);

const loadEmployeesOptionsWithInfiniteScroll = async (searchValue = '', page = 1) => {
  try {
    const token = localStorage.getItem('token');
    let url = `https://api-inventory.isavralabel.com/bmjaya-printing/api/employees?page=${page}`;
    
    if (searchValue && searchValue.trim()) {
      url += `&search=${encodeURIComponent(searchValue)}`;
    }
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const newOptions = response.data.employees.map((emp) => ({
        value: emp.id,
        label: emp.nama,
      }));
      
      // Append ke existing options jika bukan halaman pertama
      if (page > 1) {
        setAllEmployeeOptions(prev => [...prev, ...newOptions]);
      } else {
        setAllEmployeeOptions(newOptions);
      }
      
      return {
        options: page > 1 ? [...allEmployeeOptions, ...newOptions] : newOptions,
        hasMore: response.data.pagination.currentPage < response.data.pagination.totalPages
      };
    }
    
    return { options: [], hasMore: false };
  } catch (error) {
    console.error('Fetch employees error:', error);
    return { options: [], hasMore: false };
  }
};

// Di AsyncSelect, tambahkan:
onMenuScrollToBottom={() => {
  if (employeePage < totalPages) {
    setEmployeePage(prev => prev + 1);
  }
}}
```

---

## Testing Checklist

- [ ] Saat select dibuka, 10 karyawan pertama muncul
- [ ] Search berfungsi dengan keyword nama
- [ ] Search berfungsi dengan keyword no_telpon
- [ ] Search berfungsi dengan keyword email
- [ ] Loading message muncul saat fetch
- [ ] Empty state muncul saat search tidak ada hasil
- [ ] Cached options digunakan untuk prevent duplicate API calls
- [ ] Bisa clear selection dengan tombol X
- [ ] Selected value tampil di select control

---

## Troubleshooting

### Problem: Select dibuka tapi tidak ada default options
**Solution:** Pastikan `defaultOptions={true}` sudah di-set di AsyncSelect

### Problem: Search tidak bekerja
**Solution:** Cek apakah backend API response includes `pagination` object

### Problem: Multiple API calls saat search
**Solution:** Sudah tercovered dengan `cacheOptions` prop

### Problem: Label tidak muncul saat value sudah dipilih
**Solution:** Pastikan object value memiliki `label` property, atau gunakan `formatOptionLabel` prop

---

## Referensi

- [React Select Async](https://react-select.com/async)
- [React Select Caching Options](https://react-select.com/async#caching)
- Dokumentasi Backend: `/backend/server.js` line 402-450

