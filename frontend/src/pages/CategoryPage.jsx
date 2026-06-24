import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState(Number(id));
  const [activeMaterial, setActiveMaterial] = useState('Tất cả'); 
  const [activeShape, setActiveShape] = useState('Tất cả');
  const [sortOption, setSortOption] = useState('default');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories')
    ]).then(([productRes, categoryRes]) => {
      setProducts(productRes.data);
      setCategories(categoryRes.data);
      if (id) setActiveCategory(Number(id));
      else if (categoryRes.data.length > 0) setActiveCategory(categoryRes.data[0].id);
    }).catch(err => console.error("Lỗi gọi API:", err));
  }, [id]);

  useEffect(() => { setCurrentPage(1); }, [activeCategory, activeMaterial, activeShape, sortOption]);

  const currentCategoryObj = categories.find(c => c.id === activeCategory);

  const getProcessedProducts = () => {
    let list = [...products];

    if (currentCategoryObj) {
      list = list.filter(p => p.categoryName === currentCategoryObj.name);
    }

    if (activeMaterial !== 'Tất cả') list = list.filter(p => p.material === activeMaterial);
    if (activeShape !== 'Tất cả') list = list.filter(p => p.shape === activeShape);

    if (sortOption === 'price_asc') list.sort((a, b) => a.basePrice - b.basePrice);
    else if (sortOption === 'price_desc') list.sort((a, b) => b.basePrice - a.basePrice);

    return list;
  };

  const processedList = getProcessedProducts();
  const totalPages = Math.ceil(processedList.length / itemsPerPage);
  const currentProducts = processedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getDisplayTitle = () => {
    let title = currentCategoryObj ? currentCategoryObj.name : "Đang tải...";
    if (activeMaterial !== 'Tất cả') title += ` > Gọng ${activeMaterial}`;
    if (activeShape !== 'Tất cả') title += ` > Dáng ${activeShape}`;
    return title;
  };

  const SidebarMaterial = ({ materialName }) => {
    const isActive = activeMaterial === materialName;
    return (
      <div className="mb-1">
        <div 
          className="flex justify-between items-center py-2 cursor-pointer group"
          onClick={() => {
              setActiveMaterial(isActive ? 'Tất cả' : materialName);
              setActiveShape('Tất cả');
          }}
        >
          <span className={`text-[15px] transition-colors ${isActive ? 'text-black font-medium' : 'text-gray-600 group-hover:text-black'}`}>
            Gọng {materialName}
          </span>
          {isActive ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <ul className="pl-4 pb-3 pt-1 space-y-3">
            <li className={`text-[14px] cursor-pointer transition-colors ${activeShape === 'Tất cả' ? 'text-black font-medium' : 'text-gray-500 hover:text-black'}`} onClick={() => setActiveShape('Tất cả')}>Tất cả dáng</li>
            {['Tròn', 'Vuông', 'Chữ nhật'].map(shape => (
              <li key={shape} className={`text-[14px] cursor-pointer transition-colors ${activeShape === shape ? 'text-black font-medium' : 'text-gray-500 hover:text-black'}`} onClick={() => setActiveShape(shape)}>
                Dáng {shape}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="px-10 pb-24 bg-[#fafafa] min-h-screen">
      <div className="text-[13px] text-gray-500 py-6 mb-4 flex gap-2">
        <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
        <span>/</span>
        <span className="text-black">{getDisplayTitle().split(' > ')[0]}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-[260px] shrink-0">
          <h2 className="text-2xl font-medium text-gray-900 mb-8 tracking-wide">Bộ lọc</h2>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}>
              <h3 className="font-semibold text-[15px] text-gray-900">Danh mục sản phẩm</h3>
              {isCategoryMenuOpen ? <Minus className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCategoryMenuOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {categories.map(category => (
                <div key={category.id} className="mb-2">
                  <div 
                    className={`text-[15px] py-2 cursor-pointer transition-colors ${activeCategory === category.id ? 'text-black font-medium' : 'text-gray-600 hover:text-black'}`}
                    onClick={() => {
                      setActiveCategory(category.id);
                      navigate(`/category/${category.id}`);
                    }}
                  >
                    {category.name}
                  </div>
                  {activeCategory === category.id && (
                    <div className="pl-4 mt-1 border-l-2 border-gray-100 ml-2">
                      <SidebarMaterial materialName="Nhựa" />
                      <SidebarMaterial materialName="Kim loại" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b border-gray-200">
            <div className="text-[15px] text-gray-600 mb-4 sm:mb-0">
              <span className="capitalize">{getDisplayTitle()} </span>
              <strong className="text-black font-semibold">{processedList.length}</strong> sản phẩm
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[14px] text-gray-500">Sắp xếp theo</span>
              <select 
                className="border border-gray-300 px-4 py-2 bg-white rounded-sm text-[14px] text-gray-700 outline-none cursor-pointer focus:border-gray-500 w-[200px]" 
                value={sortOption} 
                onChange={e => setSortOption(e.target.value)}
              >
                <option value="default">Mới nhất</option>
                <option value="price_asc">Giá: Tăng dần</option>
                <option value="price_desc">Giá: Giảm dần</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {currentProducts.map(product => <ProductCard key={product.id} product={product} />)}
            {currentProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-5xl mb-4">👓</div>
                <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-20 text-[14px]">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200 cursor-pointer'}`}>{'<'}</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
                <button key={pageNumber} onClick={() => setCurrentPage(pageNumber)} className={`w-9 h-9 rounded flex items-center justify-center font-medium transition-colors ${currentPage === pageNumber ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'}`}>{pageNumber}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200 cursor-pointer'}`}>{'>'}</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}