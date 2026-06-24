import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { X } from 'lucide-react'; 

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false); 
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    otp: ''
  });

  useEffect(() => {
    const savedTime = sessionStorage.getItem('register_otp_time');
    const savedEmail = sessionStorage.getItem('register_otp_email');
    
    if (savedTime && savedEmail) {
      const timeLeft = Math.floor((parseInt(savedTime) - Date.now()) / 1000);
      if (timeLeft > 0) {
        setCountdown(timeLeft);
        setFormData(prev => ({ ...prev, email: savedEmail }));
        if (isLogin) setIsLogin(false);
      } else {
        sessionStorage.removeItem('register_otp_time');
        sessionStorage.removeItem('register_otp_email');
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      sessionStorage.removeItem('register_otp_time');
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (isLogin) {
      setLoading(true);
      try {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        const userData = response.data.user || response.data;
        const userRole = userData.role;

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          userId: userData.userId || userData.id,
          fullName: userData.fullName,
          role: userRole,
          email: userData.email,
          phone: userData.phone 
        }));

        setMessage({ text: 'Đăng nhập thành công! Đang chuyển hướng...', type: 'success' });
        setTimeout(() => {
          if(userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') {
            navigate('/admin/dashboard'); 
          } else {
            navigate('/'); 
          }
        }, 1000);
      } catch (error) {
        const errorMsg = error.response?.data || 'Tài khoản hoặc mật khẩu không chính xác!';
        setMessage({ text: typeof errorMsg === 'string' ? errorMsg : 'Đăng nhập thất bại', type: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      const savedEmail = sessionStorage.getItem('register_otp_email');

      if (countdown > 0) {
        if (formData.email === savedEmail) {
          setShowOtpModal(true);
          return;
        } else {
          sessionStorage.removeItem('register_otp_time');
          setCountdown(0);
        }
      }

      setLoading(true);
      try {
        await api.post('/auth/send-otp', { 
          email: formData.email,
          phone: formData.phone,
          type: 'REGISTER'
        });
        
        setCountdown(60);
        sessionStorage.setItem('register_otp_time', Date.now() + 60000);
        sessionStorage.setItem('register_otp_email', formData.email);
        
        setShowOtpModal(true); 
        setMessage({ text: '', type: '' }); 
      } catch (error) {
        setMessage({ text: error.response?.data || "Lỗi khi gửi mã OTP!", type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyAndRegister = async () => {
    if (formData.otp.length !== 6) {
      setMessage({ text: 'Vui lòng nhập đủ 6 số OTP!', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await api.post('/auth/register', formData);
      
      sessionStorage.removeItem('register_otp_time');
      sessionStorage.removeItem('register_otp_email');
      setShowOtpModal(false); 

      const userData = response.data.user || response.data;
      const userRole = userData.role;

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        userId: userData.userId || userData.id,
        fullName: userData.fullName,
        role: userRole,
        email: userData.email,
        phone: userData.phone 
      }));

      setMessage({ text: 'Đăng ký thành công! Đang chuyển hướng...', type: 'success' });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      const errorMsg = error.response?.data || 'Mã xác nhận không đúng hoặc đã hết hạn!';
      setMessage({ text: typeof errorMsg === 'string' ? errorMsg : 'Đăng ký thất bại', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); 
    setFormData({ ...formData, otp: value });
  };

  const handleResendOtp = async () => {
    setIsSendingOtp(true);
    setMessage({ text: '', type: '' });
    try {
      await api.post('/auth/send-otp', { 
        email: formData.email,
        phone: formData.phone,
        type: 'REGISTER'
      });
      setCountdown(60);
      sessionStorage.setItem('register_otp_time', Date.now() + 60000);
      setMessage({ text: 'Đã gửi lại mã xác nhận mới!', type: 'success' });
    } catch (error) {
      setMessage({ text: error.response?.data || "Lỗi khi gửi lại mã!", type: 'error' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4 py-12 font-sans relative">
      
      <div className="flex items-center justify-center gap-3 text-[22px] font-bold mb-8">
        <button 
          className={`pb-1 transition-all ${isLogin ? 'text-gray-800 border-b-[2px] border-gray-800' : 'text-gray-300 hover:text-gray-500'}`}
          onClick={() => { setIsLogin(true); setMessage({text:'', type:''}); }}
          type="button"
        >
          Đăng nhập
        </button>
        <span className="text-gray-300 font-light text-2xl mx-1 mb-1">|</span>
        <button 
          className={`pb-1 transition-all ${!isLogin ? 'text-gray-800 border-b-[2px] border-gray-800' : 'text-gray-300 hover:text-gray-500'}`}
          onClick={() => { setIsLogin(false); setMessage({text:'', type:''}); }}
          type="button"
        >
          Đăng ký
        </button>
      </div>

      <div className="w-full max-w-[450px]">
        {!showOtpModal && message.text && (
          <div className={`mb-4 p-3 text-sm rounded font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="Họ và tên" 
                className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
              <input 
                type="tel" 
                name="phone"
                placeholder="Số điện thoại" 
                className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
                required
                value={formData.phone}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData({...formData, phone: onlyNumbers});
                }}
              />
            </>
          )}

          <input 
            type="email" 
            placeholder={isLogin ? "Vui lòng nhập email của bạn" : "Email"} 
            className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập đúng định dạng email (VD: nguyenvana@gmail.com)')}
            onInput={(e) => e.target.setCustomValidity('')}
          />
          
          <input 
            type="password" 
            placeholder={isLogin ? "Vui lòng nhập mật khẩu" : "Mật khẩu (từ 8 ký tự)"} 
            className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
            required
            minLength={8}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          <div className="flex items-start mt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#333333] hover:bg-black disabled:bg-gray-400 text-white text-[12px] font-bold uppercase px-8 py-3.5 transition-colors flex-shrink-0"
            >
              {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
            </button>

            <div className="flex flex-col text-[13px] text-gray-500 space-y-1.5 ml-4 justify-center py-1">
              {isLogin ? (
                <>
                  <div>Bạn chưa có tài khoản? <span onClick={() => { setIsLogin(false); setMessage({text:'', type:''}); }} className="text-[#3498db] cursor-pointer hover:underline font-medium">Đăng ký</span></div>
                  <div>Bạn quên mật khẩu? <Link to="/forgot-password" className="text-[#3498db] hover:underline font-medium">Quên mật khẩu?</Link></div>
                </>
              ) : (
                <div>Bạn đã có tài khoản? <span onClick={() => { setIsLogin(true); setMessage({text:'', type:''}); }} className="text-[#3498db] cursor-pointer hover:underline font-medium">Đăng nhập ngay</span></div>
              )}
            </div>
          </div>
        </form>
      </div>
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">Xác thực Email</h3>
              <button onClick={() => setShowOtpModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {message.text && (
                <div className={`mb-4 p-2.5 text-xs rounded font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {message.text}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-5 leading-relaxed text-center">
                Mã xác nhận gồm 6 số đã được gửi tới email <br/>
                <span className="font-bold text-gray-900">{formData.email}</span>
              </p>

              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength="6"
                  className="w-full bg-[#f5f5f5] text-gray-800 px-4 py-4 text-lg outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors text-center font-black tracking-[0.5em] rounded-md border border-gray-200 focus:border-gray-400"
                  value={formData.otp}
                  onChange={handleOtpChange}
                />

                <button 
                  onClick={handleVerifyAndRegister}
                  disabled={loading || formData.otp.length !== 6}
                  className="w-full bg-[#333333] hover:bg-black disabled:bg-gray-400 text-white text-[13px] font-bold uppercase py-3.5 rounded-md transition-colors shadow-md"
                >
                  {loading ? 'Đang xác thực...' : 'Xác nhận & Hoàn tất'}
                </button>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm">
                <span className="text-gray-500">Chưa nhận được mã? </span>
                {countdown > 0 ? (
                  <span className="text-red-500 font-bold">Vui lòng chờ {countdown}s</span>
                ) : (
                  <button 
                    onClick={handleResendOtp} 
                    disabled={isSendingOtp}
                    className="text-blue-600 font-bold hover:underline disabled:text-gray-400"
                  >
                    {isSendingOtp ? 'Đang gửi...' : 'Gửi lại mã'}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}