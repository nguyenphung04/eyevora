import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquareText, X } from 'lucide-react';
import api from '../api/axios';
import { Link, useLocation } from 'react-router-dom';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const location = useLocation();
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: 'Xin chào! Mình là trợ lý AI của Eyevora 👋\nMình có thể giúp gì cho bạn?', 
      products: [],
      timestamp: getCurrentTime()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      sender: 'user', 
      text: userMsg,
      timestamp: getCurrentTime()
    }]);
    
    setLoading(true);

    try {
      const response = await api.post('/chat/guest/message', { message: userMsg });
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: response.data.botReply, 
        products: response.data.suggestedProducts || [],
        timestamp: getCurrentTime()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: 'Rất tiếc, hệ thống đang bận. Bạn vui lòng thử lại sau nhé!',
        timestamp: getCurrentTime()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {!isOpen && (
        <div className="group relative">
          <div 
            onClick={() => setIsOpen(true)}
            className="w-[60px] h-[60px] bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:scale-110 hover:-rotate-12 transition-all duration-300"
          >
            <MessageSquareText className="text-white w-7 h-7" />
          </div>
          <div className="absolute right-[75px] top-[14px] bg-white text-gray-800 text-[13px] font-bold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border">
            Trợ lý AI Eyevora
          </div>
        </div>
      )}

      {isOpen && (
        <div className="w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#60a5fa] px-5 py-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                🤖
              </div>
              <div>
                <h3 className="text-[16px] font-bold leading-tight">Trợ lý Eyevora</h3>
                <p className="text-[12px] text-blue-100 mt-0.5">Đang hoạt động</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#f8fafe] custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                
                {msg.sender === 'user' ? (
                  <>
                    <div className="max-w-[80%] bg-[#dbe6fd] text-[#1e3a8a] px-4 py-3 rounded-2xl rounded-tr-sm text-[14px] shadow-sm whitespace-pre-wrap">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5">{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <div className="max-w-[90%] bg-white border border-gray-100 text-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm text-[14px] shadow-sm whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5 mb-2">{msg.timestamp}</span>
                    {msg.products && msg.products.length > 0 && (
                      <div className="w-full flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x">
                        {msg.products.map((p) => (
                          <Link 
                            to={`/product/${p.id}`} 
                            key={p.id}
                            className="min-w-[150px] max-w-[150px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow snap-start flex flex-col group"
                          >
                            <div className="h-[120px] bg-[#f4f5f7] p-3 flex items-center justify-center">
                              <img 
                                src={p.imageUrl || 'https://via.placeholder.com/150'} 
                                className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" 
                                alt={p.name} 
                              />
                            </div>
                            <div className="p-3 flex flex-col flex-1 border-t border-gray-50">
                              <h4 className="text-[12px] font-medium text-gray-700 line-clamp-2 leading-snug mb-2">{p.name}</h4>
                              <p className="text-[15px] font-black text-gray-900 mt-auto">{p.basePrice?.toLocaleString()}đ</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex flex-col items-start">
                <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[14px] px-3 text-gray-700 placeholder-gray-400"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-10 h-10 bg-[#60a5fa] text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}