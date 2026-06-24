import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Ticket } from 'lucide-react';
import api from '../api/axios';

export default function VoucherPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('hasSeenVoucherPopup');
    
    if (hasSeen) return;

    const fetchVoucher = async () => {
      try {
        const response = await api.get('/admin/vouchers'); 
        const allVouchers = response.data;
        
        const now = new Date();

        const validVouchers = allVouchers.filter(v => {

          const isActive = v.isActive !== false && v.active !== false && v.status !== false;

          const endDateStr = v.expirationDate || v.endDate || v.expireDate;
          const isNotExpired = endDateStr ? new Date(endDateStr) > now : true;

          const limit = v.usageLimit || v.maxUsage || v.quantity;
          const used = v.usageCount || v.usedCount || v.used || 0;
          const hasStock = limit ? used < limit : true;

          return isActive && isNotExpired && hasStock;
        });

        const voucherToShow = validVouchers.length > 0 ? validVouchers[0] : null

        if (voucherToShow) {
          setActiveVoucher(voucherToShow);
          setTimeout(() => {
            setIsOpen(true);
          }, 1500); 
        }
      } catch (error) {
        console.error("Lỗi khi tải Voucher cho Popup:", error);
      }
    };

    fetchVoucher();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenVoucherPopup', 'true');
  };

  const handleCopy = () => {
    if (activeVoucher) {
      navigator.clipboard.writeText(activeVoucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !activeVoucher) return null;
  const isPercent = activeVoucher.discountType === 'PERCENTAGE';
  const discountLabel = isPercent 
    ? `Giảm ${activeVoucher.discountValue}%` 
    : `Giảm ${activeVoucher.discountValue?.toLocaleString()}đ`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-2xl relative z-10 max-w-sm w-full overflow-hidden animate-in zoom-in duration-500">
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/10 hover:bg-black/20 text-gray-800 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-red-500 to-red-700 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_70%)]"></div>
          
          <div className="relative z-10 flex justify-center mb-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg">
              <Ticket className="w-8 h-8 text-white rotate-[-15deg]" />
            </div>
          </div>
          <h2 className="text-white text-2xl font-black uppercase tracking-wider relative z-10">
            {discountLabel}
          </h2>
          <p className="text-red-100 text-sm mt-2 relative z-10">Quà tặng đặc biệt hôm nay!</p>
        </div>

        <div className="p-8 text-center bg-[#fffcfb]">
          <p className="text-gray-700 font-medium mb-6">
            {activeVoucher.description || "Nhập mã dưới đây tại bước thanh toán để nhận ngay ưu đãi nhé!"}
          </p>

          <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl border border-gray-200 border-dashed">
            <span className="font-mono text-xl font-black text-red-600 tracking-widest pl-4">
              {activeVoucher.code}
            </span>
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all duration-300 ${
                copied ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Đã chép' : 'Copy'}
            </button>
          </div>

          <button 
            onClick={handleClose}
            className="mt-6 text-xs font-bold text-gray-400 hover:text-gray-600 underline decoration-gray-300 underline-offset-4"
          >
            Bỏ qua ưu đãi này
          </button>
        </div>
      </div>
    </div>
  );
}