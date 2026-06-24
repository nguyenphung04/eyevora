import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#f9f9f9] border-t py-16 px-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
              <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Eyevora</h2>
              <p className="text-sm text-gray-500 leading-relaxed pr-6">
                Tự hào mang đến các sản phẩm kính mắt thời trang, chất lượng cao, bảo vệ đôi mắt của bạn mỗi ngày.
              </p>
          </div>
          
          <div>
              <h3 className="font-bold mb-4 uppercase text-sm">Chính sách</h3>
              <ul className="text-sm text-gray-500 space-y-3">
                  <li>
                    <Link to="/chinh-sach-bao-hanh" className="hover:text-black transition-colors">Chính sách bảo hành</Link>
                  </li>
                  <li>
                    <Link to="/bao-mat-thong-tin" className="hover:text-black transition-colors">Bảo mật thông tin</Link>
                  </li>
              </ul>
          </div>
          
          <div>
              <h3 className="font-bold mb-4 uppercase text-sm">Liên hệ</h3>
              <ul className="text-sm text-gray-500 space-y-3">
                  <li>Hotline: 0999 257 533</li>
                  <li>Email: contact@eyevora.vn</li>
                  <li>Địa chỉ: Hà Nội, Việt Nam</li>
              </ul>
          </div>
          
          <div>
              <h3 className="font-bold mb-4 uppercase text-sm">Mạng xã hội</h3>
              <div className="flex gap-4">
                <a 
                  href="https://facebook.com/your-fanpage" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                
                <a 
                  href="https://instagram.com/your-profile" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-pink-600 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
              </div>
          </div>
      </div>
      <div className="border-t mt-12 pt-6 text-center text-xs text-gray-400">
          © 2026 EYEVORA. All rights reserved.
      </div>
    </footer>
  );
}