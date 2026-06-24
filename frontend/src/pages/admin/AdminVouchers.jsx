import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Ticket, Plus, X, Search, RefreshCw, Info, Filter, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all'); 
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const currentLocalTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    code: '', discountType: 'FIXED_AMOUNT', discountValue: '', maxDiscountAmount: '',
    minOrderValue: '', description: '', usageLimit: 100, startDate: '', endDate: ''
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/admin/vouchers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedData = res.data.sort((a, b) => b.id - a.id);
      setVouchers(sortedData);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách Voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/v1/admin/vouchers/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Đã cập nhật trạng thái!');
      fetchVouchers(); 
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleGenerateCode = () => {
    const randomCode = 'EYE' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData({ ...formData, code: randomCode });
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      code: '', discountType: 'FIXED_AMOUNT', discountValue: '', maxDiscountAmount: '',
      minOrderValue: '', description: '', usageLimit: 100, startDate: '', endDate: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setModalMode('edit');
    setEditingId(v.id);
    setFormData({
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue,
      maxDiscountAmount: v.maxDiscountAmount || '',
      minOrderValue: v.minOrderValue || '',
      description: v.description || '',
      usageLimit: v.usageLimit,
      startDate: v.startDate ? v.startDate.slice(0, 16) : '',
      endDate: v.endDate ? v.endDate.slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();

    if (start < now && modalMode === 'add') {
      toast.error('Ngày bắt đầu không được nằm trong quá khứ!');
      return; 
    }
    if (end <= start) {
      toast.error('Ngày kết thúc phải diễn ra SAU ngày bắt đầu!');
      return; 
    }

    if (formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100) {
      toast.error('Phần trăm giảm giá không được vượt quá 100%!');
      return;
    }
    if (formData.discountType === 'FIXED_AMOUNT' && Number(formData.discountValue) < 10000) {
      toast.error('Giá trị giảm tiền mặt tối thiểu phải là 10.000đ.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      if (modalMode === 'add') {
        await axios.post('http://localhost:8080/api/v1/admin/vouchers', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Tạo Voucher thành công!');
      } else {
        await axios.put(`http://localhost:8080/api/v1/admin/vouchers/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật Voucher thành công!');
      }
      
      setShowModal(false);
      fetchVouchers();
    } catch (error) {
      const resData = error.response?.data;
      let errorMsg = 'Lỗi hệ thống. Vui lòng thử lại!';
      
      if (resData) {
        if (typeof resData === 'string') errorMsg = resData;
        else if (resData.message) errorMsg = resData.message;
      }
      
      if (errorMsg.includes('Duplicate entry') || errorMsg.includes('tồn tại') || errorMsg.includes('ConstraintViolation')) {
         errorMsg = 'Mã Code này đã tồn tại trong hệ thống. Vui lòng đổi mã khác!';
      }
      toast.error(errorMsg);
    }
  };

  const processedVouchers = useMemo(() => {
    let list = [...vouchers];
    if (searchTerm) {
      list = list.filter(v => v.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter === 'active') list = list.filter(v => v.isActive === true);
    if (statusFilter === 'inactive') list = list.filter(v => v.isActive === false);
    return list;
  }, [vouchers, searchTerm, statusFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedVouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedVouchers.length / itemsPerPage);

  return (
    <div className="p-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-[#2c3e50] flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#f1c40f]" /> Quản lý Voucher
          </h1>
          <p className="text-gray-500 text-sm mt-1">Hỗ trợ giảm giá tiền mặt và phần trăm cho khách hàng EYEVORA</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-[#2c3e50] hover:bg-[#34495e] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Tạo mã mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" placeholder="Tìm kiếm theo mã code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f8f9fa] border-none rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#f1c40f] outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible flex flex-col min-h-[400px]">
        <div className="overflow-visible">
          <table className="w-full text-left">
            <thead className="bg-[#f8f9fa] border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Mã / Mô tả</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Giá trị giảm</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-48">Tiến độ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Thời gian</th>
                
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center relative select-none">
                  <div 
                    className="flex justify-center items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors"
                    onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                  >
                    Hoạt động
                    <Filter className={`w-3.5 h-3.5 ${statusFilter !== 'all' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} />
                  </div>
                  {isStatusFilterOpen && (
                    <div className="absolute right-[50%] translate-x-[50%] top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 font-normal normal-case text-left">
                      <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'all' ? 'font-bold text-blue-600' : ''}`} onClick={() => { setStatusFilter('all'); setIsStatusFilterOpen(false); }}>Tất cả</div>
                      <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'active' ? 'font-bold text-green-600' : ''}`} onClick={() => { setStatusFilter('active'); setIsStatusFilterOpen(false); }}>Đang hoạt động</div>
                      <div className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === 'inactive' ? 'font-bold text-gray-600' : ''}`} onClick={() => { setStatusFilter('inactive'); setIsStatusFilterOpen(false); }}>Đã khóa</div>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((v) => (
                  <tr key={v.id} className={`transition-colors ${v.isActive ? 'hover:bg-gray-50/50' : 'bg-gray-50/80 opacity-70'}`}>
                    <td className="px-6 py-4">
                      <div className={`font-bold text-[15px] ${v.isActive ? 'text-[#2c3e50]' : 'text-gray-500 line-through'}`}>{v.code}</div>
                      <div className="text-[12px] text-gray-400 mt-1 max-w-[200px] truncate" title={v.description}>{v.description || 'Không có mô tả'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${v.isActive ? 'text-[#2ecc71]' : 'text-gray-500'}`}>
                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}đ`}
                      </div>
                      <div className="text-[12px] text-gray-500 mt-1">Đơn từ: {v.minOrderValue?.toLocaleString()}đ</div>
                      {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount > 0 && (
                         <div className="text-[11px] text-[#e67e22] mt-0.5">Tối đa: {v.maxDiscountAmount.toLocaleString()}đ</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">Đã dùng: <span className={`font-bold ${v.usedCount >= v.usageLimit ? 'text-red-500' : 'text-[#3498db]'}`}>{v.usedCount}</span> / {v.usageLimit}</div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className={`${v.usedCount >= v.usageLimit ? 'bg-red-500' : 'bg-[#3498db]'} h-full transition-all duration-500`} style={{ width: `${Math.min((v.usedCount / v.usageLimit) * 100, 100)}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[12px] text-gray-600">Từ: {new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[12px] text-gray-600 mt-1">Đến: {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(v.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${v.isActive ? 'bg-[#2ecc71]' : 'bg-gray-300'}`}
                          title={v.isActive ? "Đang phát hành - Nhấn để ngưng" : "Đã khóa - Nhấn để mở"}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${v.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Không tìm thấy voucher nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white mt-auto rounded-b-xl">
            <span className="text-sm text-gray-500">
              Hiển thị <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> - <span className="font-bold text-gray-800">{Math.min(indexOfLastItem, processedVouchers.length)}</span> trong số <span className="font-bold text-gray-800">{processedVouchers.length}</span> voucher
            </span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Trước</button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === idx + 1 ? 'bg-[#2c3e50] text-white shadow-sm' : 'hover:bg-gray-50 text-gray-600'}`}>{idx + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Sau</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="font-bold text-[#2c3e50] text-lg">
                {modalMode === 'add' ? 'Tạo Mã Giảm Giá Mới' : 'Cập nhật Mã Giảm Giá'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                
                <div className="col-span-2 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                      Mã Code {modalMode === 'edit' && <span className="text-red-500 font-normal normal-case">(Không được phép sửa)</span>}
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.code} 
                      disabled={modalMode === 'edit'}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                      className={`w-full bg-[#f8f9fa] border rounded-lg px-4 py-2.5 text-sm font-bold uppercase outline-none ${modalMode === 'edit' ? 'border-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-200 focus:border-[#f1c40f]'}`} 
                      placeholder="VD: SALE50K" 
                    />
                  </div>
                  {modalMode === 'add' && (
                    <button type="button" onClick={handleGenerateCode} className="px-4 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-lg text-sm hover:bg-blue-100 flex items-center gap-2 transition-colors">
                      <RefreshCw className="w-4 h-4" /> Random
                    </button>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Mô tả (Dành cho khách hàng xem)</label>
                  <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none" placeholder="VD: Giảm giá dành cho thành viên mới..." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Loại giảm giá</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none">
                    <option value="FIXED_AMOUNT">Giảm tiền mặt (VNĐ)</option>
                    <option value="PERCENTAGE">Giảm theo Phần trăm (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                    {formData.discountType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max={formData.discountType === 'PERCENTAGE' ? 100 : undefined} 
                    value={formData.discountValue} 
                    onChange={e => setFormData({...formData, discountValue: e.target.value})} 
                    className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none" 
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1">Giảm tối đa (VNĐ) <Info className="w-3 h-3 text-gray-400" title="Nếu để trống sẽ không giới hạn số tiền giảm"/></label>
                    <input type="number" min="0" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none" placeholder="Để trống nếu không giới hạn" />
                  </div>
                )}

                <div className={formData.discountType === 'PERCENTAGE' ? '' : 'col-span-2'}>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1">Đơn tối thiểu (VNĐ) <Info className="w-3 h-3 text-gray-400" title="Đơn hàng phải lớn hơn mức này mới áp dụng được"/></label>
                  <input type="number" min="0" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: e.target.value})} className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none" placeholder="VD: 0" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tổng số lượt sử dụng</label>
                  <input type="number" required min="1" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Ngày bắt đầu</label>
                  <input 
                    type="datetime-local" 
                    required 
                    min={modalMode === 'add' ? currentLocalTime : undefined} 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none cursor-pointer" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Ngày kết thúc</label>
                  <input 
                    type="datetime-local" 
                    required 
                    min={formData.startDate || currentLocalTime} 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-[#f1c40f] outline-none cursor-pointer" 
                  />
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-[#f1c40f] hover:bg-[#f39c12] text-black rounded-lg shadow-sm transition-colors">
                  {modalMode === 'add' ? 'Lưu Voucher' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}