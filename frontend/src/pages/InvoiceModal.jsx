import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, orderData }) => {
  const invoiceRef = useRef(null);

  if (!isOpen || !orderData) return null;

  const isPaid = orderData.paymentStatus === 'PAID' || orderData.orderStatus === 'COMPLETED';
  const documentTitle = isPaid ? 'HÓA ĐƠN BÁN HÀNG' : 'PHIẾU ĐẶT HÀNG';

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    
    const actionBtn = element.querySelector('.invoice-actions');
    const closeBtn = document.getElementById('close-modal-btn');
    if (actionBtn) actionBtn.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EYEVORA_${orderData.orderCode}.pdf`);
    } catch (error) {
      console.error("Lỗi xuất PDF: ", error);
      alert("Có lỗi xảy ra khi xuất PDF!");
    } finally {
      if (actionBtn) actionBtn.style.display = 'flex';
      if (closeBtn) closeBtn.style.display = 'block';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto">
      <div className="relative bg-gray-100 rounded-xl w-full max-w-2xl shadow-2xl mt-4 mb-auto">
        
        <button 
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-2 right-2 sm:-top-4 sm:-right-4 p-2 bg-red-500 rounded-full hover:bg-red-600 shadow-lg transition z-50 text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          ref={invoiceRef} 
          className="bg-white rounded-xl p-6 md:p-10 shadow-sm border border-gray-200"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-100 pb-6">
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 border-[3px] border-[#f1c40f] rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-6 h-6 bg-[#f1c40f] rounded-full"></div>
              </div>
              <div className="pt-1">
                <div className="text-2xl font-black tracking-widest uppercase text-gray-900 m-0 p-0" style={{ lineHeight: 1 }}>EYEVORA</div>
                <div className="text-[9px] font-bold tracking-[0.2em] text-gray-500 mt-1 uppercase m-0 p-0" style={{ lineHeight: 1 }}>Eyewear & Accessories</div>
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <div className="text-lg font-bold text-gray-400 m-0" style={{ lineHeight: 1 }}>#{orderData.orderCode}</div>
              <div 
                className={`mt-2 text-[10px] font-bold px-3 pt-1.5 pb-1 inline-block whitespace-nowrap rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                style={{ lineHeight: 1 }}
              >
                {isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHƯA THANH TOÁN'}
              </div>
            </div>
          </div>

          <div className="text-center text-[26px] md:text-[30px] font-extrabold text-gray-800 mb-8 tracking-tight uppercase" style={{ lineHeight: 1.2 }}>
            {documentTitle}
          </div>
          <div className="mb-8 space-y-2 text-[13px]" style={{ lineHeight: 1.5 }}>
            <div className="flex flex-col sm:flex-row">
              <span className="w-full sm:w-[160px] font-bold text-gray-800">Khách hàng:</span>
              <span className="text-gray-700">{orderData.receiverName}</span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="w-full sm:w-[160px] font-bold text-gray-800">Số điện thoại:</span>
              <span className="text-gray-700">{orderData.receiverPhone}</span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="w-full sm:w-[160px] font-bold text-gray-800">Địa chỉ:</span>
              <span className="text-gray-700">{orderData.shippingAddress}</span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="w-full sm:w-[160px] font-bold text-gray-800">Ngày đặt:</span>
              <span className="text-gray-700">{new Date(orderData.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <span className="w-full sm:w-[160px] font-bold text-gray-800">Phương thức:</span>
              <span className="text-gray-700">{orderData.paymentMethod}</span>
            </div>
          </div>
          <div className="overflow-x-auto mb-8">
            <table className="w-full min-w-[500px] border-collapse" style={{ lineHeight: 1.2 }}>
              <thead>
                <tr>
                  <th className="bg-gray-50 border-y border-gray-200 p-3 text-left text-xs text-gray-800 font-bold uppercase tracking-wider align-middle">STT</th>
                  <th className="bg-gray-50 border-y border-gray-200 p-3 text-left text-xs text-gray-800 font-bold uppercase tracking-wider align-middle">Tên sản phẩm</th>
                  <th className="bg-gray-50 border-y border-gray-200 p-3 text-center text-xs text-gray-800 font-bold uppercase tracking-wider align-middle">SL</th>
                  <th className="bg-gray-50 border-y border-gray-200 p-3 text-right text-xs text-gray-800 font-bold uppercase tracking-wider align-middle">Đơn giá</th>
                  <th className="bg-gray-50 border-y border-gray-200 p-3 text-right text-xs text-gray-800 font-bold uppercase tracking-wider align-middle">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-3 text-sm text-gray-700 align-middle">{index + 1}</td>
                    <td className="p-3 text-sm text-gray-700 align-middle">
                      <div className="font-semibold text-gray-900 mb-1" style={{ lineHeight: 1 }}>{item.productName}</div>
                      <div className="text-[11px] text-gray-500" style={{ lineHeight: 1 }}>Phân loại: {item.colorName}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-700 text-center font-medium align-middle">{item.quantity}</td>
                    <td className="p-3 text-sm text-gray-700 text-right align-middle">{item.price.toLocaleString('vi-VN')}đ</td>
                    <td className="p-3 text-sm text-gray-900 text-right font-bold align-middle">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-4">
            <div className="w-full sm:w-[280px]">
              <div className="flex justify-between py-1.5 text-[13px] text-gray-600">
                <span>Tạm tính:</span>
                <span>{orderData.totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13px] text-gray-600">
                <span>Phí vận chuyển:</span>
                <span>{orderData.shippingFee === 0 ? 'Miễn phí' : `${orderData.shippingFee.toLocaleString('vi-VN')}đ`}</span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between py-1.5 text-[13px] text-red-500">
                  <span>Giảm giá:</span>
                  <span>-{orderData.discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t border-gray-200 mt-2">
                <span className="font-bold text-gray-900 uppercase">Tổng cộng:</span>
                <span className="text-xl font-black text-[#3498db]" style={{ lineHeight: 1 }}>{orderData.finalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-gray-400 mt-6" style={{ lineHeight: 1 }}>
            Cảm ơn quý khách đã mua hàng tại EYEVORA 💛
          </div>

          <div className="invoice-actions flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button 
              onClick={handleDownloadPDF}
              className="bg-[#f1c40f] hover:bg-yellow-500 text-black px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Tải file PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;