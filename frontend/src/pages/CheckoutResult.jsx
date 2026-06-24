import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios'; 
import { useCart } from '../context/CartContext';

export default function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  
  const { clearCart } = useCart(); 

  const hasClearedCart = useRef(false);
  const hasCalledBackend = useRef(false);

  const responseCode = searchParams.get('vnp_ResponseCode');
  const orderCode = searchParams.get('vnp_TxnRef');
  const amount = searchParams.get('vnp_Amount');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!hasCalledBackend.current) {
      hasCalledBackend.current = true;
      const params = Object.fromEntries([...searchParams]);
      api.get('/orders/vnpay-return', { params: params })
        .then(() => console.log("Đã đồng bộ trạng thái đơn hàng với Backend"))
        .catch(err => console.error("Lỗi đồng bộ Backend:", err));
    }
    if (responseCode === '00') {
      setStatus('success');
      setMessage('Thanh toán thành công!');
      
      if (!hasClearedCart.current) {
          clearCart();
          hasClearedCart.current = true;
      }
    } else {
      setStatus('error');
      setMessage('Giao dịch bị hủy hoặc thất bại.');
    }
  }, [responseCode, searchParams, clearCart]);

  const displayAmount = amount ? (Number(amount) / 100).toLocaleString() : 0;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-lg w-full text-center">
        
        {status === 'loading' && <p>Đang xử lý kết quả giao dịch...</p>}

        {status === 'success' && (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{message}</h1>
            <p className="text-gray-500 mb-6">Cảm ơn bạn đã mua sắm tại Eyevora Store.</p>
            
            <div className="bg-gray-50 p-4 rounded-md text-left mb-8 text-sm text-gray-700">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Mã đơn hàng:</span>
                <span>{orderCode}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Số tiền:</span>
                <span className="font-bold text-red-600">{displayAmount}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phương thức:</span>
                <span>VNPAY</span>
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{message}</h1>
            <p className="text-gray-500 mb-8 text-sm">Rất tiếc, quá trình thanh toán chưa được hoàn tất. Đơn hàng của bạn sẽ được chuyển sang trạng thái chờ xử lý (Thất bại) và hệ thống đã hoàn lại số lượng sản phẩm vào kho.</p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/" className="w-full bg-[#338dbc] text-white font-bold py-3 rounded-md hover:bg-[#28739e] transition-colors">
            Tiếp tục mua sắm
          </Link>
          <Link to="/cart" className="w-full bg-white text-gray-600 border border-gray-300 font-bold py-3 rounded-md hover:bg-gray-50 transition-colors">
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
}