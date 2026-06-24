import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); 
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Vui lòng nhập Email!', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await api.post('/auth/send-otp', { email });
      setMessage({ text: 'Mã xác nhận đã được gửi đến email của bạn!', type: 'success' });
      setStep(2);
      setCountdown(60);
    } catch (error) {
      setMessage({ text: error.response?.data || "Lỗi khi gửi mã!", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp!', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      setMessage({ text: 'Khôi phục mật khẩu thành công! Đang chuyển hướng...', type: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      setMessage({ text: error.response?.data || "Mã xác nhận không đúng hoặc đã hết hạn!", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4 py-12 font-sans">
      <div className="flex items-center justify-center gap-3 text-[22px] font-bold mb-8">
        <span className="pb-1 text-gray-800 border-b-[2px] border-gray-800 uppercase tracking-wider">Khôi phục mật khẩu</span>
      </div>

      <div className="w-full max-w-[450px]">
        {message.text && (
          <div className={`mb-4 p-3 text-sm rounded font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4 animate-in fade-in">
            <input 
              type="email" 
              placeholder="Nhập email đăng ký của bạn" 
              className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
            
            <div className="flex items-start mt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#333333] hover:bg-black disabled:bg-gray-400 text-white text-[12px] font-bold uppercase px-8 py-3.5 transition-colors flex-shrink-0"
              >
                {loading ? 'Đang xử lý...' : 'Gửi mã xác nhận'}
              </button>
              <div className="flex flex-col text-[13px] text-gray-500 ml-4 justify-center py-2">
                <Link to="/login" className="text-[#3498db] hover:underline font-medium">Quay lại đăng nhập</Link>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Mã xác nhận (OTP)" 
                required maxLength="6" 
                className="flex-1 bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors text-center font-bold tracking-widest"
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
              />
              <button 
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0}
                className="bg-gray-200 text-gray-600 hover:bg-gray-300 px-4 text-[12px] font-bold uppercase disabled:opacity-50 transition-colors whitespace-nowrap min-w-[120px]"
              >
                {countdown > 0 ? `Chờ ${countdown}s` : 'Gửi lại mã'}
              </button>
            </div>
            
            <input 
              type="password" 
              placeholder="Mật khẩu mới (từ 8 ký tự)" 
              required minLength={8}
              className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
            
            <input 
              type="password" 
              placeholder="Xác nhận mật khẩu mới" 
              required minLength={8}
              className="w-full bg-[#f5f5f5] text-gray-700 px-4 py-3.5 text-[14px] outline-none placeholder-gray-400 focus:bg-gray-200 transition-colors"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
            
            <div className="flex items-start mt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#333333] hover:bg-black disabled:bg-gray-400 text-white text-[12px] font-bold uppercase px-8 py-3.5 transition-colors flex-shrink-0"
              >
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}