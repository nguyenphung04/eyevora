import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, Banknote, ShieldCheck, Tag, X, Ticket } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import api from '../api/axios';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const isLoggedIn = !!localStorage.getItem('token');
  const [step, setStep] = useState(1); 
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [formData, setFormData] = useState(() => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    return {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      addressDetail: '',
      provinceCode: '', provinceName: '',
      districtCode: '', districtName: '',
      wardCode: '', wardName: '',
    };
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  const [voucherCodeInput, setVoucherCodeInput] = useState(''); 
  const [appliedVoucherCode, setAppliedVoucherCode] = useState(''); 
  const [discountAmount, setDiscountAmount] = useState(0); 
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showVoucherList, setShowVoucherList] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && !isRedirecting) navigate('/cart');
  }, [cartItems, navigate, isRedirecting]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Lỗi lấy Tỉnh/Thành:", err));
      
    const fetchVouchers = async () => {
      try {
        const response = await api.get('/admin/vouchers');
        const now = new Date();
        const validVouchers = response.data.filter(v => {
          const isActive = v.isActive !== false && v.active !== false && v.status !== false;
          const endDateStr = v.expirationDate || v.endDate || v.expireDate;
          const isNotExpired = endDateStr ? new Date(endDateStr) > now : true;
          const limit = v.usageLimit || v.maxUsage || v.quantity;
          const used = v.usageCount || v.usedCount || v.used || 0;
          const hasStock = limit ? used < limit : true;
          return isActive && isNotExpired && hasStock;
        });
        setAvailableVouchers(validVouchers);
      } catch (err) {
        console.error("Lỗi tải danh sách voucher:", err);
      }
    };
    fetchVouchers();
  }, []);

  if (cartItems.length === 0 && !isRedirecting) return null; 

  const shippingFee = cartTotal >= 50000 ? 0 : 10000;
  let finalTotal = cartTotal + shippingFee - discountAmount;
  if (finalTotal < 0) finalTotal = 0;

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      toast.warning("Vui lòng nhập mã giảm giá!");
      return;
    }
    
    setIsApplyingVoucher(true);
    try {
      const response = await api.post('/vouchers/apply', {
        code: voucherCodeInput.trim(),
        orderTotal: cartTotal
      });
      
      setDiscountAmount(response.data.discountAmount);
      setAppliedVoucherCode(response.data.code);
      setShowVoucherList(false);
      toast.success(`Áp dụng mã thành công! Giảm ${response.data.discountAmount.toLocaleString()}đ`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Mã giảm giá không hợp lệ hoặc không đủ điều kiện!";
      toast.error(errorMsg); 
      setDiscountAmount(0);
      setAppliedVoucherCode('');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCodeInput('');
    setAppliedVoucherCode('');
    setDiscountAmount(0);
    toast.info("Đã gỡ mã giảm giá!");
  };

  const handleSelectVoucher = (code) => {
    setVoucherCodeInput(code);
    setShowVoucherList(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const onlyNumbers = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: onlyNumbers });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, provinceCode: code, provinceName: name, districtCode: '', districtName: '', wardCode: '', wardName: '' });
    if (code) {
      fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`).then(res => res.json()).then(data => { setDistricts(data.districts || []); setWards([]); });
    } else { setDistricts([]); setWards([]); }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, districtCode: code, districtName: name, wardCode: '', wardName: '' });
    if (code) {
      fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then(res => res.json()).then(data => setWards(data.wards || []));
    } else { setWards([]); }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, wardCode: code, wardName: name });
  };

const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.addressDetail || !formData.provinceName || !formData.districtName || !formData.wardName) {
      toast.warning("Vui lòng điền đầy đủ địa chỉ giao hàng chi tiết!"); 
      return;
    }

    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (VD: 0987654321).");
      document.querySelector('input[name="phone"]').focus();
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    const fullShippingAddress = `${formData.addressDetail}, ${formData.wardName}, ${formData.districtName}, ${formData.provinceName}`;

    const orderPayload = {
      receiverName: formData.fullName,
      receiverEmail: formData.email,
      receiverPhone: formData.phone,
      shippingAddress: fullShippingAddress,
      note: "",
      paymentMethod: paymentMethod, 
      voucherCode: appliedVoucherCode || null,
      items: cartItems.map(item => ({ variantId: item.id, quantity: item.quantity }))
    };
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await api.post('/orders/guest', orderPayload, config);

      if (paymentMethod === 'VNPAY' && response.data.paymentUrl) {
        setIsRedirecting(true);
        window.location.href = response.data.paymentUrl;
      } else {
        clearCart();
        toast.success(<div>Đặt hàng thành công! </div>, { autoClose: 5000 });
        navigate('/'); 
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response && error.response.status === 401) {
        return; 
      }
      toast.error("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
      setIsLoading(false);
    } 
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#e30019] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang kết nối với cổng thanh toán VNPay...</h2>
        <p className="text-gray-500">Vui lòng không đóng trình duyệt lúc này</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="w-full lg:w-[55%] xl:w-[60%] lg:pl-20 xl:pl-40 pr-8 py-10 order-2 lg:order-1 border-r border-gray-200">
        
        <div className="mb-8">
          <Link to="/" className="text-2xl font-bold text-yellow-500 flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-400"></div> EYEVORA
          </Link>
          <div className="flex items-center text-sm text-gray-500 gap-2">
            <Link to="/cart" className="text-blue-500 hover:text-blue-700">Giỏ hàng</Link><ChevronRight className="w-4 h-4" />
            <span className={step === 1 ? "text-gray-800 font-medium" : "text-blue-500 hover:text-blue-700 cursor-pointer"} onClick={() => setStep(1)}>Thông tin giao hàng</span><ChevronRight className="w-4 h-4" />
            <span className={step === 2 ? "text-gray-800 font-medium" : "text-gray-400"}>Phương thức thanh toán</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleNextStep} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-800">Thông tin giao hàng</h2>
              {!isLoggedIn && <span className="text-sm text-gray-600">Bạn đã có tài khoản? <Link to="/login" className="text-blue-500 hover:underline">Đăng nhập</Link></span>}
            </div>

            <div className="space-y-4">
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Họ và tên" className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" required 
                onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập họ và tên người nhận')}
                onInput={(e) => e.target.setCustomValidity('')}
              />
              
              <div className="flex gap-4">
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="w-2/3 p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none transition" />
                
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Số điện thoại" className="w-1/3 p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none transition" required 
                  onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập số điện thoại liên hệ')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <select value={formData.provinceCode} onChange={(e) => { e.target.setCustomValidity(''); handleProvinceChange(e); }} className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none bg-white text-gray-700" required
                  onInvalid={(e) => e.target.setCustomValidity('Vui lòng chọn Tỉnh/Thành phố')}>
                  <option value="">Chọn Tỉnh / Thành phố</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>

                <select value={formData.districtCode} onChange={(e) => { e.target.setCustomValidity(''); handleDistrictChange(e); }} disabled={!formData.provinceCode} className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none bg-white text-gray-700 disabled:bg-gray-100" required
                  onInvalid={(e) => e.target.setCustomValidity('Vui lòng chọn Quận/Huyện')}>
                  <option value="">Chọn Quận / Huyện</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>

                <select value={formData.wardCode} onChange={(e) => { e.target.setCustomValidity(''); handleWardChange(e); }} disabled={!formData.districtCode} className="w-full md:w-1/3 p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none bg-white text-gray-700 disabled:bg-gray-100" required
                  onInvalid={(e) => e.target.setCustomValidity('Vui lòng chọn Phường/Xã')}>
                  <option value="">Chọn Phường / Xã</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
              </div>

              <input type="text" name="addressDetail" value={formData.addressDetail} onChange={handleInputChange} placeholder="Số nhà, tên đường..." className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 outline-none transition" required 
                onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường...)')}
                onInput={(e) => e.target.setCustomValidity('')}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Link to="/cart" className="text-blue-500 hover:text-blue-700 text-sm">Giỏ hàng</Link>
              <button type="submit" className="bg-[#338dbc] hover:bg-[#28739e] text-white px-8 py-4 rounded-md font-medium transition-colors">Tiếp tục đến phương thức thanh toán</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="border border-gray-200 rounded-md p-4 mb-8 text-sm">
              <div className="flex justify-between border-b pb-3 mb-3">
                <div className="flex gap-4"><span className="text-gray-500 w-20">Liên hệ</span><span className="text-gray-800">{formData.email || formData.phone}</span></div>
                <button onClick={() => setStep(1)} className="text-blue-500 hover:underline">Thay đổi</button>
              </div>
              <div className="flex justify-between border-b pb-3 mb-3">
                <div className="flex gap-4"><span className="text-gray-500 w-20">Giao tới</span><span className="text-gray-800">{formData.addressDetail}, {formData.wardName}, {formData.districtName}, {formData.provinceName}</span></div>
                <button onClick={() => setStep(1)} className="text-blue-500 hover:underline">Thay đổi</button>
              </div>
              <div className="flex justify-between">
                <div className="flex gap-4"><span className="text-gray-500 w-20">Phí ship</span><span className="text-gray-800">{shippingFee === 0 ? 'Miễn phí vận chuyển' : '10.000đ'}</span></div>
              </div>
            </div>

            <h2 className="text-xl font-medium text-gray-800 mb-4">Phương thức thanh toán</h2>
            <div className="border border-gray-200 rounded-md overflow-hidden mb-8">
              <label className={`flex items-center gap-4 p-4 cursor-pointer border-b border-gray-200 transition-colors ${paymentMethod === 'VNPAY' ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                <input type="radio" name="payment" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <CreditCard className={`w-6 h-6 ${paymentMethod === 'VNPAY' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1 text-sm font-medium text-gray-800">Thanh toán trực tuyến qua VNPAY</div>
              </label>
              <label className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <Banknote className={`w-6 h-6 ${paymentMethod === 'COD' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1 text-sm font-medium text-gray-800">Thanh toán khi giao hàng (COD)</div>
              </label>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-blue-500 hover:text-blue-700 text-sm">Quay lại thông tin giao hàng</button>
              <button onClick={handlePlaceOrder} disabled={isLoading} className="bg-[#338dbc] hover:bg-[#28739e] text-white px-10 py-4 rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? 'Đang xử lý...' : 'Hoàn tất đơn hàng'}
              </button>
            </div>
          </div>
        )}
        <div className="mt-20 border-t pt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Powered by Eyevora Store</div>
      </div>

      <div className="w-full lg:w-[45%] xl:w-[40%] bg-[#fafafa] lg:pr-20 xl:pr-40 pl-8 py-10 order-1 lg:order-2 border-b lg:border-b-0 border-gray-200">
        
        <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 pt-3 custom-scrollbar">
          {cartItems.map(item => {
            let displayImg = item.imageUrl || (item.variants?.[0]?.images?.split(',')[0]) || (typeof item.images === 'string' && item.images.split(',')[0]) || 'https://via.placeholder.com/150?text=Eyevora';
            return (
              <div key={item.id} className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-md flex items-center justify-center p-1"><img src={displayImg} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" /></div>
                  <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center z-10">{item.quantity}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-gray-500">{item.variant || 'Mặc định'}</p>
                </div>
                <span className="text-sm font-medium text-gray-700">{(item.basePrice * item.quantity).toLocaleString()}đ</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 py-6 border-y border-gray-200 mb-6 relative z-50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Nhập mã giảm giá" 
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                onFocus={() => setShowVoucherList(true)}
                onBlur={() => setTimeout(() => setShowVoucherList(false), 200)}
                disabled={appliedVoucherCode !== ''}
                className={`w-full p-3 border rounded-md outline-none transition uppercase ${appliedVoucherCode ? 'bg-green-50 text-green-700 border-green-300 font-bold' : 'border-gray-300 focus:border-blue-500'}`} 
              />
              
              {showVoucherList && !appliedVoucherCode && availableVouchers.length > 0 && (
                <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[280px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" /> Mã ưu đãi hiện có
                  </div>
                  {availableVouchers.map(v => {
                    const minOrder = v.minOrderValue || 0;
                    const isEligible = cartTotal >= minOrder;
                    const discountText = v.discountType === 'PERCENTAGE' ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString()}đ`;
                    
                    return (
                      <div 
                        key={v.id}
                        onMouseDown={() => { if (isEligible) handleSelectVoucher(v.code); }}
                        className={`p-3 border-b border-gray-100 last:border-0 transition-colors ${isEligible ? 'cursor-pointer hover:bg-blue-50' : 'opacity-60 bg-gray-50 cursor-not-allowed'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold ${isEligible ? 'text-blue-600' : 'text-gray-500'}`}>{v.code}</span>
                          <span className={`font-bold text-sm ${isEligible ? 'text-red-500' : 'text-gray-500'}`}>{discountText}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1.5">{v.description}</div>
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Đơn từ: {minOrder.toLocaleString()}đ</span>
                          {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount > 0 && (
                            <span>Tối đa: {v.maxDiscountAmount.toLocaleString()}đ</span>
                          )}
                        </div>
                        {!isEligible && (
                          <div className="text-[10px] text-red-500 mt-1.5 font-bold">
                            Chưa đủ điều kiện (Mua thêm {(minOrder - cartTotal).toLocaleString()}đ)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {appliedVoucherCode ? (
               <button onClick={handleRemoveVoucher} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-6 font-medium rounded-md transition-colors flex items-center gap-1 shrink-0">
                 <X className="w-4 h-4"/> Bỏ mã
               </button>
            ) : (
               <button 
                onClick={handleApplyVoucher} 
                disabled={isApplyingVoucher || !voucherCodeInput.trim()}
                className="bg-gray-800 hover:bg-black disabled:bg-gray-300 text-white px-6 font-medium rounded-md transition-colors shrink-0"
               >
                 {isApplyingVoucher ? 'Đang check...' : 'Sử dụng'}
               </button>
            )}
          </div>
          {appliedVoucherCode && (
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <Tag className="w-3 h-3"/> Áp dụng mã <strong>{appliedVoucherCode}</strong> thành công!
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-6">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span className="font-medium text-gray-800">{cartTotal.toLocaleString()}đ</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Giảm giá Voucher</span>
              <span className="font-bold text-red-500">-{discountAmount.toLocaleString()}đ</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Phí vận chuyển</span>
            <span className="font-medium text-gray-800">
              {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()}đ`}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-base text-gray-800 font-medium">Tổng cộng</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">VND</span>
            <span className="text-2xl font-medium text-gray-800">{finalTotal.toLocaleString()}đ</span>
          </div>
        </div>

      </div>
    </div>
  );
}