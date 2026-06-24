import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTabs, setActiveTabs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories')
    ]).then(([productRes, categoryRes]) => {
      setAllProducts(productRes.data);
      setCategories(categoryRes.data);
      const initialTabs = {};
      categoryRes.data.forEach(cat => initialTabs[cat.id] = 'Tất cả');
      setActiveTabs(initialTabs);
    }).catch(err => console.error("Lỗi gọi API:", err));
  }, []);

  const handleTabChange = (categoryId, tabName) => {
    setActiveTabs(prev => ({ ...prev, [categoryId]: tabName }));
  };

  const getFilteredProducts = (categoryName, materialTab) => {
    let list = [...allProducts];
    list = list.filter(p => p.isActive !== false);

    list = list.filter(p => p.categoryName === categoryName);

    if (materialTab !== 'Tất cả') {
        list = list.filter(p => p.material === materialTab);
    }
    return list.slice(0, 10);
  };

  const renderSection = (category) => {
    const currentTab = activeTabs[category.id] || 'Tất cả';
    
    return (
      <section key={category.id} className="mt-20 text-center">
        <h2 className="text-3xl font-bold uppercase mb-8 tracking-wider text-gray-800">{category.name}</h2>
        <div className="flex justify-center gap-8 text-[15px] font-bold text-gray-400 border-b pb-3 mb-10">
            {['Tất cả', 'Nhựa', 'Kim loại'].map(tab => (
              <span 
                key={tab} 
                onClick={() => handleTabChange(category.id, tab)} 
                className={`cursor-pointer transition-all duration-300 relative uppercase tracking-wide ${currentTab === tab ? 'text-black after:content-[""] after:absolute after:-bottom-3.5 after:left-0 after:w-full after:h-0.5 after:bg-black' : 'hover:text-black'}`}
              >
                {tab === 'Tất cả' ? 'Tất cả' : `Gọng ${tab}`}
              </span>
            ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {getFilteredProducts(category.name, currentTab).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        <button onClick={() => navigate(`/category/${category.id}`)} className="mt-12 px-10 py-3 border border-black text-[11px] font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-widest">
          Xem tất cả {category.name}
        </button>
      </section>
    );
  };

  return (
    <main className="px-10 pb-20">
      {categories.map(category => renderSection(category))}
    </main>
  );
}