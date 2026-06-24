import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Search, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [activeProductIds, setActiveProductIds] = useState(null);

  useEffect(() => {
    api.get('/products')
      .then(res => {
        setActiveProductIds(res.data.map(p => p.id));
      })
      .catch(err => console.error("Lỗi xác thực sản phẩm:", err));
  }, []);

  const FREE_SHIPPING_THRESHOLD = 50000;
  const amountNeeded = FREE_SHIPPING_THRESHOLD - cartTotal;
  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const progressPercent = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${searchKeyword}`);
    }
  };

  const hasInactiveItems = cartItems.some(item => activeProductIds !== null && !activeProductIds.includes(item.id));

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-20">
      <div className="bg-white px-10 py-6 border-b mb-10">
        <div className="text-[12px] text-gray-500 flex gap-2 max-w-7xl mx-auto">
          <Link to="/" className="hover:text-black">Trang chủ</Link>
          <span>/</span>
          <span className="text-black font-medium">Giỏ hàng ({cartCount})</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1">
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-2xl font-medium text-gray-800">Giỏ hàng của bạn</h1>
            <p className="text-sm text-gray-500">
              Bạn đang có <strong className="text-black">{cartCount} sản phẩm</strong> trong giỏ hàng
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="bg-white p-12 flex flex-col items-center justify-center text-center border border-gray-200">
              <ShoppingBag className="w-24 h-24 text-blue-100 mb-6" strokeWidth={1} />
              <h2 className="text-xl font-medium text-gray-800 mb-3">Chưa có sản phẩm trong giỏ hàng...</h2>
              <p className="text-sm text-gray-500 mb-8">
                Bạn có thể quay về <Link to="/" className="text-blue-600 font-bold hover:underline">trang chủ</Link> hoặc nhập từ khoá sản phẩm bạn cần tìm ở đây:
              </p>
              
              <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm sản phẩm..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full border border-gray-300 rounded-sm py-3 px-5 pr-12 focus:outline-none focus:border-gray-500 text-sm"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-6">
              
              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  {isFreeShipping ? (
                    <span className="text-green-600 font-bold">Bạn đã được MIỄN PHÍ VẬN CHUYỂN</span>
                  ) : (
                    <>Bạn cần mua thêm <span className="text-red-600 font-bold">{amountNeeded.toLocaleString()}đ</span> để được MIỄN PHÍ VẬN CHUYỂN</>
                  )}
                </p>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden relative">
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
                    <div key={item.id} className={`flex items-center justify-between py-4 border-b border-gray-50 last:border-0 relative group transition-all ${isInactive ? 'opacity-60 bg-red-50/30 p-2 rounded-lg' : ''}`}>
                      <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 bg-[#f5f5f5] rounded-sm flex items-center justify-center p-2">
                           <img src={displayImg} alt={item.name} className={`w-full h-full object-contain mix-blend-multiply ${isInactive ? 'grayscale' : ''}`} />
                           {isInactive && (
                             <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                               <span className="text-[9px] bg-red-600 text-white font-bold px-1 py-0.5 rounded uppercase">Ngừng bán</span>
                             </div>
                           )}
                        </div>
                        <div>
                          <Link to={`/product/${item.id}`} className="font-bold text-[14px] text-gray-800 hover:text-blue-600 transition-colors">
                            {item.name}
                          </Link>
                          <p className="text-[12px] text-gray-500 mt-1">{item.variant || 'Mặc định'}</p>
                          {isInactive && (
                            <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                              ⚠️ Sản phẩm đã ngừng kinh doanh. Vui lòng xóa!
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <span className={`font-bold text-[15px] ${isInactive ? 'text-gray-400 line-through' : ''}`}>{item.basePrice.toLocaleString()}đ</span>
                        <div className={`flex items-center border border-gray-200 rounded-sm bg-gray-50 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors">-</button>
                          <span className="w-10 h-8 flex items-center justify-center bg-white font-bold text-sm border-x border-gray-200">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)} 
                            disabled={item.quantity >= (item.totalStock !== undefined ? item.totalStock : 999)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:text-white ${isInactive ? 'bg-red-500 text-white opacity-100 hover:bg-red-600' : 'bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500'}`}
                        title="Xóa sản phẩm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-white border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">Thông tin đơn hàng</h2>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-[15px] font-bold text-gray-700">Tổng tiền:</span>
              <span className="text-2xl font-bold text-red-600">{cartTotal.toLocaleString()}đ</span>
            </div>

            <div className="text-[13px] text-gray-500 space-y-2 mb-6">
              <p>• Phí vận chuyển sẽ được tính ở trang thanh toán.</p>
              <p>• Bạn cũng có thể nhập mã giảm giá ở trang thanh toán.</p>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-col gap-2">
                <div className="bg-red-50 text-red-500 text-[12px] p-3 text-center rounded-sm">
                  Giỏ hàng của bạn hiện chưa đạt mức tối thiểu để thanh toán.
                </div>
                <button disabled className="w-full bg-[#555] text-white font-bold py-4 uppercase text-[14px] cursor-not-allowed opacity-80 rounded-sm">
                  Thanh toán
                </button>
              </div>
            ) : hasInactiveItems ? (
              <div className="flex flex-col gap-2">
                <div className="bg-red-50 text-red-600 font-bold text-[12px] p-3 text-center rounded-sm border border-red-200">
                  Có sản phẩm Ngừng kinh doanh trong giỏ. Vui lòng xóa để tiếp tục!
                </div>
                <button disabled className="w-full bg-gray-400 text-white font-bold py-4 uppercase text-[14px] cursor-not-allowed rounded-sm">
                  Không thể thanh toán
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#e30019] hover:bg-red-700 transition-colors text-white font-bold py-4 uppercase text-[14px] shadow-lg shadow-red-500/30 rounded-sm"
              >
                Thanh toán
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}