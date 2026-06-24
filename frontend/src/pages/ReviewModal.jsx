import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

export default function ReviewModal({ isOpen, onClose, orderId, itemDetails, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !itemDetails) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim() === '') {
      toast.warning("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/reviews', {
        productId: itemDetails.productId,
        orderId: orderId,
        rating: rating,
        comment: comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      setComment('');
      setRating(5);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Đánh Giá Sản Phẩm</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <img src={itemDetails.imageUrl} alt={itemDetails.productName} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
            <div>
              <div className="font-bold text-gray-800 text-sm">{itemDetails.productName}</div>
              <div className="text-xs text-gray-500 mt-1">Phân loại: {itemDetails.colorName}</div>
            </div>
          </div>
          <div className="mb-6 flex flex-col items-center">
            <div className="text-sm font-bold text-gray-800 mb-3">Chất lượng sản phẩm</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-all ${star <= rating ? 'fill-[#f1c40f] text-[#f1c40f]' : 'text-gray-300'}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <div className="text-xs text-[#f1c40f] font-bold mt-2">
              {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Tạm được' : 'Rất tệ'}
            </div>
          </div>
          <div className="mb-6">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-[#f1c40f] transition-colors resize-none h-28 bg-gray-50"
              placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-200">
              Trở lại
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-[#f1c40f] text-black font-bold rounded-lg text-sm hover:bg-yellow-500 hover:shadow-lg transition-all disabled:opacity-50">
              {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}