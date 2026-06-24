import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, Search, ShieldAlert, Star, Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    const actionText = isActive ? 'Khóa' : 'Mở khóa';
    const confirmColor = isActive ? '#d33' : '#2ecc71';
    const result = await Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản này không?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#95a5a6',
      confirmButtonText: `Đồng ý ${actionText.toLowerCase()}`,
      cancelButtonText: 'Hủy thao tác'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8080/api/v1/admin/users/${id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Đã ${actionText.toLowerCase()} tài khoản thành công!`);
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data || 'Lỗi khi cập nhật trạng thái');
      }
    }
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
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

  const processedUsers = useMemo(() => {
    let sortableItems = users.filter(u => 
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm)
    );
    if (statusFilter === 'active') {
      sortableItems = sortableItems.filter(u => u.isActive === true);
    } else if (statusFilter === 'locked') {
      sortableItems = sortableItems.filter(u => u.isActive === false);
    }
    if (sortConfig.key !== null && sortConfig.direction !== 'default') {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, searchTerm, sortConfig, statusFilter]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-[#2c3e50] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#9b59b6]" /> Quản lý Người dùng
          </h1>
          <p className="text-gray-500 text-sm mt-1">Phân tích rủi ro và quản lý uy tín khách hàng</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" placeholder="Tìm kiếm tên, email, SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8f9fa] border-none rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#9b59b6] outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible flex flex-col min-h-[500px]">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse relative">
            <thead className="bg-[#f8f9fa] border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Khách hàng</th>
            
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 group transition-colors select-none"
                  onClick={() => requestSort('totalOrders')}
                >
                  <div className="flex justify-center items-center gap-1.5">
                    Tổng đơn
                    {getSortIcon('totalOrders')}
                  </div>
                </th>

                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Uy tín mua hàng</th>
                
                <th 
                  className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 group transition-colors select-none"
                  onClick={() => requestSort('avgRating')}
                >
                  <div className="flex justify-center items-center gap-1.5">
                    Đánh giá TB
                    {getSortIcon('avgRating')}
                  </div>
                </th>

                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center relative select-none">
                  <div 
                    className="flex justify-center items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    Trạng thái
                    <Filter className={`w-3.5 h-3.5 ${statusFilter !== 'all' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} />
                  </div>
                  
                  {isFilterOpen && (
                    <div className="absolute right-[50%] translate-x-[50%] top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 font-normal normal-case overflow-hidden">
                      <div 
                        className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-gray-50 ${statusFilter === 'all' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                        onClick={() => { setStatusFilter('all'); setIsFilterOpen(false); }}
                      >Tất cả</div>
                      <div className="border-b border-gray-100"></div>
                      <div 
                        className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-gray-50 flex justify-between ${statusFilter === 'active' ? 'font-bold text-[#2ecc71] bg-green-50/50' : 'text-gray-700'}`}
                        onClick={() => { setStatusFilter('active'); setIsFilterOpen(false); }}
                      >Đang hoạt động</div>
                      <div className="border-b border-gray-100"></div>
                      <div 
                        className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-gray-50 flex justify-between ${statusFilter === 'locked' ? 'font-bold text-[#e74c3c] bg-red-50/50' : 'text-gray-700'}`}
                        onClick={() => { setStatusFilter('locked'); setIsFilterOpen(false); }}
                      >Bị khóa</div>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">Đang tải dữ liệu khách hàng...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((u) => {
                  const cancelRate = u.totalOrders > 0 ? ((u.cancelledOrders / u.totalOrders) * 100).toFixed(0) : 0;
                  const isHighRisk = cancelRate > 50 && u.totalOrders > 2;

                  return (
                  <tr key={u.id} className={`transition-all duration-200 ${isHighRisk ? 'bg-red-50/20 hover:bg-red-50/50' : 'hover:bg-gray-50/70'}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#2c3e50] text-[15px]">{u.fullName}</div>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mt-1.5"><Mail className="w-3.5 h-3.5 opacity-70"/> {u.email}</div>
                      {u.phone && <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mt-1"><Phone className="w-3.5 h-3.5 opacity-70"/> {u.phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm border border-blue-100 shadow-sm">{u.totalOrders}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-5">
                        <div className="text-center" title="Đơn hoàn thành">
                           <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Thành công</div>
                           <div className="font-black text-[#2ecc71] text-[15px]">{u.completedOrders}</div>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center" title="Đơn đã hủy">
                           <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Hủy/Bom</div>
                           <div className={`font-black text-[15px] ${u.cancelledOrders > 0 ? 'text-[#e74c3c]' : 'text-gray-300'}`}>{u.cancelledOrders}</div>
                        </div>
                      </div>
                      {isHighRisk && <div className="text-[11px] font-bold text-red-500 mt-2 flex items-center justify-center gap-1 bg-red-50 py-0.5 px-2 rounded w-max mx-auto"><ShieldAlert className="w-3 h-3"/> Rủi ro cao</div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md text-amber-600 font-bold text-sm shadow-sm">
                          {u.avgRating > 0 ? u.avgRating.toFixed(1) : '-'} <Star className="w-4 h-4 fill-amber-500 text-amber-500"/>
                        </div>
                        {u.avgRating === 0 && <span className="text-[11px] text-gray-400 mt-1">Chưa có đánh giá</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${u.isActive ? 'bg-[#2ecc71] hover:bg-[#27ae60]' : 'bg-[#e74c3c] hover:bg-[#c0392b]'}`}
                          title={u.isActive ? "Đang hoạt động - Nhấn để Khóa" : "Bị khóa - Nhấn để Mở"}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${u.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${u.isActive ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
                          {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                       <Search className="w-12 h-12 mb-3 opacity-20" />
                       <span className="font-medium text-[15px]">Không tìm thấy người dùng nào phù hợp với bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto rounded-b-xl">
            <span className="text-[13px] text-gray-500">
              Hiển thị <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> - <span className="font-bold text-gray-800">{Math.min(indexOfLastItem, processedUsers.length)}</span> trong số <span className="font-bold text-gray-800">{processedUsers.length}</span>
            </span>
            <div className="flex gap-1.5">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-[13px] font-bold hover:bg-gray-50 disabled:opacity-40 transition-colors uppercase tracking-wider text-gray-600 shadow-sm">Trước</button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all shadow-sm ${currentPage === idx + 1 ? 'bg-[#2c3e50] text-white' : 'hover:bg-gray-50 border border-gray-200 text-gray-600'}`}>{idx + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-[13px] font-bold hover:bg-gray-50 disabled:opacity-40 transition-colors uppercase tracking-wider text-gray-600 shadow-sm">Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}