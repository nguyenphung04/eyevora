import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Package, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Filter, Eye, EyeOff, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export default function AdminCategory() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });
    const [statusFilter, setStatusFilter] = useState('all'); 
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => { setCurrentPage(1); }, [statusFilter, sortConfig]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories/stats');
            setCategories(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi lấy thống kê danh mục:", err);
            setLoading(false);
        }
    };

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

    const processedCategories = useMemo(() => {
        let list = [...categories];

        if (statusFilter === 'active') list = list.filter(c => c.isActive !== false);
        if (statusFilter === 'inactive') list = list.filter(c => c.isActive === false);

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
    }, [categories, statusFilter, sortConfig]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = processedCategories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedCategories.length / itemsPerPage);

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
        } else {
            setEditingCategory(null);
            setCategoryName('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, { name: categoryName }, config);
                toast.success('Đã cập nhật tên danh mục thành công!');
            } else {
                await api.post('/categories', { name: categoryName }, config);
                toast.success('Đã thêm danh mục mới thành công!');
            }
            setIsModalOpen(false);
            fetchCategories(); 
        } catch (err) {
            toast.error('Không thể lưu danh mục. Vui lòng thử lại!');
        }
    };

    const handleToggleStatus = async (category) => {
        if (category.isActive !== false && category.productCount > 0) {
            toast.warning(`Không thể khóa! Danh mục "${category.name}" đang có ${category.productCount} sản phẩm.`);
            return;
        }

        const actionText = category.isActive !== false ? 'khóa' : 'mở khóa';
        const result = await Swal.fire({
            title: `Xác nhận ${actionText}?`,
            text: `Bạn có chắc muốn ${actionText} danh mục "${category.name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await api.put(`/categories/${category.id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
                toast.success(`Danh mục đã được ${actionText} thành công!`);
                fetchCategories();
            } catch (err) {
                Swal.fire('Lỗi', err.response?.data || 'Có lỗi xảy ra', 'error');
            }
        }
    };

    const handleHardDelete = async (category) => {
        if (category.productCount > 0) return; 

        const result = await Swal.fire({
            title: 'Xóa vĩnh viễn?',
            text: `Bạn có chắc muốn XÓA CỨNG danh mục "${category.name}"? Hành động này sẽ xóa dữ liệu khỏi Database và không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa vĩnh viễn',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await api.delete(`/categories/${category.id}`, { headers: { Authorization: `Bearer ${token}` } });
                toast.success('Danh mục đã bị xóa vĩnh viễn khỏi hệ thống!');
                fetchCategories();
            } catch (err) {
                toast.error(err.response?.data || 'Không thể xóa danh mục!');
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="p-8 bg-white min-h-screen flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh mục</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý các loại kính mắt trong hệ thống EYEVORA</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#2ecc71] text-white px-5 py-2.5 rounded-lg hover:bg-[#27ae60] transition-all font-bold text-sm shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Thêm danh mục
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-visible shadow-sm flex-1 flex flex-col">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs uppercase font-bold text-gray-500 tracking-wider">ID</th>
                            <th className="px-6 py-4 text-xs uppercase font-bold text-gray-500 tracking-wider">Tên danh mục</th>
                            
                            <th 
                                className="px-6 py-4 text-xs uppercase font-bold text-gray-500 tracking-wider text-center cursor-pointer hover:bg-gray-100 group transition-colors select-none"
                                onClick={() => requestSort('productCount')}
                            >
                                <div className="flex justify-center items-center gap-1.5">
                                    Số lượng sản phẩm
                                    {getSortIcon('productCount')}
                                </div>
                            </th>

                            <th className="px-6 py-4 text-xs uppercase font-bold text-gray-500 tracking-wider text-center relative select-none">
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
                                        <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'active' ? 'font-bold text-green-600' : ''}`} onClick={() => { setStatusFilter('active'); setIsStatusFilterOpen(false); }}>Đang hoạt động</div>
                                        <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'inactive' ? 'font-bold text-red-600' : ''}`} onClick={() => { setStatusFilter('inactive'); setIsStatusFilterOpen(false); }}>Bị khóa</div>
                                    </div>
                                )}
                            </th>

                            <th className="px-6 py-4 text-xs uppercase font-bold text-gray-500 tracking-wider text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {currentItems.length > 0 ? (
                            currentItems.map((cat) => (
                                <tr key={cat.id} className={`hover:bg-gray-50 transition-colors ${cat.isActive === false ? 'bg-gray-50/50' : ''}`}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{cat.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-bold ${cat.isActive === false ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{cat.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${cat.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
                                            <Package className="w-3 h-3" />
                                            {cat.productCount} sản phẩm
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${cat.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                            {cat.isActive !== false ? 'Đang hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(cat)}
                                                className="bg-[#3498db] text-white p-1.5 rounded hover:bg-[#2980b9] transition-colors shadow-sm"
                                                title="Sửa tên"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleToggleStatus(cat)}
                                                className={`p-1.5 rounded transition-colors shadow-sm ${cat.isActive !== false ? 'bg-[#e74c3c] hover:bg-[#c0392b] text-white' : 'bg-[#2ecc71] hover:bg-[#27ae60] text-white'}`}
                                                title={cat.isActive !== false ? "Khóa danh mục" : "Mở khóa danh mục"}
                                            >
                                                {cat.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>

                                            <button 
                                                onClick={() => handleHardDelete(cat)}
                                                disabled={cat.productCount > 0}
                                                className={`p-1.5 rounded transition-colors shadow-sm ${cat.productCount > 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'}`}
                                                title={cat.productCount > 0 ? "Không thể xóa cứng (đang có sản phẩm)" : "Xóa vĩnh viễn khỏi Database"}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">Không có danh mục nào.</td></tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto rounded-b-xl">
                        <span className="text-sm text-gray-500">
                            Hiển thị <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> - <span className="font-bold text-gray-800">{Math.min(indexOfLastItem, processedCategories.length)}</span> trong số <span className="font-bold text-gray-800">{processedCategories.length}</span> danh mục
                        </span>
                        <div className="flex gap-1">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Trước</button>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === idx + 1 ? 'bg-[#2ecc71] text-white shadow-sm' : 'hover:bg-gray-50 text-gray-600'}`}>{idx + 1}</button>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Sau</button>
                        </div>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tên danh mục</label>
                                <input 
                                    type="text" required autoFocus value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-0 outline-none transition-all text-gray-800"
                                    placeholder="Ví dụ: Kính Trẻ Em, Kính Thể Thao..."
                                />
                                {editingCategory && (
                                    <div className="mt-3 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs leading-relaxed">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>Lưu ý: Thay đổi tên danh mục sẽ cập nhật ngay lập tức trên thanh Menu và Trang chủ của khách hàng.</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors uppercase text-xs">Hủy</button>
                                <button type="submit" className="flex-1 px-6 py-3 bg-[#2c3e50] text-white rounded-xl font-bold hover:bg-[#1a252f] transition-colors uppercase text-xs shadow-lg">{editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}