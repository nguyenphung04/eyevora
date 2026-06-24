import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (keyword) {
      setLoading(true);
      api.get(`/products/search?keyword=${keyword}`)
        .then(res => {
          setResults(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi tìm kiếm:", err);
          setLoading(false);
        });
    }
  }, [keyword]);

  return (
    <div className="px-10 pb-20 bg-white min-h-[60vh]">
      <div className="text-center py-10">
        <h1 className="text-3xl font-medium mb-3 text-gray-800">Tìm kiếm</h1>
        <p className="text-gray-500 text-sm">
          Có <span className="font-bold text-black">{results.length} sản phẩm</span> cho tìm kiếm
        </p>
        <div className="w-10 h-0.5 bg-black mx-auto mt-4"></div>
      </div>

      <div className="mb-6 text-sm text-gray-600">
        Kết quả tìm kiếm cho "{keyword}".
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Đang tìm kiếm...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {results.map(product => <ProductCard key={product.id} product={product} />)}
          
          {results.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-10">
              Không tìm thấy sản phẩm nào phù hợp với từ khóa của bạn.
            </p>
          )}
        </div>
      )}
    </div>
  );
}