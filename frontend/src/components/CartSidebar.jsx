import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CartSidebar({ isOpen, onClose }) {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  
  const [activeProductIds, setActiveProductIds] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/products')
        .then(res => {
          setActiveProductIds(res.data.map(p => p.id));
        })
        .catch(err => console.error("Lỗi xác thực sản phẩm Sidebar:", err));
    }
  }, [isOpen]);

  const FREE_SHIPPING_THRESHOLD = 50000;
  const amountNeeded = FREE_SHIPPING_THRESHOLD - cartTotal;
  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const progressPercent = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const hasInactiveItems = cartItems.some(item => activeProductIds !== null && !activeProductIds.includes(item.id));

  return (
    <div className={`fixed inset-0 z-[200] flex justify-end ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>

      <div 
        className={`relative w-[400px] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">Giỏ hàng</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-200 mb-6" strokeWidth={1} />
            <p className="text-gray-500 text-sm mb-4">Chưa có sản phẩm trong giỏ hàng...</p>
            <button 
              onClick={onClose}
              className="text-eyevora-dark font-bold text-sm text-blue-600 hover:underline"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 bg-gray-50 border-b">
              <p className="text-[13px] text-gray-600 mb-2 font-medium">
                {isFreeShipping ? (
                  <span className="text-green-600 font-bold">Bạn đã đủ điều kiện MIỄN PHÍ VẬN CHUYỂN!</span>
                ) : (
                  <>Bạn cần mua thêm <span className="text-red-600 font-bold">{amountNeeded.toLocaleString()}đ</span> để được MIỄN PHÍ VẬN CHUYỂN</>
                )}
              </p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${isFreeShipping ? 'bg-green-500' : 'bg-yellow-400'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-500 ${isFreeShipping ? 'bg-green-500' : 'bg-yellow-400'}`}
                  style={{ left: `calc(${progressPercent}% - 8px)` }}
                ></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-6">
                {cartItems.map(item => {
                  let displayImg = item.imageUrl;
                  if (!displayImg && item.variants && item.variants.length > 0 && item.variants[0].images) {
                    displayImg = item.variants[0].images.split(',')[0];
                  } else if (!displayImg && typeof item.images === 'string') {
                    displayImg = item.images.split(',')[0];
                  }
                  if (!displayImg) displayImg = 'https://via.placeholder.com/150?text=No+Image';

                  const isInactive = activeProductIds !== null && !activeProductIds.includes(item.id);

                  return (
                    <div key={item.id} className={`flex gap-4 relative group transition-all ${isInactive ? 'opacity-70 bg-red-50/40 p-2 rounded-lg' : ''}`}>
                      <div className="relative">
                        <img src={displayImg} alt={item.name} className={`w-20 h-20 object-contain bg-[#f5f5f5] rounded-md mix-blend-multiply ${isInactive ? 'grayscale' : ''}`} />
                        {isInactive && (
                          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                            <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">Ngừng bán</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 relative">
                        <h3 className={`text-[13px] font-bold pr-6 ${isInactive ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.name}</h3>
                        <p className="text-[11px] text-gray-500 mt-1">{item.variant || 'Mặc định'}</p>
                        
                        {isInactive && (
                          <p className="text-[10px] text-red-600 font-bold mt-1">Vui lòng xóa sản phẩm này!</p>
                        )}
                        
                        <div className={`flex items-center justify-between mt-3 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center border rounded-sm">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 text-gray-500 hover:text-black"><Minus className="w-3 h-3" /></button>
                            <span className="px-3 text-[13px] font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)} 
                              disabled={item.quantity >= (item.totalStock !== undefined ? item.totalStock : 999)}
                              className="px-2 py-1 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className={`font-bold text-[13px] ${isInactive ? 'line-through' : ''}`}>{(item.basePrice * item.quantity).toLocaleString()}đ</p>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className={`absolute top-0 right-0 hover:text-red-500 ${isInactive ? 'text-red-500 bg-red-100 rounded-full p-1' : 'text-gray-400'}`}
                          title="Xóa sản phẩm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[13px] font-bold text-gray-500 uppercase">Tổng tiền:</span>
                <span className="text-xl font-bold text-red-600">{cartTotal.toLocaleString()}đ</span>
              </div>
              {hasInactiveItems ? (
                <button 
                  disabled
                  className="w-full bg-gray-400 text-white font-bold py-3 uppercase text-[13px] cursor-not-allowed transition-colors rounded-sm"
                >
                  Giỏ hàng có lỗi - Không thể thanh toán
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onClose(); 
                    navigate('/checkout'); 
                  }}
                  className="w-full bg-red-600 text-white font-bold py-3 uppercase text-[13px] hover:bg-red-700 transition-colors rounded-sm"
                >
                  Thanh toán
                </button>
              )}

              <div className="text-center mt-4">
                <Link 
                  to="/cart" 
                  onClick={onClose}
                  className="text-[13px] text-gray-500 hover:text-black uppercase underline decoration-1 underline-offset-4"
                >
                  Xem giỏ hàng chi tiết
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}