import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchOverlay({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      navigate(`/search?keyword=${searchQuery}`);
    }
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white w-full px-10 py-5 flex items-center shadow-md animate-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-3 cursor-pointer w-1/4">
            <div className="w-10 h-10 border-2 border-yellow-400 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
            </div>
            <div><h1 className="text-xl font-black tracking-widest uppercase leading-none">Eyevora</h1></div>
        </div>
        <div className="flex-1 max-w-3xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#f9f9f9] border border-gray-200 text-sm py-3 px-5 pr-12 rounded-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-gray-400 hover:text-black transition-colors" />
            </button>
          </form>
        </div>
        <div className="w-1/4 flex justify-end">
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-black transition-colors" /></button>
        </div>
      </div>
    </div>
  );
}