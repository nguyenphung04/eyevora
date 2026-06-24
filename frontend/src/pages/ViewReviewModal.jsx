import React from 'react';
import { X, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ViewReviewModal({ isOpen, onClose, item }) {
  const navigate = useNavigate();

  if (!isOpen || !item) return null;

  const handleGoToProduct = () => {
    onClose(); 
    navigate(`/product/${item.productId}`);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-2xl relative z-10 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-black bg-white/50 hover:bg-white rounded-full p-1.5 transition-colors z-20 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <div 
          onClick={handleGoToProduct}
          className="w-full md:w-1/2 bg-[#f5f5f5] p-6 flex flex-col items-center justify-center cursor-pointer group hover:bg-[#ebebeb] transition-colors"
        >
          <img 
            src={item.imageUrl} 
            alt={item.productName} 
            className="w-48 h-48 object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300 mb-4" 
          />
          <h3 className="font-bold text-gray-900 text-center text-lg">{item.productName}</h3>
          <p className="text-xs text-gray-500 uppercase mt-1 mb-2">{item.colorName}</p>
          <p className="text-red-600 font-bold text-lg">{item.price?.toLocaleString()}đ</p>
          
          <div className="mt-6 text-xs font-bold border-b border-gray-400 text-gray-500 group-hover:text-black group-hover:border-black transition-colors">
            XEM CHI TIẾT SẢN PHẨM »
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Đánh giá của bạn</h2>
          
          <div className="mb-5">
            <div className="text-sm font-bold text-gray-500 mb-2">Chất lượng sản phẩm:</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 ${star <= item.myRating ? 'fill-[#f1c40f] text-[#f1c40f]' : 'fill-gray-200 text-gray-200'}`} 
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-gray-500 mb-2">Nội dung nhận xét:</div>
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-700 min-h-[100px] whitespace-pre-wrap">
              {item.myComment || <i className="text-gray-400">(Bạn không để lại nội dung bình luận)</i>}
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}