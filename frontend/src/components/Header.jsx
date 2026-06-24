import React, { useState, useEffect } from 'react';
import { Search, User, ShoppingBag } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export default function Header({ onOpenSearch, onOpenCart }) {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    else setUser(null);

    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error("Lỗi lấy danh mục:", err));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 flex items-center justify-between px-10 py-5 border-b z-50 bg-white">
      <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 border-2 border-yellow-400 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
          </div>
          <div>
             <h1 className="text-xl font-black tracking-widest uppercase leading-none">Eyevora</h1>
             <p className="text-[9px] font-bold tracking-[0.2em] text-gray-500 mt-1">EYEWEAR</p>
          </div>
      </Link>
      
      <nav className="hidden md:flex gap-10 text-[13px] font-bold text-gray-600 uppercase tracking-wide">
        <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
        {categories.map(category => (
          <Link 
            key={category.id} 
            to={`/category/${category.id}`}
            className="hover:text-black transition-colors"
          >
            {category.name}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-6 text-gray-600">
          <Search className="w-[18px] h-[18px] cursor-pointer hover:text-black stroke-[2.5]" onClick={onOpenSearch} />
          <div className="relative group py-2">
            <User className={`w-[18px] h-[18px] cursor-pointer stroke-[2.5] transition-colors ${user ? 'text-black' : 'hover:text-black'}`} />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white shadow-xl rounded-md border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                {!user ? (
                  <>
                    <Link to="/login" className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors">Đăng nhập / Đăng ký</Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Link to="/track-order" className="block px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-black transition-colors">Tra cứu đơn hàng</Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500">Xin chào, <br/><span className="text-sm font-bold text-gray-900">{user.fullName}</span></div>
                    <div className="border-t border-gray-100 my-1"></div>
                    {user.role === 'ADMIN' && (<Link to="/admin" className="block px-4 py-2 hover:bg-gray-50 text-sm font-bold text-blue-600 transition-colors">Quản trị hệ thống</Link>)}
                    <Link to="/profile" state={{ tab: 'account' }} className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors">Tài khoản của tôi</Link>
                    <Link to="/profile" state={{ tab: 'orders' }} className="block px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-black transition-colors">Lịch sử mua hàng</Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-medium text-red-500 transition-colors">Đăng xuất</button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="relative cursor-pointer hover:text-black" onClick={onOpenCart}>
            <ShoppingBag className="w-[18px] h-[18px] stroke-[2.5]" />
            <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">{cartCount}</span>
          </div>
      </div>
    </header>
  );
}