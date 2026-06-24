import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import InvoiceModal from './InvoiceModal';

const OrderTracking = () => {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOrderData(null);

    try {
      const response = await axios.get('http://localhost:8080/api/v1/orders/track', {
        params: { orderCode, phone }
      });
      setOrderData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hoặc số điện thoại!');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusText = (status) => {
    const statusMap = {
      PENDING: { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      SHIPPING: { text: 'Đang giao hàng', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { text: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      CANCELLED: { text: 'Đã hủy', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentStatusText = (status) => {
    if (status === 'PAID') return <span className="text-green-600 font-semibold">Đã thanh toán</span>;
    if (status === 'FAILED') return <span className="text-red-600 font-semibold">Thất bại</span>;
    return <span className="text-yellow-600 font-semibold">Chưa thanh toán</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Tra Cứu Đơn Hàng</h1>
          <p className="mt-2 text-gray-600">Vui lòng nhập mã đơn hàng được gửi trong email và số điện thoại của bạn.</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-100">
          <form onSubmit={handleTrackOrder} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Mã đơn hàng (VD: EYE-XXXXXX)"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Số điện thoại đặt hàng"
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:bg-gray-400 font-medium transition"
            >
              {loading ? 'Đang tìm...' : 'Tra cứu ngay'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm text-center">{error}</div>}
        </div>
        {orderData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative">
            
            <div className="bg-gray-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-white font-semibold">Đơn Hàng: #{orderData.orderCode}</h2>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusText(orderData.orderStatus).color}`}>
                  {getOrderStatusText(orderData.orderStatus).text}
                </span>

                {orderData.orderStatus !== 'CANCELLED' && (
                  <button 
                    onClick={() => setIsInvoiceOpen(true)}
                    className="bg-white text-gray-900 px-4 py-1.5 rounded-md text-sm font-bold hover:bg-gray-100 transition shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    {(orderData.paymentStatus === 'PAID' || orderData.orderStatus === 'COMPLETED') 
                      ? 'Xuất hóa đơn' 
                      : 'In đơn hàng'
                    }
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Thông tin nhận hàng</h3>
                  <p className="font-medium text-gray-900">{orderData.receiverName}</p>
                  <p className="text-gray-600 mt-1">{orderData.receiverPhone}</p>
                  <p className="text-gray-600 mt-1">{orderData.shippingAddress}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Thanh toán</h3>
                  <p className="text-gray-600">Phương thức: <span className="font-medium">{orderData.paymentMethod}</span></p>
                  <p className="text-gray-600 mt-1">Trạng thái: {getPaymentStatusText(orderData.paymentStatus)}</p>
                  <p className="text-gray-600 mt-1">Ngày đặt: {new Date(orderData.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Sản phẩm đã đặt</h3>
              <div className="space-y-4 mb-8">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">Phân loại: {item.colorName} | SL: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-6 rounded-md">
                <div className="flex justify-between mb-2 text-gray-600">
                  <span>Tạm tính</span>
                  <span>{orderData.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between mb-2 text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>{orderData.shippingFee === 0 ? 'Miễn phí' : `${orderData.shippingFee.toLocaleString('vi-VN')} đ`}</span>
                </div>
                {orderData.discountAmount > 0 && (
                  <div className="flex justify-between mb-2 text-red-500">
                    <span>Giảm giá Voucher</span>
                    <span>-{orderData.discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-red-600">{orderData.finalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <InvoiceModal 
        isOpen={isInvoiceOpen} 
        onClose={() => setIsInvoiceOpen(false)} 
        orderData={orderData} 
      />

    </div>
  );
};

export default OrderTracking;