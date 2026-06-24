import React, { useState } from 'react';
import { Eye, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const navigate = useNavigate(); 
  
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewQty, setQuickViewQty] = useState(1);
  
  const cartItem = cartItems.find(item => item.id === product.id);

  const availableStock = product.totalStock !== undefined 
    ? product.totalStock 
    : (product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) || 0);
    
  const isOutOfStock = availableStock <= 0;

  const getImages = () => {
    let rawImages = "";
    if (product.variants && product.variants.length > 0 && product.variants[0].images) {
      rawImages = product.variants[0].images;
    } else if (product.images) {
      rawImages = product.images;
    }
    let list = [];
    if (typeof rawImages === 'string' && rawImages.trim() !== '') {
      list = rawImages.split(',').map(s => s.trim());
    }
    if (list.length === 0) list = product.imageUrl ? [product.imageUrl] : ['https://via.placeholder.com/600x600?text=Eyevora'];
    return list;
  };
  const images = getImages();
  const displayImage = images[0];

  const handleQuickViewAddToCart = () => {
    if (isOutOfStock) return;
    
    const currentCartQty = cartItem ? cartItem.quantity : 0;
    if (currentCartQty + quickViewQty > availableStock) {
        toast.warning(`Chỉ còn ${availableStock} sản phẩm trong kho!`);
        return;
    }

    if (cartItem) {
      updateQuantity(product.id, quickViewQty);
    } else {
      addToCart(product);
      if (quickViewQty > 1) {
        updateQuantity(product.id, quickViewQty - 1);
      }
    }
    setIsQuickViewOpen(false); 
    setQuickViewQty(1); 
  };

  return (
    <>
      <div 
        className="group cursor-pointer text-left relative"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <div className="bg-[#f5f5f5] aspect-square flex items-center justify-center overflow-hidden mb-3 relative">
          
          {isOutOfStock && (
            <div className="absolute top-3 left-3 bg-[#555] text-white text-[11px] font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
              Hết hàng
            </div>
          )}

          <img
            src={displayImage}
            alt={product.name}
            className={`w-[85%] h-[85%] object-contain transition-transform duration-500 ease-in-out group-hover:scale-110 mix-blend-multiply p-2 ${isOutOfStock ? 'opacity-60' : ''}`}
          />

          <div className="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out flex shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-10">
            
            {isOutOfStock ? (
               <div className="flex-1 bg-gray-100 text-gray-400 text-[11px] font-bold py-3 uppercase flex items-center justify-center gap-2 border-t border-gray-200 cursor-not-allowed">
                 <ShoppingBag className="w-3.5 h-3.5 opacity-50" />
                 HẾT HÀNG
               </div>
            ) : cartItem ? (
              <div className="flex-1 flex items-center justify-between bg-white px-3 py-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => updateQuantity(product.id, -1)}
                  className="text-gray-400 hover:text-black w-6 h-6 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="text-[13px] font-bold text-black">{cartItem.quantity}</span>
                <button 
                  onClick={() => {
                     if(cartItem.quantity >= availableStock) {
                         toast.warning("Đã đạt số lượng tối đa trong kho!");
                     } else {
                         updateQuantity(product.id, 1);
                     }
                  }}
                  className={`w-6 h-6 flex items-center justify-center font-bold ${cartItem.quantity >= availableStock ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-black'}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                className="flex-1 bg-white text-gray-700 text-[11px] font-bold py-3 uppercase flex items-center justify-center gap-2 hover:text-red-600 border-t border-gray-100 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Thêm vào giỏ
              </button>
            )}
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsQuickViewOpen(true); 
                setQuickViewQty(1); 
              }}
              className="w-12 bg-gray-600 text-white flex items-center justify-center hover:bg-gray-800 transition-colors border-t border-gray-600"
            >
              <Eye className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
        
        <h3 className="text-[13px] text-gray-600 font-medium truncate mb-1 group-hover:text-black transition-colors mt-2">
          {product.name}
        </h3>
        <p className="font-bold text-[15px] text-black">
          {product.basePrice.toLocaleString()}đ
        </p>
      </div>

      {isQuickViewOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsQuickViewOpen(false)}
          ></div>

          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsQuickViewOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black z-20 bg-white/50 rounded-full p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full md:w-1/2 bg-[#f5f5f5] p-10 flex items-center justify-center relative">
               {isOutOfStock && (
                  <div className="absolute top-6 left-6 bg-[#555] text-white text-[12px] font-bold px-4 py-2 rounded-full z-10 shadow-sm">
                    Hết hàng
                  </div>
                )}
              <img 
                src={displayImage} 
                alt={product.name} 
                className={`w-full h-auto object-contain mix-blend-multiply drop-shadow-xl ${isOutOfStock ? 'opacity-60' : ''}`}
              />
            </div>

            <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-medium text-gray-800 mb-2">{product.name}</h2>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <span>Mã sản phẩm: <strong className="text-black">EVR-{product.id}</strong></span>
                <span>|</span>
                <span>Tình trạng: <strong className={isOutOfStock ? "text-red-600" : "text-black"}>{isOutOfStock ? 'Hết hàng' : 'Còn hàng'}</strong></span>
              </div>

              <div className="bg-gray-50 p-5 rounded-md mb-8">
                <div className="flex items-center gap-8">
                  <span className="font-bold text-gray-700">Giá:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {product.basePrice.toLocaleString()}đ
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <span className="font-bold text-gray-700">Số lượng:</span>
                <div className="flex items-center border border-gray-200 rounded-sm bg-gray-50">
                  <button 
                    onClick={() => setQuickViewQty(prev => Math.max(1, prev - 1))}
                    disabled={isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center bg-white font-bold text-sm border-x border-gray-200">
                    {isOutOfStock ? 0 : quickViewQty}
                  </span>
                  <button 
                    onClick={() => setQuickViewQty(prev => Math.min(availableStock, prev + 1))}
                    disabled={isOutOfStock || quickViewQty >= availableStock}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {isOutOfStock ? (
                 <button 
                  disabled
                  className="w-full bg-gray-400 text-white font-bold py-4 rounded-sm transition-colors uppercase tracking-wider cursor-not-allowed"
                >
                  SẢN PHẨM HẾT HÀNG
                </button>
              ) : (
                <button 
                  onClick={handleQuickViewAddToCart}
                  className="w-full bg-[#e30019] text-white font-bold py-4 rounded-sm hover:bg-red-700 transition-colors uppercase tracking-wider shadow-lg shadow-red-500/30"
                >
                  Thêm vào giỏ
                </button>
              )}

              <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <button 
                  onClick={() => {
                    setIsQuickViewOpen(false);
                    navigate(`/product/${product.id}`);
                  }}
                  className="text-gray-500 hover:text-black text-sm uppercase tracking-wide hover:underline decoration-2 underline-offset-4 font-medium transition-all"
                >
                  Xem chi tiết sản phẩm »
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}