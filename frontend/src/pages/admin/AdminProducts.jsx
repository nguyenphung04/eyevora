import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, X, ImagePlus, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [categoryFilter, setCategoryFilter] = useState('all'); 
  
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5; 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const materials = ['Nhựa', 'Kim loại']; 
  const shapes = ['Tròn', 'Vuông', 'Chữ nhật'];

  const [formData, setFormData] = useState({
    id: null, name: '', categoryId: '', basePrice: '', material: '', shape: '', description: '',
    variants: [{ colorName: 'Mặc định', stockQuantity: 0, images: [] }]
  });
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      const [productRes, categoryRes] = await Promise.all([
        axios.get('http://localhost:8080/api/v1/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/v1/categories')
      ]);
      
      setProducts(productRes.data.sort((a, b) => b.id - a.id));
      setCategories(categoryRes.data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, categoryFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    else if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'default';
      key = null; 
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100" />;
    if (sortConfig.direction === 'desc') return <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-50 group-hover:opacity-100" />;
  };

  const processedProducts = useMemo(() => {
    let list = [...products];

    if (searchTerm) list = list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter === 'active') list = list.filter(p => p.isActive !== false);
    if (statusFilter === 'inactive') list = list.filter(p => p.isActive === false);

    if (categoryFilter !== 'all') {
      list = list.filter(p => p.categoryName?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (sortConfig.key && sortConfig.direction !== 'default') {
      list.sort((a, b) => {
        const valA = a[sortConfig.key] || 0;
        const valB = b[sortConfig.key] || 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [products, searchTerm, statusFilter, categoryFilter, sortConfig]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = processedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(processedProducts.length / productsPerPage);

  const openAddModal = () => {
    setModalMode('add');
    const defaultCatId = categories.length > 0 ? categories[0].id : '';
    setFormData({
      id: null, name: '', categoryId: defaultCatId, basePrice: '', material: '', shape: '', description: '',
      variants: [{ colorName: 'Mặc định', stockQuantity: 0, images: [] }]
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (product) => {
    setModalMode('edit');
    setIsModalOpen(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/v1/products/${product.id}`);
      const detail = res.data;
      const matchedCat = categories.find(c => c.name === detail.categoryName);
      const catId = matchedCat ? matchedCat.id : (categories.length > 0 ? categories[0].id : '');

      setFormData({
        id: detail.id, name: detail.name, categoryId: catId, basePrice: detail.basePrice, material: detail.material || '',
        shape: detail.shape || '', description: detail.description || '',
        variants: detail.variants?.length > 0 ? [{
            ...detail.variants[0],
            images: detail.variants[0].images ? detail.variants[0].images.split(',').map(s => s.trim()).filter(s => s !== "") : []
        }] : [{ colorName: 'Mặc định', stockQuantity: 0, images: [] }]
      });
    } catch (error) { toast.error("Không thể lấy thông tin chi tiết sản phẩm!"); }
  };

  const closeModal = () => setIsModalOpen(false);

  const handleStockChange = (value) => {
    const newVariants = [...formData.variants];
    newVariants[0].stockQuantity = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const removeImage = (imageIndex) => {
    const newVariants = [...formData.variants];
    newVariants[0].images = newVariants[0].images.filter((_, i) => i !== imageIndex);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const currentImages = formData.variants[0].images;
    if (currentImages.length + files.length > 4) {
      toast.warning("Chỉ được tải lên tối đa 4 ảnh!");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Đang tải ảnh lên Cloudinary...");
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', 'eyevora_preset'); 
        form.append('cloud_name', 'dqkhy4odr');
        const res = await axios.post('https://api.cloudinary.com/v1_1/dqkhy4odr/image/upload', form);
        uploadedUrls.push(res.data.secure_url);
      }
      const newVariants = [...formData.variants];
      newVariants[0].images = [...currentImages, ...uploadedUrls];
      setFormData({ ...formData, variants: newVariants });
      toast.update(toastId, { render: "Tải ảnh thành công!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.update(toastId, { render: "Lỗi tải ảnh!", type: "error", isLoading: false, autoClose: 4000 });
    } finally {
      setIsSubmitting(false);
      e.target.value = null; 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.material || !formData.shape) {
       toast.warning("Vui lòng chọn đầy đủ Chất liệu và Kiểu dáng!");
       return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name, categoryId: parseInt(formData.categoryId), basePrice: parseFloat(formData.basePrice),
        material: formData.material, shape: formData.shape, brand: '', description: formData.description,
        variants: [{
          ...formData.variants[0], stockQuantity: parseInt(formData.variants[0].stockQuantity), images: formData.variants[0].images.join(',') 
        }]
      };
      if (modalMode === 'add') {
        await axios.post('http://localhost:8080/api/v1/admin/products', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Thêm sản phẩm thành công!");
      } else {
        await axios.put(`http://localhost:8080/api/v1/admin/products/${formData.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Cập nhật sản phẩm thành công!");
      }
      closeModal();
      fetchData();
    } catch (error) { toast.error("Có lỗi xảy ra khi lưu sản phẩm!"); } finally { setIsSubmitting(false); }
  };

const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus === false ? "mở bán lại" : "ngừng kinh doanh";
    const confirmColor = currentStatus === false ? '#2ecc71' : '#e74c3c'; 

    const result = await Swal.fire({
      title: `Xác nhận ${action}?`,
      text: `Bạn có chắc chắn muốn ${action} sản phẩm này không?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#95a5a6',
      confirmButtonText: `Đồng ý ${action}`,
      cancelButtonText: 'Hủy thao tác'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8080/api/v1/admin/products/${id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Đã ${action} sản phẩm thành công!`);
        fetchData();
      } catch (error) { 
        toast.error("Không thể cập nhật trạng thái sản phẩm!"); 
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 min-h-[500px] relative flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản Lý Sản Phẩm</h2>

      <div className="flex justify-between items-center mb-6">
        <div className="flex w-full max-w-md">
          <input 
            type="text" 
            placeholder="Tìm tên sản phẩm..." 
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2.5 text-sm outline-none focus:border-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="bg-[#2c3e50] text-white px-5 rounded-r-lg hover:bg-[#1a252f] transition-colors flex items-center justify-center">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#2ecc71] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#27ae60] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Sản Phẩm
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase font-bold">
            <tr>
              <th className="p-4 border-b w-24 text-center">Ảnh</th>
              <th className="p-4 border-b w-1/3">Tên Kính Mắt</th>
              
              <th className="p-4 border-b relative select-none">
                <div 
                  className="flex items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors"
                  onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                >
                  Danh Mục
                  <Filter className={`w-3.5 h-3.5 ${categoryFilter !== 'all' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} />
                </div>
                {isCategoryFilterOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 font-normal normal-case">
                    <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${categoryFilter === 'all' ? 'font-bold text-blue-600' : ''}`} onClick={() => { setCategoryFilter('all'); setIsCategoryFilterOpen(false); }}>Tất cả danh mục</div>
                    {categories.map(c => (
                        <div key={c.id} className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${categoryFilter === c.name ? 'font-bold text-blue-600' : ''}`} onClick={() => { setCategoryFilter(c.name); setIsCategoryFilterOpen(false); }}>{c.name}</div>
                    ))}
                  </div>
                )}
              </th>

              <th 
                className="p-4 border-b text-center cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => requestSort('basePrice')}
              >
                <div className="flex justify-center items-center gap-1.5">Giá (VND) {getSortIcon('basePrice')}</div>
              </th>

              <th className="p-4 border-b text-center relative select-none">
                <div 
                  className="flex justify-center items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors"
                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                >
                  Trạng thái
                  <Filter className={`w-3.5 h-3.5 ${statusFilter !== 'all' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} />
                </div>
                {isStatusFilterOpen && (
                  <div className="absolute right-[50%] translate-x-[50%] top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 font-normal normal-case text-left">
                    <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'all' ? 'font-bold text-blue-600' : ''}`} onClick={() => { setStatusFilter('all'); setIsStatusFilterOpen(false); }}>Tất cả</div>
                    <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'active' ? 'font-bold text-green-600' : ''}`} onClick={() => { setStatusFilter('active'); setIsStatusFilterOpen(false); }}>Đang bán</div>
                    <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'inactive' ? 'font-bold text-red-600' : ''}`} onClick={() => { setStatusFilter('inactive'); setIsStatusFilterOpen(false); }}>Ngưng bán</div>
                  </div>
                )}
              </th>

              <th 
                className="p-4 border-b text-center cursor-pointer hover:bg-gray-100 transition-colors select-none group"
                onClick={() => requestSort('totalStock')}
              >
                <div className="flex justify-center items-center gap-1.5">Số lượng {getSortIcon('totalStock')}</div>
              </th>

              <th className="p-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>
            ) : currentProducts.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-10 text-gray-400">Không tìm thấy sản phẩm nào.</td></tr>
            ) : (
              currentProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors border-b border-gray-100 group ${product.isActive === false ? 'bg-gray-50/50' : ''}`}>
                  <td className="p-4 text-center">
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/150'} 
                      alt="" 
                      className={`w-12 h-12 rounded object-cover mx-auto border border-gray-200 ${product.isActive === false ? 'opacity-50 grayscale' : ''}`}
                    />
                  </td>
                  <td className={`p-4 font-bold ${product.isActive === false ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{product.name}</td>
                  <td className={`p-4 ${product.isActive === false ? 'text-gray-400' : 'text-gray-600'}`}>{product.categoryName}</td>
                  <td className={`p-4 font-bold ${product.isActive === false ? 'text-gray-400' : 'text-red-600'}`}>{product.basePrice?.toLocaleString()} đ</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${product.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {product.isActive !== false ? 'Đang bán' : 'Ngưng bán'}
                    </span>
                  </td>
                  <td className={`p-4 text-center font-bold ${product.isActive === false ? 'text-gray-400' : 'text-[#3498db]'}`}>Kho: {product.totalStock || 0}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="bg-[#3498db] text-white p-1.5 rounded hover:bg-[#2980b9] transition-colors"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(product.id, product.isActive)}
                        className={`p-1.5 rounded transition-colors ${product.isActive !== false ? 'bg-[#e74c3c] hover:bg-[#c0392b] text-white' : 'bg-[#2ecc71] hover:bg-[#27ae60] text-white'}`}
                        title={product.isActive !== false ? "Ngừng kinh doanh" : "Mở bán lại"}
                      >
                        {product.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && processedProducts.length > 0 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <span>Hiển thị <strong className="text-black">{indexOfFirstProduct + 1}</strong> - <strong className="text-black">{Math.min(indexOfLastProduct, processedProducts.length)}</strong> / <strong className="text-black">{processedProducts.length}</strong></span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-200 rounded text-xs font-bold hover:bg-gray-50 disabled:opacity-50">Trước</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center border rounded text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-[#2c3e50] text-white border-[#2c3e50]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-200 rounded text-xs font-bold hover:bg-gray-50 disabled:opacity-50">Sau</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{modalMode === 'add' ? 'Thêm Sản Phẩm Mới' : 'Sửa Thông Tin Kính Mắt'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tên Kính Mắt *</label>
                    <input required type="text" className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Danh Mục (Động)*</label>
                    <select required className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none bg-white" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: parseInt(e.target.value)})}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Giá cơ bản (VND) *</label>
                    <input required type="number" min="0" className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số lượng kho *</label>
                    <input required type="number" min="0" className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none" value={formData.variants[0].stockQuantity} onChange={e => handleStockChange(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chất liệu (Phục vụ bộ lọc) *</label>
                    <select required className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none bg-white" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
                      <option value="">-- Chọn chất liệu --</option>
                      {materials.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kiểu dáng (Phục vụ bộ lọc) *</label>
                    <select required className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none bg-white" value={formData.shape} onChange={e => setFormData({...formData, shape: e.target.value})}>
                      <option value="">-- Chọn kiểu dáng --</option>
                      {shapes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đặc điểm / Mô tả</label>
                    <textarea rows="3" className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-sm font-bold text-gray-800 uppercase mb-4">Hình ảnh sản phẩm (Tối đa 4 ảnh)</h4>
                  <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {formData.variants[0].images.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative w-20 h-20 border border-gray-200 rounded-md bg-white shadow-sm group/img">
                        <img src={img} className="w-full h-full object-cover rounded-md" alt="" />
                        <button type="button" onClick={() => removeImage(imgIdx)} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm hover:bg-red-500"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {formData.variants[0].images.length < 4 && (
                      <label className={`w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-500 font-bold">Thêm ảnh</span>
                        <input type="file" className="hidden" accept="image/*" multiple disabled={isSubmitting} onChange={handleFileUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">Hủy</button>
              <button type="submit" form="productForm" disabled={isSubmitting} className="px-8 py-2.5 bg-[#2c3e50] text-white rounded-lg text-sm font-bold hover:bg-[#1a252f] transition-colors disabled:opacity-50">{isSubmitting ? 'Đang lưu...' : 'Lưu Sản Phẩm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}