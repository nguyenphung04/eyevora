import { useState } from 'react';
// ĐÃ GỘP IMPORT TẠI ĐÂY (Thêm Navigate vào chung)
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import SearchOverlay from './components/SearchOverlay';
import ChatbotBtn from './components/ChatbotBtn';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import CartSidebar from './components/CartSidebar'; 
import { CartProvider } from './context/CartContext'; 
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout'; 
import CheckoutResult from './pages/CheckoutResult';
import OrderTracking from './pages/OrderTracking';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPassword from './pages/ForgotPassword';
import AdminCategory from './pages/admin/AdminCategory';
import PolicyPage from './pages/PolicyPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import VoucherPopup from './components/VoucherPopup';

const AdminProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative flex flex-col">
      
      <ToastContainer 
         position="top-right" 
         autoClose={2000} 
         theme="light"
         style={{ zIndex: 99999 }} 
      />
      {!isAdminRoute && (
        <>
          <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          <Header 
            onOpenSearch={() => setIsSearchOpen(true)} 
            onOpenCart={() => setIsCartOpen(true)} 
          />
        </>
      )}
      
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/result" element={<CheckoutResult />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-orders" element={<ProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/chinh-sach-bao-hanh" element={
            <PolicyPage 
              title="Chính sách bảo hành" 
              content={`1. ĐIỀU KIỆN BẢO HÀNH
          - Sản phẩm bị lỗi kỹ thuật do nhà sản xuất (tuột ốc, bong tróc lớp mạ không do tác động vật lý).
          - Thời gian áp dụng: Bảo hành 6 tháng kể từ ngày nhận hàng.
          - Khách hàng cần cung cấp mã đơn hàng hoặc số điện thoại đặt hàng.

          2. TRƯỜNG HỢP TỪ CHỐI BẢO HÀNH
          - Kính bị gãy, vỡ, trầy xước tròng kính do bất cẩn trong quá trình sử dụng.
          - Sản phẩm bị biến dạng do tiếp xúc nhiệt độ cao hoặc hóa chất.

          3. QUY TRÌNH THỰC HIỆN
          - Liên hệ hotline 0999 257 533 hoặc nhắn tin qua Fanpage để được tư vấn.
          - Gửi sản phẩm về địa chỉ: Hà Nội, Việt Nam.`} 
            />
          } />

          <Route path="/bao-mat-thong-tin" element={
            <PolicyPage 
              title="Chính sách bảo mật thông tin" 
              content={`EYEVORA cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng.
              
              Chính sách bảo mật này nhằm giúp Quý khách hiểu về cách Kinh Mắt Minh Anh thu thập và sử dụng thông tin cá nhân của mình thông qua việc sử dụng trang web, bao gồm mọi thông tin có thể cung cấp thông qua trang web khi Quý khách đăng ký tài khoản, đăng ký nhận thông tin liên lạc từ chúng tôi, hoặc khi Quý khách mua sản phẩm, dịch vụ, yêu cầu thêm thông tin dịch vụ từ chúng tôi.

              Kính Mắt Minh Anh sử dụng thông tin cá nhân của Quý khách để liên lạc khi cần thiết liên quan đến việc Quý khách sử dụng website của chúng tôi, để trả lời các câu hỏi hoặc gửi tài liệu và thông tin Quý khách yêu cầu.

              Website Kính Mắt Minh Anh coi trọng việc bảo mật thông tin và sử dụng các biện pháp tốt nhất để bảo vệ thông tin cũng như việc thanh toán của khách hàng. 

              Mọi thông tin giao dịch sẽ được bảo mật ngoại trừ trong trường hợp cơ quan pháp luật yêu cầu.`} 
            />
          } />

          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
        </Routes>
      </div>
      
      {!isAdminRoute && (
        <>
          <Footer />
          <ChatbotBtn />
          {/* <VoucherPopup />  */}
        </>
      )}
    </div>
  );
}
function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;