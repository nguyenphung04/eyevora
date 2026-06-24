import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-toastify'; 

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('desc');
  const [reviews, setReviews] = useState([]);
  
  const [ratingFilter, setRatingFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/products/${id}`).then(res => { setProduct(res.data); setQuantity(1); }).catch(err => console.error(err));
    api.get(`/reviews/product/${id}`).then(res => setReviews(res.data)).catch(err => console.error(err));
    
    api.get('/products').then(res => {
      const allProducts = res.data;
      api.get(`/products/${id}`).then(prodRes => {
        const currentProd = prodRes.data;
        const scoredProducts = allProducts
          .filter(p => p.id !== currentProd.id && p.isActive !== false)
          .map(p => {
            let score = 0;
            if (p.categoryName && currentProd.categoryName && p.categoryName === currentProd.categoryName) score += 100; 
            if (p.shape && currentProd.shape && p.shape === currentProd.shape) score += 20;
            if (p.material && currentProd.material && p.material === currentProd.material) score += 10;
            return { ...p, score };
          })
          .filter(p => p.score > 0) 
          .sort((a, b) => b.score - a.score); 
        setRelatedProducts(scoredProducts.slice(0, 5));
      });
    }).catch(err => console.error(err));
  }, [id]);

  if (!product) return <div className="min-h-[50vh] flex items-center justify-center">Đang tải dữ liệu...</div>;

  const isInactive = product.isActive === false; 
  const availableStock = product.totalStock !== undefined ? product.totalStock : (product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) || 0);
  const isOutOfStock = availableStock <= 0 || isInactive; 

  const cartItem = cartItems?.find(item => item.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;

  const getImages = () => {
    let rawImages = "";
    if (product.variants && product.variants.length > 0 && product.variants[0].images) rawImages = product.variants[0].images;
    let list = [];
    if (typeof rawImages === 'string' && rawImages.trim() !== '') list = rawImages.split(',').map(s => s.trim());
    if (list.length === 0) list = ['https://via.placeholder.com/600x600?text=Eyevora+No+Image'];
    const result = [...list];
    while (result.length < 4) result.push(list[0]);
    return result.slice(0, 4);
  };

  const images = getImages(); 

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (qtyInCart + quantity > availableStock) {
      toast.warning(`Bạn đã có ${qtyInCart} SP trong giỏ. Không thể thêm vượt quá tồn kho (${availableStock})!`);
      return;
    }
    addToCart(product);
    if (quantity > 1) updateQuantity(product.id, quantity - 1);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (qtyInCart + quantity > availableStock) {
      toast.warning(`Giỏ hàng của bạn đã đạt mức tồn kho tối đa của sản phẩm này!`);
      navigate('/cart');
      return;
    }
    addToCart(product, false);
    if (quantity > 1) updateQuantity(product.id, quantity - 1);
    navigate('/cart');
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5 justify-center">
      {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-4 h-4 ${star <= rating ? 'fill-[#f1c40f] text-[#f1c40f]' : 'fill-gray-200 text-gray-200'}`} />)}
    </div>
  );

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1) : 0;
  
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(rev => {
    if (ratingCounts[rev.rating] !== undefined) ratingCounts[rev.rating]++;
  });

  const handleFilterChange = (filterValue) => {
    setRatingFilter(filterValue);
    setCurrentPage(1); 
  };

  const filteredReviews = ratingFilter === 'all' 
    ? reviews 
    : reviews.filter(rev => rev.rating === ratingFilter);

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

  return (
    <div className="bg-white px-10 pb-20 max-w-7xl mx-auto">
      <div className="text-[12px] text-gray-400 py-6 border-b mb-8 flex gap-2">
        <Link to="/" className="hover:text-black">Trang chủ</Link>
        <span>/</span>
        <Link to={product.categoryName?.toLowerCase().includes('nhựa') ? '/category/nhua' : product.categoryName?.toLowerCase().includes('kim loại') ? '/category/kim-loai' : product.categoryName?.toLowerCase().includes('râm') ? '/category/ram' : '/'} className="hover:text-black hover:underline underline-offset-4">{product.categoryName || 'Sản phẩm'}</Link>
        <span>/</span>
        <span className="text-black font-medium">{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-3/5 grid grid-cols-2 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="bg-[#f5f5f5] aspect-square flex items-center justify-center rounded-sm overflow-hidden relative">
              {isInactive ? (
                <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">NGỪNG BÁN</span>
                </div>
              ) : isOutOfStock && idx === 0 ? (
                <div className="absolute top-4 left-4 bg-[#555] text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">Hết hàng</div>
              ) : null}
              <img src={img} alt={`Hình ${idx}`} className={`w-[85%] h-[85%] object-contain mix-blend-multiply ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} />
            </div>
          ))}
        </div>

        <div className="w-full lg:w-2/5 pt-4">
          <h1 className="text-2xl font-medium text-gray-800 mb-3">{product.name}</h1>
          <div className="text-[13px] text-gray-500 mb-6 flex flex-wrap gap-x-3 gap-y-1">
            <span>Mã SP: <strong className="text-black">EVR-{product.id}</strong></span><span className="text-gray-300">|</span>
            <span>Tình trạng: <strong className={isInactive ? "text-gray-500" : isOutOfStock ? "text-red-600" : "text-green-600"}>
              {isInactive ? 'Ngừng kinh doanh' : isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
            </strong></span><span className="text-gray-300">|</span>
            <span>Kho: <strong className="text-blue-600">{availableStock}</strong></span>
          </div>

          <div className="bg-gray-50 p-6 rounded-sm mb-6">
            <div className="flex items-center gap-6"><span className="font-bold text-gray-700">Giá:</span><span className="text-2xl font-bold text-red-600">{product.basePrice.toLocaleString()}đ</span></div>
          </div>

          <div className="flex items-center gap-6 mb-6 text-[13px]">
            <span className="font-bold text-gray-700">Số lượng:</span>
            <div className="flex items-center border border-gray-200 rounded-sm bg-white">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock} className="w-8 h-8 hover:bg-gray-100 font-bold disabled:opacity-30 disabled:cursor-not-allowed">-</button>
              <span className="w-12 h-8 flex items-center justify-center border-x text-sm font-medium">{isOutOfStock ? 0 : quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(availableStock - qtyInCart, quantity + 1))} 
                disabled={isOutOfStock || (quantity + qtyInCart) >= availableStock}
                className="w-8 h-8 hover:bg-gray-100 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            {(quantity + qtyInCart) >= availableStock && availableStock > 0 && !isInactive && (
              <span className="text-xs text-red-500 italic font-bold">Đã đạt mức tối đa (Bao gồm trong giỏ)</span>
            )}
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {isInactive ? (
              <button disabled className="w-full bg-gray-300 text-gray-500 font-bold py-3 transition uppercase text-[13px] cursor-not-allowed rounded-sm">SẢN PHẨM NGỪNG KINH DOANH</button>
            ) : isOutOfStock ? (
              <button disabled className="w-full bg-gray-400 text-white font-bold py-3 transition uppercase text-[13px] cursor-not-allowed rounded-sm">SẢN PHẨM HẾT HÀNG</button>
            ) : (
              <>
                <button onClick={handleAddToCart} className="w-full border-2 border-red-600 text-red-600 bg-white font-bold py-3 hover:bg-red-50 transition uppercase text-[13px] rounded-sm">Thêm vào giỏ</button>
                <button onClick={handleBuyNow} className="w-full bg-red-600 text-white font-bold py-3 hover:bg-red-700 transition uppercase text-[13px] rounded-sm">Mua ngay</button>
              </>
            )}
          </div>

          <div className="text-[13px] text-gray-600 mb-8 pb-8 border-b border-gray-200">
            Kích thước (a*b*c-size): 40*40*40mm-S<br/>
            <span onClick={() => setIsSizeGuideOpen(true)} className="text-black font-bold underline decoration-1 underline-offset-4 cursor-pointer hover:text-blue-600 mt-2 inline-block">Hướng dẫn chọn kích thước</span>
          </div>

          <div className="space-y-3 text-[13px] text-gray-600">
            <div className="flex gap-3 items-start"><div className="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center shrink-0">🚚</div><span>Miễn phí giao hàng cho đơn hàng từ <strong>50.000đ</strong></span></div>
            <div className="flex gap-3 items-start"><div className="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center shrink-0">🛡️</div><span>Bảo hành sản phẩm 1 năm</span></div>
            <div className="flex gap-3 items-start"><div className="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center shrink-0">✔️</div><span>Mở hộp kiểm tra nhận hàng</span></div>
          </div>
        </div>
      </div>

      <div className="mt-24 border-t pt-10">
        <div className="flex gap-8 border-b pb-3 mb-8 text-sm font-bold uppercase">
          <span onClick={() => setActiveTab('desc')} className={`cursor-pointer transition-colors ${activeTab === 'desc' ? 'text-black border-b-2 border-black pb-3 -mb-[14px]' : 'text-gray-400 hover:text-black'}`}>Mô tả sản phẩm</span>
          <span onClick={() => setActiveTab('reviews')} className={`cursor-pointer transition-colors flex items-center gap-1 ${activeTab === 'reviews' ? 'text-black border-b-2 border-black pb-3 -mb-[14px]' : 'text-gray-400 hover:text-black'}`}>Đánh giá - Nhận xét <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{totalReviews}</span></span>
        </div>

        {activeTab === 'desc' ? (
          <div>
            <div className={`relative overflow-hidden transition-all duration-500 ${isDescExpanded ? 'max-h-[1000px]' : 'max-h-[150px]'}`}>
              <div className="space-y-6 text-[13px] text-gray-600 w-full lg:w-2/3">
                <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-yellow-400 shrink-0"></div><div>{(product.categoryName?.toLowerCase().includes('kim loại') || product.material?.toLowerCase().includes('kim loại')) ? (<><strong className="text-black block mb-1">Gọng Kim Loại Cao Cấp</strong>Thiết kế thanh mảnh, sang trọng, chống gỉ sét và độ bền cực cao.</>) : (<><strong className="text-black block mb-1">Gọng nhựa Poly siêu bền</strong>Siêu nhẹ, độ bền cao, mang lại cảm giác thoải mái khi đeo cả ngày.</>)}</div></div>
                <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-yellow-400 shrink-0"></div><div><strong className="text-black block mb-1">Bản lề kim loại</strong>Đóng mở mượt mà, chống gãy.</div></div>
                <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-yellow-400 shrink-0"></div><div><strong className="text-black block mb-1">Quà tặng đóng gói</strong>Mỗi sản phẩm tặng kèm 01 hộp đựng cao cấp và 01 khăn lau đa năng.</div></div>
                {product.description && <p className="mt-4 text-gray-700">{product.description}</p>}
                <p className="mt-4 italic">Eyevora rất hân hạnh được phục vụ quý khách!</p>
              </div>
              {!isDescExpanded && <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent"></div>}
            </div>
            <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="mt-6 bg-[#333] text-white text-xs font-bold uppercase px-6 py-2.5 hover:bg-black transition-colors">{isDescExpanded ? 'Rút gọn nội dung' : 'Xem thêm nội dung'}</button>
          </div>
        ) : (
          <div className="w-full lg:w-2/3 animate-in fade-in duration-300">
            {totalReviews === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100"><div className="text-4xl mb-3">⭐</div><h3 className="font-bold text-gray-800 mb-1">Chưa có đánh giá nào</h3><p className="text-sm text-gray-500">Hãy trở thành người đầu tiên đánh giá sản phẩm này sau khi mua hàng nhé!</p></div>
            ) : (
              <div className="space-y-6">
                
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="text-center md:w-1/4 shrink-0">
                      <div className="text-4xl font-black text-gray-900 mb-1">{avgRating}</div>
                      {renderStars(Math.round(avgRating))}
                      <div className="text-xs text-gray-500 mt-2">{totalReviews} đánh giá</div>
                    </div>
                    <div className="md:w-3/4 w-full flex flex-col gap-2 border-l border-gray-200 pl-8">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingCounts[star];
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3 text-[13px]">
                            <span className="w-8 flex items-center justify-end gap-1 font-bold text-gray-600">{star} <Star className="w-3 h-3 fill-gray-400 text-gray-400" /></span>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#f1c40f] h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="w-6 text-gray-500 text-xs text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-200 flex flex-wrap gap-2 justify-center md:justify-start">
                    <button onClick={() => handleFilterChange('all')} className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-colors ${ratingFilter === 'all' ? 'border-gray-800 text-gray-800 bg-white shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-200'}`}>Tất cả</button>
                    {[5, 4, 3, 2, 1].map(star => (
                      <button key={star} onClick={() => handleFilterChange(star)} className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-colors ${ratingFilter === star ? 'border-gray-800 text-gray-800 bg-white shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-200'}`}>
                        {star} Sao ({ratingCounts[star]})
                      </button>
                    ))}
                  </div>
                </div>

                {filteredReviews.length === 0 ? (
                     <div className="text-center py-6 text-gray-500 italic text-sm">Không có đánh giá nào cho phân loại này.</div>
                ) : (
                  <>
                    {currentReviews.map((rev) => (
                      <div key={rev.id} className="border-b border-gray-100 pb-6 mb-6 last:border-0">
                        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{rev.userName?.charAt(0).toUpperCase()}</div><div><div className="font-bold text-sm text-gray-900">{rev.userName}</div><div className="text-xs text-gray-400">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</div></div></div>{renderStars(rev.rating)}</div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{rev.comment}</p>
                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8 pt-4">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-800 hover:text-gray-800 disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                              currentPage === idx + 1 
                                ? 'bg-gray-900 text-white shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}

                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-800 hover:text-gray-800 disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-24 border-t pt-16">
          <h2 className="text-2xl font-black uppercase tracking-widest text-center mb-10">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {relatedProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}

      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSizeGuideOpen(false)}></div>
          <div className="bg-white rounded-md shadow-2xl relative z-10 max-w-4xl w-full overflow-hidden animate-in zoom-in-95">
            <button onClick={() => setIsSizeGuideOpen(false)} className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-600 hover:text-black rounded-full p-1.5 transition-colors z-20 shadow-sm"><X className="w-5 h-5" /></button>
            <img src="https://res.cloudinary.com/dqkhy4odr/image/upload/v1777998421/size_select_nnjvzj.png" alt="Hướng dẫn chọn size kính Eyevora" className="w-full h-auto block" />
          </div>
        </div>
      )}
    </div>
  );
}