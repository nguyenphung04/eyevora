import React, { useState, useEffect } from 'react';
import { User, ShoppingBag, LogOut, Package, ChevronLeft, Printer, MapPin, CreditCard, Calendar, Lock, Eye, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import InvoiceModal from './InvoiceModal'; 
import ReviewModal from './ReviewModal';
import ViewReviewModal from './ViewReviewModal';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'account');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5; 

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false); 
  const [reviewModalData, setReviewModalData] = useState({ isOpen: false, orderId: null, itemDetails: null });
  const [viewReviewData, setViewReviewData] = useState({ isOpen: false, itemDetails: null });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState([]);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const handleOpenReview = (orderId, item) => {
    setReviewModalData({ isOpen: true, orderId: orderId, itemDetails: item });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else navigate('/login');
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state, navigate]);

  useEffect(() => {
    if (activeTab === 'orders' && user) fetchUserOrders();
  }, [activeTab, user]);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/orders/my-orders', { headers: { Authorization: `Bearer ${token}` } });
      const sortedOrders = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Hủy đơn hàng?',
      text: "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Đóng'
    });
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.put(`/orders/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đã hủy đơn hàng thành công!");
        fetchUserOrders(); 
        if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
      } catch (error) {
        toast.error(error.response?.data?.message || "Có lỗi xảy ra, không thể hủy đơn!");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error("Mật khẩu xác nhận không khớp!");
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await api.put('/users/change-password', 
        { oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setTimeout(() => handleLogout(), 1500);
    } catch (error) {
      toast.error(error.response?.data || "Mật khẩu cũ không chính xác!");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusUI = (status) => {
    const map = {
      PENDING: { label: "Chờ xác nhận", css: "bg-yellow-50 text-yellow-600 border-yellow-100" },
      CONFIRMED: { label: "Đã xác nhận", css: "bg-blue-50 text-blue-600 border-blue-100" },
      SHIPPING: { label: "Đang giao hàng", css: "bg-orange-50 text-orange-600 border-orange-100" },
      COMPLETED: { label: "Đã hoàn thành", css: "bg-green-50 text-green-600 border-green-100" },
      CANCELLED: { label: "Đã hủy", css: "bg-red-50 text-red-600 border-red-100" }
    };
    const res = map[status] || { label: status, css: "bg-gray-50 text-gray-600 border-gray-100" };
    return <span className={`${res.css} px-3 py-1 rounded-full text-[10px] font-bold uppercase border`}>{res.label}</span>;
  };

  const filteredOrders = filterStatus === 'ALL' ? orders : orders.filter(o => o.orderStatus === filterStatus);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {!selectedOrder && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm sticky top-24">
                <div className="flex flex-col items-center pb-6 mb-6 border-b border-gray-50">
                   <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-2xl mb-3 border border-yellow-100">👤</div>
                   <div className="font-bold text-gray-800">{user.fullName}</div>
                   <div className="text-xs text-gray-400">{user.email}</div>
                </div>
                <nav className="space-y-1">
                  <button onClick={() => {setActiveTab('account'); setSelectedOrder(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'account' ? 'bg-[#fff8db] text-[#c59d00]' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <User className="w-4 h-4" /> Tài khoản
                  </button>
                  <button onClick={() => {setActiveTab('orders'); setSelectedOrder(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-[#fff8db] text-[#c59d00]' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <ShoppingBag className="w-4 h-4" /> Đơn hàng
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 mt-4 border-t border-gray-50 pt-4">
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </nav>
              </div>
            </div>
          )}

          <div className={selectedOrder ? "col-span-4" : "lg:col-span-3"}>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm min-h-[550px]">
              
              {selectedOrder ? (
                <div className="animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                    <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black">
                      <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    
                    {selectedOrder.orderStatus === 'COMPLETED' ? (
                      <button onClick={() => setIsInvoiceOpen(true)} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-sm">
                        <Download className="w-4 h-4" /> Xuất hóa đơn
                      </button>
                    ) : selectedOrder.orderStatus === 'CANCELLED' ? (
                      <span className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100">
                        Đơn hàng đã bị hủy
                      </span>
                    ) : (
                      <button onClick={() => setIsInvoiceOpen(true)} className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:border-gray-800 hover:text-black transition-all">
                        <Printer className="w-4 h-4" /> In đơn hàng
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h2 className="text-2xl font-black uppercase text-gray-900">Đơn hàng #{selectedOrder.orderCode}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</span>
                        {getStatusUI(selectedOrder.orderStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2 border-b pb-2"><MapPin className="w-4 h-4 text-yellow-500" /> Thông tin nhận hàng</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-400">Người nhận:</span> <span className="font-bold">{selectedOrder.receiverName}</span></p>
                        <p><span className="text-gray-400">SĐT:</span> <span className="font-bold">{selectedOrder.receiverPhone}</span></p>
                        <p><span className="text-gray-400">Địa chỉ:</span> <span className="font-bold">{selectedOrder.shippingAddress}</span></p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2 border-b pb-2"><CreditCard className="w-4 h-4 text-blue-500" /> Thanh toán</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-400">Phương thức:</span> <span className="font-bold">{selectedOrder.paymentMethod}</span></p>
                        <p>
                          <span className="text-gray-400">Trạng thái: </span> 
                          <span className={`font-bold ${
                            selectedOrder.paymentStatus === 'PAID' && selectedOrder.orderStatus === 'CANCELLED' ? 'text-orange-500 animate-pulse' :
                            selectedOrder.paymentStatus === 'REFUNDED' ? 'text-[#3498db]' :
                            selectedOrder.paymentStatus === 'PAID' ? 'text-green-600' : 
                            selectedOrder.paymentStatus === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {selectedOrder.paymentStatus === 'PAID' && selectedOrder.orderStatus === 'CANCELLED' ? 'Đang chờ hoàn tiền' :
                             selectedOrder.paymentStatus === 'REFUNDED' ? 'Đã hoàn tiền' :
                             selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 
                             selectedOrder.paymentStatus === 'FAILED' ? 'Thất bại / Đã hủy' : 'Chưa thanh toán'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.paymentMethod === 'VNPAY' && selectedOrder.paymentStatus === 'PAID' && selectedOrder.orderStatus === 'CANCELLED' && (
                    <div className="mb-10 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                      <p className="text-xs text-orange-700 leading-relaxed">
                        <strong>Thông báo:</strong> Đơn hàng này đã thanh toán qua VNPay. Vì đơn đã hủy, hệ thống EYEVORA sẽ liên hệ qua SĐT <strong className="text-orange-900">{selectedOrder.receiverPhone}</strong> để hoàn tiền sớm nhất.
                      </p>
                    </div>
                  )}

                  <div className="mb-10 overflow-hidden border border-gray-100 rounded-2xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400">
                        <tr>
                          <th className="px-6 py-4">Sản phẩm</th>
                          <th className="px-6 py-4 text-center">Số Lượng</th>
                          <th className="px-6 py-4 text-right">Giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedOrder.items?.map((item, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 flex items-center gap-4">
                              <img src={item.imageUrl} className={`w-12 h-12 rounded-lg object-cover border ${!item.productId ? 'grayscale opacity-50' : ''}`} alt="" />
                              <div>
                                <p className={`font-bold ${!item.productId ? 'text-red-500 line-through' : 'text-gray-800'}`}>{item.productName.replace('(Màu Mặc Định)', '').trim()}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{item.colorName === '(Màu Mặc Định)' ? 'Mặc định' : item.colorName}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-700">{item.quantity}</td>
                            
                            <td className="px-6 py-4 text-right">
                              <div className="font-bold text-gray-900">{item.price?.toLocaleString()}đ</div>
                              
                              {selectedOrder.orderStatus === 'COMPLETED' && (
                                item.productId ? (
                                  item.isReviewed ? (
                                    <button onClick={() => setViewReviewData({ isOpen: true, itemDetails: item })} className="text-[10px] font-bold text-green-600 hover:text-green-700 underline underline-offset-2 mt-1 block w-full text-right">⭐ Xem đánh giá</button>
                                  ) : (
                                    <button onClick={() => handleOpenReview(selectedOrder.id, item)} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline underline-offset-2 mt-1 block w-full text-right">Đánh giá sản phẩm</button>
                                  )
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400 italic mt-1 block w-full text-right">Không thể đánh giá SP đã xóa</span>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end border-t pt-6">
                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Tạm tính:</span><span className="font-bold text-gray-800">{selectedOrder.totalAmount?.toLocaleString()}đ</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Giảm giá:</span><span className="font-bold text-red-500">-{selectedOrder.discountAmount?.toLocaleString()}đ</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Phí ship:</span><span className="font-bold text-gray-800">{selectedOrder.shippingFee === 0 ? 'Miễn phí' : `${selectedOrder.shippingFee?.toLocaleString()}đ`}</span></div>
                      <div className="flex justify-between border-t border-gray-100 pt-3"><span className="text-lg font-bold text-gray-900">Tổng cộng:</span><span className="text-2xl font-black text-gray-900">{selectedOrder.finalAmount?.toLocaleString()}đ</span></div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'account' ? (
                <div className="max-w-2xl animate-in fade-in">
                  <h2 className="text-xl font-bold text-gray-900 mb-8 pb-3 border-b border-gray-50">Hồ sơ cá nhân</h2>
                  <div className="space-y-6 mb-10">
                    <div className="grid grid-cols-3 gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Họ và tên</span><span className="col-span-2 font-bold text-gray-800">{user.fullName}</span></div>
                    <div className="grid grid-cols-3 gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Email</span><span className="col-span-2 font-bold text-gray-800">{user.email}</span></div>
                    <div className="grid grid-cols-3 gap-2"><span className="text-xs font-bold text-gray-400 uppercase">Điện thoại</span><span className="col-span-2 font-bold text-gray-800">{user.phone || 'Chưa cập nhật'}</span></div>
                  </div>

                  <div className="border-t pt-8 border-gray-50">
                    {!isChangingPassword ? (
                      <button onClick={() => setIsChangingPassword(true)} className="flex items-center gap-2 text-sm font-bold text-[#c59d00] border-2 border-[#f1c40f] px-6 py-2.5 rounded-xl hover:bg-[#f1c40f] hover:text-black transition-all">
                        <Lock className="w-4 h-4" /> Thay đổi mật khẩu
                      </button>
                    ) : (
                      <form onSubmit={handleChangePassword} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800">Cập nhật mật khẩu mới</h3>
                        <input type="password" required placeholder="Mật khẩu cũ" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#f1c40f]" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} />
                        <input type="password" required placeholder="Mật khẩu mới" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#f1c40f]" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                        <input type="password" required placeholder="Xác nhận mật khẩu" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#f1c40f]" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                        <div className="flex gap-3 pt-2">
                          <button type="submit" disabled={isUpdating} className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50">{isUpdating ? 'Đang lưu...' : 'Lưu mật khẩu'}</button>
                          <button type="button" onClick={() => setIsChangingPassword(false)} className="text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors">Hủy</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-50">Lịch sử đơn hàng</h2>
                  
                  <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => { setFilterStatus(s); setCurrentPage(1); }} 
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-[11px] font-bold border transition-all ${filterStatus === s ? 'bg-[#f1c40f] border-[#f1c40f] text-black shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Chờ xác nhận' : s === 'CONFIRMED' ? 'Đã xác nhận' : s === 'SHIPPING' ? 'Đang giao' : s === 'COMPLETED' ? 'Đã nhận' : 'Đã hủy'}
                      </button>
                    ))}
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300 animate-pulse"><Package className="w-12 h-12 mb-4" /><p>Đang tải dữ liệu...</p></div>
                  ) : currentOrders.length > 0 ? (
                    <>
                      <div className="space-y-6">
                        {currentOrders.map(order => (
                          <div key={order.id} className="border border-gray-100 rounded-2xl p-5 hover:border-yellow-200 hover:shadow-xl transition-all bg-white group">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                              <div><div className="text-sm font-bold text-gray-900">#{order.orderCode}</div><div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div></div>
                              {getStatusUI(order.orderStatus)}
                            </div>
                            <div className="space-y-3 mb-5">
                              {(expandedOrders.includes(order.id) ? order.items : order.items?.slice(0, 1)).map((item, idx) => (
                                <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${!item.productId ? 'opacity-50 grayscale' : ''}`}>
                                  <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-cover border" alt="" />
                                  <div className="flex-1">
                                    <div className={`text-sm font-bold line-clamp-1 ${!item.productId ? 'text-red-500 line-through' : 'text-gray-800'}`}>{item.productName.replace('(Màu Mặc Định)', '').trim()}</div>
                                    <div className="text-[10px] font-bold text-gray-400 mt-0.5">{item.colorName === '(Màu Mặc Định)' ? 'Mặc định' : item.colorName} | SL: {item.quantity}</div>
                                  </div>
                                  <div className="text-sm font-bold text-gray-900">{item.price?.toLocaleString()}đ</div>
                                </div>
                              ))}
                              
                              {order.items?.length > 1 && (
                                <div 
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className="text-[10px] text-blue-500 font-bold italic pl-16 cursor-pointer hover:text-blue-700 transition-colors inline-block"
                                >
                                  {expandedOrders.includes(order.id) ? '- Thu gọn' : `+ Xem thêm ${order.items.length - 1} sản phẩm khác`}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-50">
                              <div className="text-xs font-bold text-gray-400 uppercase">Tổng: <span className="text-lg font-black text-black ml-1">{order.finalAmount?.toLocaleString()}đ</span></div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={() => setSelectedOrder(order)} className="flex-1 sm:flex-none px-5 py-2 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"><Eye className="w-3 h-3" /> CHI TIẾT</button>
                                {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
                                  <button onClick={() => handleCancelOrder(order.id)} className="flex-1 sm:flex-none px-5 py-2 bg-red-50 border border-red-100 rounded-xl text-[10px] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all">HỦY ĐƠN</button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-100">
                          <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">&lt;</button>
                            {[...Array(totalPages)].map((_, i) => (
                              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center border rounded text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-[#2c3e50] text-white border-[#2c3e50]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{i + 1}</button>
                            ))}
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">&gt;</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-300">
                      <Package className="w-16 h-16 mb-4 opacity-20" />
                      <p className="font-bold text-gray-400">Không tìm thấy đơn hàng nào</p>
                      <button onClick={() => navigate('/')} className="mt-6 bg-black text-white px-8 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors">MUA SẮM NGAY</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <InvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} orderData={selectedOrder} />
      <ReviewModal isOpen={reviewModalData.isOpen} onClose={() => setReviewModalData({ isOpen: false, orderId: null, itemDetails: null })} orderId={reviewModalData.orderId} itemDetails={reviewModalData.itemDetails} onSuccess={() => fetchUserOrders()} />
      <ViewReviewModal isOpen={viewReviewData.isOpen} onClose={() => setViewReviewData({ isOpen: false, itemDetails: null })} item={viewReviewData.itemDetails} />
    </div>
  );
}