import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Eye, Search, X, ArrowUpDown, ArrowUp, ArrowDown, Filter, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'default' });
  const [paymentFilter, setPaymentFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [isPaymentFilterOpen, setIsPaymentFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5; 
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false); 
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedOrders = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, paymentFilter, statusFilter, sortConfig]);
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
  const processedOrders = useMemo(() => {
    let list = [...orders];
    if (searchTerm) {
        list = list.filter(o => 
            o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.receiverPhone.includes(searchTerm)
        );
    }
    if (paymentFilter !== 'all') list = list.filter(o => o.paymentMethod === paymentFilter);
    if (statusFilter !== 'all') {
      if (statusFilter === 'REFUND_PENDING') {
        list = list.filter(o => o.orderStatus === 'CANCELLED' && o.paymentMethod === 'VNPAY' && o.paymentStatus === 'PAID');
      } else {
        list = list.filter(o => o.orderStatus === statusFilter);
      }
    }
    if (sortConfig.key && sortConfig.direction !== 'default') {
        list.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (sortConfig.key === 'createdAt') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return list;
  }, [orders, searchTerm, paymentFilter, statusFilter, sortConfig]);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = processedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(processedOrders.length / ordersPerPage);
  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === selectedOrder.orderStatus) {
      toast.info("Vui lòng chọn một trạng thái mới khác trạng thái hiện tại.");
      return;
    }
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/v1/admin/orders/${selectedOrder.id}/status`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Cập nhật trạng thái thành công!");
      setSelectedOrder(prev => ({...prev, orderStatus: newStatus}));
      fetchOrders(); 
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefundOrder = async () => {
    if (selectedOrder.orderStatus !== 'CANCELLED') {
        toast.warning("Vui lòng bấm 'Cập nhật' trạng thái Hủy đơn hàng trước khi thực hiện Hoàn tiền!");
        return;
    }
    if (result.isConfirmed){
      setIsRefunding(true);
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8080/api/v1/admin/orders/${selectedOrder.id}/refund`, {}, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        toast.success("Đã xác nhận hoàn tiền thành công!");
        setSelectedOrder(prev => ({...prev, paymentStatus: 'REFUNDED'}));
        fetchOrders();
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi xác nhận hoàn tiền!");
      } finally {
      setIsRefunding(false);
      }
    }
  };

  const getStatusUI = (status) => {
    const map = {
      PENDING: { label: "Chờ xác nhận", css: "bg-yellow-100 text-yellow-700" },
      CONFIRMED: { label: "Đã xác nhận", css: "bg-blue-100 text-blue-700" },
      SHIPPING: { label: "Đang giao", css: "bg-orange-100 text-orange-700" },
      COMPLETED: { label: "Hoàn thành", css: "bg-green-100 text-green-700" },
      CANCELLED: { label: "Đã hủy", css: "bg-red-100 text-red-700" }
    };
    const res = map[status] || { label: status, css: "bg-gray-100 text-gray-700" };
    return <span className={`${res.css} px-3 py-1 rounded-md text-[11px] font-bold block w-max mx-auto`}>{res.label}</span>;
  };

  const getPaymentStatusUI = (order, currentSelectedStatus) => {
    if (order.paymentMethod === 'COD') {
       if (order.orderStatus === 'COMPLETED' || order.paymentStatus === 'PAID') return <span className="text-green-600 font-bold">Đã thanh toán</span>;
       return <span className="text-yellow-600 font-bold">Chưa thanh toán</span>;
    }
    if (order.paymentMethod === 'VNPAY') {
       if (order.paymentStatus === 'REFUNDED') return <span className="text-green-600 font-bold">Đã hoàn tiền</span>;
       if (order.paymentStatus === 'PAID') {
           if (order.orderStatus === 'CANCELLED' || currentSelectedStatus === 'CANCELLED') return <span className="text-orange-500 font-bold uppercase animate-pulse">Cần hoàn tiền khách</span>;
           return <span className="text-green-600 font-bold">Đã thanh toán</span>;
       }
       if (order.paymentStatus === 'FAILED') return <span className="text-red-600 font-bold">Thất bại / Chưa thanh toán</span>;
       return <span className="text-yellow-600 font-bold">Chưa thanh toán</span>;
    }
    return <span className="text-gray-500 font-bold">{order.paymentStatus}</span>;
  };

  const showRefundButton = selectedOrder?.paymentMethod === 'VNPAY' 
                           && selectedOrder?.paymentStatus === 'PAID'
                           && (selectedOrder?.orderStatus === 'CANCELLED' || newStatus === 'CANCELLED');

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 min-h-[500px] relative flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h2>
        <button onClick={fetchOrders} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Làm mới danh sách">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex mb-6 w-full max-w-md">
        <input 
          type="text" 
          placeholder="Tìm mã đơn, tên khách hoặc SĐT..." 
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2.5 text-sm outline-none focus:border-gray-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="bg-[#2c3e50] text-white px-5 rounded-r-lg hover:bg-[#1a252f] transition-colors flex items-center justify-center">
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold text-center">
            <tr>
              <th className="p-4 border-b text-left">Mã Đơn</th>
              <th className="p-4 border-b cursor-pointer hover:bg-gray-100 group text-left" onClick={() => requestSort('createdAt')}>Ngày đặt {getSortIcon('createdAt')}</th>
              <th className="p-4 border-b text-left">Khách hàng</th>
              <th className="p-4 border-b cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('finalAmount')}>Tổng tiền {getSortIcon('finalAmount')}</th>
              <th className="p-4 border-b relative select-none">
                <div className="flex justify-center items-center gap-1.5 cursor-pointer" onClick={() => setIsPaymentFilterOpen(!isPaymentFilterOpen)}>PTTT <Filter className={`w-3.5 h-3.5 ${paymentFilter !== 'all' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} /></div>
                {isPaymentFilterOpen && (
                  <div className="absolute right-[50%] translate-x-[50%] top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 font-normal normal-case text-left">
                    {['all', 'COD', 'VNPAY'].map(m => (
                        <div key={m} className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${paymentFilter === m ? 'font-bold text-blue-600' : ''}`} onClick={() => { setPaymentFilter(m); setIsPaymentFilterOpen(false); }}>{m === 'all' ? 'Tất cả' : m}</div>
                    ))}
                  </div>
                )}
              </th>
              <th className="p-4 border-b relative select-none">
                <div className="flex justify-center items-center gap-1.5 cursor-pointer" onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}>Trạng thái <Filter className={`w-3.5 h-3.5 ${statusFilter !== 'all' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`} /></div>
                {isStatusFilterOpen && (
                  <div className="absolute right-[50%] translate-x-[50%] top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 font-normal normal-case text-left text-[12px]">
                    {[{v:'all',l:'Tất cả'},{v:'PENDING',l:'Chờ xác nhận'},{v:'CONFIRMED',l:'Đã xác nhận'},{v:'SHIPPING',l:'Đang giao'},{v:'COMPLETED',l:'Hoàn thành'},{v:'CANCELLED',l:'Đã hủy'},{v:'REFUND_PENDING',l:'Cần hoàn tiền'}].map(s => (
                        <div key={s.v} className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${statusFilter === s.v ? 'font-bold text-blue-600' : ''}`} onClick={() => { setStatusFilter(s.v); setIsStatusFilterOpen(false); }}>{s.l}</div>
                    ))}
                  </div>
                )}
              </th>
              <th className="p-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
                <tr><td colSpan="7" className="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>
            ) : currentOrders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-gray-400">Không tìm thấy đơn hàng nào.</td></tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="p-4 font-bold text-[#3498db]">#{order.orderCode}</td>
                    <td className="p-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4">
                       <div className="font-bold text-gray-800">{order.receiverName}</div>
                       <div className="text-xs text-gray-500">{order.receiverPhone}</div>
                    </td>
                    <td className="p-4 font-bold text-red-600 text-center">{order.finalAmount.toLocaleString()} đ</td>
                    <td className="p-4 text-gray-700 font-medium text-center">{order.paymentMethod}</td>
                    <td className="p-4 text-center">{getStatusUI(order.orderStatus)}</td>
                    <td className="p-4 text-center">
                       <button onClick={() => { setSelectedOrder(order); setNewStatus(order.orderStatus); }} className="bg-[#3498db] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#2980b9] transition-colors flex items-center gap-1 mx-auto shadow-sm"><Eye className="w-3.5 h-3.5" /> Xem</button>
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && processedOrders.length > 0 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 bg-white mt-auto">
          <span className="text-sm text-gray-500">
            Hiển thị <span className="font-bold text-gray-900">{indexOfFirstOrder + 1}</span> đến <span className="font-bold text-gray-900">{Math.min(indexOfLastOrder, processedOrders.length)}</span> trong tổng số <span className="font-bold text-gray-900">{processedOrders.length}</span> đơn hàng
          </span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Trước</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center border rounded-md text-sm font-bold transition-colors ${currentPage === i + 1 ? 'bg-[#2c3e50] text-white border-[#2c3e50]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Sau</button>
          </div>
        </div>
      )}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Chi Tiết Đơn Hàng <span className="text-[#3498db]">#{selectedOrder.orderCode}</span></h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700 mb-6">
                <div><span className="font-bold text-gray-900">Người nhận: </span>{selectedOrder.receiverName}</div>
                <div><span className="font-bold text-gray-900">Ngày đặt: </span>{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</div>
                <div><span className="font-bold text-gray-900">SĐT: </span>{selectedOrder.receiverPhone}</div>
                
                <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
                  <div className="flex flex-wrap items-center text-sm gap-y-2">
                    <span className="font-bold text-gray-900 w-24">Thanh toán:</span>
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{selectedOrder.paymentMethod}</span>
                    <span className="mx-4 text-gray-300 hidden sm:inline">|</span>
                    <span className="font-bold text-gray-900 mr-2">Trạng thái:</span>
                    {getPaymentStatusUI(selectedOrder, newStatus)}
                  </div>
                  
                  {showRefundButton && (
                    <div className="mt-4 pt-4 border-t border-blue-200 flex flex-col items-start">
                      <button onClick={handleRefundOrder} disabled={isRefunding} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <RotateCcw className="w-4 h-4" /> {isRefunding ? 'Đang xử lý...' : 'Xác nhận đã chuyển khoản Hoàn tiền'}
                      </button>
                      <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                        * Hãy gọi số <b className="text-gray-800">{selectedOrder.receiverPhone}</b> để xác nhận tài khoản nhận tiền trước khi thao tác.
                      </p>
                    </div>
                  )}
                </div>

                <div className="col-span-2"><span className="font-bold text-gray-900">Địa chỉ: </span>{selectedOrder.shippingAddress}</div>
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Sản phẩm</h4>
              <div className="space-y-3 mb-4 max-h-[150px] overflow-y-auto pr-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-dashed pb-2 text-sm">
                    <div className="text-gray-700">
                      {item.productName.replace('(Màu Mặc Định)', '').trim()} 
                      <strong className="ml-2 text-gray-900 font-black">x{item.quantity}</strong>
                    </div>
                    <div className="font-bold text-gray-800">{(item.price * item.quantity).toLocaleString()} đ</div>
                  </div>
                ))}
              </div>
              <div className="mb-6 border-b pb-4 space-y-2 text-sm">
                 <div className="flex justify-between text-gray-600">
                    <span>Tổng tiền hàng:</span>
                    <span className="font-bold">{(selectedOrder.totalAmount || 0).toLocaleString()} đ</span>
                 </div>
                 <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold">+{ (selectedOrder.shippingFee || 0).toLocaleString()} đ</span>
                 </div>
                 {selectedOrder.discountAmount > 0 && (
                   <div className="flex justify-between text-green-600">
                      <span>Giảm giá Voucher:</span>
                      <span className="font-bold">-{(selectedOrder.discountAmount || 0).toLocaleString()} đ</span>
                   </div>
                 )}
                 <div className="flex justify-between pt-2 border-t border-dashed mt-2">
                    <span className="font-bold text-gray-900 text-base">Tổng cộng:</span>
                    <span className="font-black text-red-600 text-lg">{selectedOrder.finalAmount.toLocaleString()} đ</span>
                 </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-800 mb-2">Cập nhật trạng thái đơn hàng:</label>
                <div className="flex gap-3">
                  <select className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-500 font-medium text-gray-700" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="SHIPPING">Đang giao hàng</option>
                    <option value="COMPLETED">Đã hoàn thành (Giao thành công)</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                  <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 bg-gray-400 text-white rounded-md text-sm font-bold hover:bg-gray-500">Đóng</button>
                  <button onClick={handleUpdateStatus} disabled={isUpdating} className="px-5 py-2 bg-[#3498db] text-white rounded-md text-sm font-bold hover:bg-[#2980b9] disabled:opacity-50">{isUpdating ? 'Đang xử lý...' : 'Cập nhật'}</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}