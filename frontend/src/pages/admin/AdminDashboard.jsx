import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Glasses, ShoppingCart, LogOut, Package, TrendingUp, AlertCircle, FolderTree, Ticket, Banknote, AlertTriangle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Label } from 'recharts';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

import AdminOrders from './AdminOrders'; 
import AdminProducts from './AdminProducts';
import AdminVouchers from './AdminVouchers';
import AdminUsers from './AdminUsers';
import AdminCategory from './AdminCategory';

const STATUS_COLORS = {
  'Chờ xác nhận': '#f1c40f',
  'Đã xác nhận': '#3498db',
  'Đang giao': '#e67e22',
  'Hoàn thành': '#2ecc71',
  'Đã hủy': '#e74c3c'
};

const translateStatus = (status) => {
  const map = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
  return map[status] || status;
};

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('overview');
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeMenu === 'overview') fetchDashboardData();
  }, [activeMenu]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/admin/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const formattedPieData = res.data.orderStatusStats.map(item => ({
        ...item, label: translateStatus(item.label)
      }));
      setDashboardData({ ...res.data, orderStatusStats: formattedPieData });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleExportExcel = async () => {
    const loadingToastId = toast.loading("Đang trích xuất dữ liệu từ Database, vui lòng đợi...");
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/admin/dashboard/export-excel', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { products, customers, categories, orders, vouchers } = res.data;

      const formatStatus = (s) => {
        const map = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
        return map[s] || s;
      };
      const formatPayment = (p) => {
        const map = { PENDING: 'Chưa thanh toán', PAID: 'Đã thanh toán', REFUNDED: 'Đã hoàn tiền', FAILED: 'Thất bại' };
        return map[p] || p;
      };

      const formattedOrders = orders.map(o => ({
        "Mã Đơn": o["Mã Đơn"],
        "Khách Hàng": o["Khách Hàng"],
        "Trạng Thái Đơn": formatStatus(o["Trạng Thái Đơn"]),
        "Thanh Toán": formatPayment(o["Thanh Toán"]),
        "Tiền Hàng (VNĐ)": o["Tiền Hàng (Gốc)"],
        "Phí Ship (VNĐ)": o["Phí Vận Chuyển"],
        "Giảm Giá (VNĐ)": o["Giảm Giá Voucher"],
        "Tổng Thu (VNĐ)": o["Thanh Toán Cuối"],
        "Ngày Đặt": new Date(o["Ngày Đặt"]).toLocaleString('vi-VN')
      }));

      const wsProducts = XLSX.utils.json_to_sheet(products);
      const wsCustomers = XLSX.utils.json_to_sheet(customers);
      const wsCategories = XLSX.utils.json_to_sheet(categories);
      const wsOrders = XLSX.utils.json_to_sheet(formattedOrders);
      const wsVouchers = XLSX.utils.json_to_sheet(vouchers);

      const enableFilter = (ws) => {
        if (ws['!ref']) {
          ws['!autofilter'] = { ref: ws['!ref'] };
        }
      };
      
      enableFilter(wsProducts);
      enableFilter(wsCustomers);
      enableFilter(wsCategories);
      enableFilter(wsOrders);
      enableFilter(wsVouchers);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsProducts, "Tổng Sản Phẩm");
      XLSX.utils.book_append_sheet(wb, wsCustomers, "Tổng Khách Hàng");
      XLSX.utils.book_append_sheet(wb, wsCategories, "Danh Mục");
      XLSX.utils.book_append_sheet(wb, wsOrders, "Hóa Đơn");
      XLSX.utils.book_append_sheet(wb, wsVouchers, "Mã Giảm Giá");

      wsProducts['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 25 }];
      wsCustomers['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }];
      wsCategories['!cols'] = [{ wch: 30 }, { wch: 25 }];
      wsOrders['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
      ];
      wsVouchers['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];

      const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
      XLSX.writeFile(wb, `Du_Lieu_EYEVORA_${dateStr}.xlsx`);
      
      toast.update(loadingToastId, { render: "Xuất dữ liệu Excel thành công!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (error) {
      console.error(error);
      toast.update(loadingToastId, { render: "Lỗi khi trích xuất dữ liệu!", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7f6] font-sans overflow-hidden">
      
      <aside className="w-[240px] bg-[#2c3e50] text-white flex flex-col shrink-0">
        <div className="p-6 text-xl font-extrabold flex items-center border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#f1c40f] mr-3"></div>
          EYEVORA ADMIN
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1">
          <button onClick={() => setActiveMenu('overview')} className={`w-full flex items-center px-6 py-3.5 text-sm font-medium transition-colors text-left ${activeMenu === 'overview' ? 'bg-[#34495e] border-l-4 border-[#f1c40f] text-white' : 'text-[#bdc3c7] hover:bg-[#34495e] hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5 mr-3" /> Tổng quan
          </button>
          <button onClick={() => setActiveMenu('users')} className={`w-full flex items-center px-6 py-3.5 text-sm font-medium transition-colors text-left ${activeMenu === 'users' ? 'bg-[#34495e] border-l-4 border-[#f1c40f] text-white' : 'text-[#bdc3c7] hover:bg-[#34495e] hover:text-white'}`}>
            <Users className="w-5 h-5 mr-3" /> Người dùng
          </button>
          <button onClick={() => setActiveMenu('products')} className={`w-full flex items-center px-6 py-3.5 text-sm font-medium transition-colors text-left ${activeMenu === 'products' ? 'bg-[#34495e] border-l-4 border-[#f1c40f] text-white' : 'text-[#bdc3c7] hover:bg-[#34495e] hover:text-white'}`}>
            <Glasses className="w-5 h-5 mr-3" /> Sản phẩm
          </button>
          <button onClick={() => setActiveMenu('categories')} className={`w-full flex items-center px-6 py-3.5 text-sm font-medium transition-colors text-left ${activeMenu === 'categories' ? 'bg-[#34495e] border-l-4 border-[#f1c40f] text-white' : 'text-[#bdc3c7] hover:bg-[#34495e] hover:text-white'}`}>
            <FolderTree className="w-5 h-5 mr-3" /> Danh mục
          </button>
          <button onClick={() => setActiveMenu('orders')} className={`w-full flex items-center px-6 py-3.5 text-sm font-medium transition-colors text-left ${activeMenu === 'orders' ? 'bg-[#34495e] border-l-4 border-[#f1c40f] text-white' : 'text-[#bdc3c7] hover:bg-[#34495e] hover:text-white'}`}>
            <ShoppingCart className="w-5 h-5 mr-3" /> Đơn hàng
          </button>
          <button onClick={() => setActiveMenu('vouchers')} className={`w-full flex items-center px-6 py-3.5 text-sm font-medium transition-colors text-left ${activeMenu === 'vouchers' ? 'bg-[#34495e] border-l-4 border-[#f1c40f] text-white' : 'text-[#bdc3c7] hover:bg-[#34495e] hover:text-white'}`}>
            <Ticket className="w-5 h-5 mr-3" /> Voucher
          </button>
        </nav>
        <button onClick={handleLogout} className="w-full flex items-center px-6 py-4 text-[#e74c3c] border-t border-white/10 hover:bg-[#34495e] text-sm font-bold transition-colors text-left">
          <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        
        <div className="px-8 pt-8 flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-[28px] font-bold text-[#2c3e50]">
              {activeMenu === 'overview' ? 'Tổng quan hệ thống' : 
              activeMenu === 'orders' ? 'Quản lý đơn hàng' : 
              activeMenu === 'products' ? 'Quản lý sản phẩm' : 
              activeMenu === 'vouchers' ? 'Quản lý Voucher' : 
              activeMenu === 'users' ? 'Quản lý khách hàng' :
              activeMenu === 'categories' ? 'Quản lý Danh mục' : 'Chưa khả dụng'}
            </h1>
            {activeMenu === 'overview' && !loading && (
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-[#107c41] hover:bg-[#128c49] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                title="Xuất dữ liệu ra file Excel"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
            )}
          </div>

          <div className="bg-white px-5 py-2.5 rounded-lg shadow-sm text-[13px] font-semibold text-gray-600">
            Xin chào, Admin 👋
          </div>
        </div>

        {activeMenu === 'overview' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-[#2c3e50] rounded-full animate-spin mb-4"></div>
              <p className="font-bold">Đang tải dữ liệu thống kê...</p>
            </div>
          ) : (
            <div className="px-8 pb-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="text-[12px] text-[#7f8c8d] font-bold mb-2 uppercase tracking-wide">Doanh thu</div>
                  <div className="text-[24px] font-extrabold text-[#2c3e50] mb-2">{dashboardData?.totalRevenue?.toLocaleString()}đ</div>
                  <div className="text-[12px] font-bold text-[#2ecc71] flex items-center gap-1"><TrendingUp size={14}/> Hoàn thành</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="text-[12px] text-[#7f8c8d] font-bold mb-2 uppercase tracking-wide">Tổng đơn hàng</div>
                  <div className="text-[24px] font-extrabold text-[#2c3e50] mb-2">{dashboardData?.totalOrders}</div>
                  <div className="text-[12px] font-bold text-[#3498db] flex items-center gap-1"><ShoppingCart size={14}/> Đơn hợp lệ</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm relative overflow-hidden border-b-4 border-red-500">
                  <div className="text-[12px] text-[#7f8c8d] font-bold mb-2 uppercase tracking-wide">Đơn cần duyệt</div>
                  <div className="text-[24px] font-extrabold text-[#e74c3c] mb-2">{dashboardData?.pendingOrders}</div>
                  <div className="text-[12px] font-bold text-[#e74c3c] flex items-center gap-1"><AlertCircle size={14}/> Cần xử lý ngay</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm relative overflow-hidden border-b-4 border-[#e67e22]">
                  <div className="text-[12px] text-[#7f8c8d] font-bold mb-2 uppercase tracking-wide">Chờ hoàn tiền</div>
                  <div className="text-[24px] font-extrabold text-[#e67e22] mb-2">{dashboardData?.awaitingRefundOrders || 0}</div>
                  <div className="text-[12px] font-bold text-[#e67e22] flex items-center gap-1"><Banknote size={14}/> Hủy đã thanh toán</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="text-[12px] text-[#7f8c8d] font-bold mb-2 uppercase tracking-wide">Khách hàng</div>
                  <div className="text-[24px] font-extrabold text-[#2c3e50] mb-2">{dashboardData?.totalCustomers}</div>
                  <div className="text-[12px] font-bold text-[#9b59b6] flex items-center gap-1"><Users size={14}/> Tài khoản User</div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[#2c3e50] mb-6 text-lg">Doanh thu 7 ngày gần nhất</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData?.revenueLast7Days} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="label" stroke="#7f8c8d" tick={{fontSize: 12}}>
                           <Label value="Thời gian (Ngày)" offset={-10} position="insideBottom" style={{ fill: '#7f8c8d', fontSize: 12, fontWeight: 'bold' }} />
                        </XAxis>
                        <YAxis stroke="#7f8c8d" tickFormatter={(val) => `${val/1000}k`} tick={{fontSize: 12}}>
                           <Label value="Doanh thu (VNĐ)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#7f8c8d', fontSize: 12, fontWeight: 'bold' }} />
                        </YAxis>
                        <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="value" fill="#3498db" radius={[4, 4, 0, 0]} barSize={40} name="Doanh thu" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[#2c3e50] mb-6 text-lg">Tỷ lệ Trạng thái đơn</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dashboardData?.orderStatusStats} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" nameKey="label">
                          {dashboardData?.orderStatusStats?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.label] || '#95a5a6'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h3 className="font-bold text-[#2c3e50] mb-6 text-lg">Biểu đồ tăng trưởng doanh thu 12 tháng</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.monthlyRevenue} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#7f8c8d" tick={{fontSize: 12}}>
                         <Label value="Thời gian (Tháng)" offset={-10} position="insideBottom" style={{ fill: '#7f8c8d', fontSize: 12, fontWeight: 'bold' }} />
                      </XAxis>
                      <YAxis stroke="#7f8c8d" tickFormatter={(val) => `${val/1000000}M`} tick={{fontSize: 12}}>
                         <Label value="Doanh thu (VNĐ)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#7f8c8d', fontSize: 12, fontWeight: 'bold' }} />
                      </YAxis>
                      <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="value" name="Doanh thu" stroke="#f1c40f" strokeWidth={4} dot={{ r: 6, fill: '#f1c40f', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[#2c3e50] text-[15px] uppercase tracking-wide">Top sản phẩm bán chạy</h3>
                    <TrendingUp className="w-5 h-5 text-[#f1c40f]" />
                  </div>
                  <div className="space-y-5 flex-1">
                    {dashboardData?.topProducts?.length > 0 ? (
                      dashboardData.topProducts.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? 'bg-[#e74c3c] text-white' : idx === 1 ? 'bg-[#e67e22] text-white' : idx === 2 ? 'bg-[#f1c40f] text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold text-[#2c3e50] truncate" title={product.productName}>
                              {product.productName.replace('(Màu Mặc Định)', '').trim()}
                            </p>
                            <p className="text-[12px] text-gray-400 mt-0.5">
                              Đã bán: <span className="text-[#3498db] font-bold">{product.totalSold}</span>
                            </p>
                          </div>
                          <div className="text-[13px] font-bold text-[#2ecc71] whitespace-nowrap">
                            {product.revenue?.toLocaleString()}đ
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[#e74c3c] text-[15px] uppercase tracking-wide">Cần nhập hàng gấp</h3>
                    <AlertTriangle className="w-5 h-5 text-[#e74c3c] animate-pulse" />
                  </div>
                  <div className="space-y-4 flex-1">
                    {dashboardData?.lowStockProducts?.length > 0 ? (
                      dashboardData.lowStockProducts.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex-1 pr-3 min-w-0">
                            <p className="text-[13px] font-semibold text-[#34495e] truncate" title={item.productName}>
                              {item.productName.replace('(Màu Mặc Định)', '').trim()}
                            </p>
                          </div>
                          <div className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap shrink-0 ${item.stockLeft === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {item.stockLeft === 0 ? 'Hết hàng' : `Còn ${item.stockLeft}`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full text-[#2ecc71] text-sm font-medium">
                        Kho hàng ổn định
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[#2c3e50] text-[15px] uppercase tracking-wide">Doanh thu theo loại kính</h3>
                    <Glasses className="w-5 h-5 text-[#9b59b6]" />
                  </div>
                  <div className="flex-1 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData?.revenueByCategory} layout="vertical" margin={{ left: -10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#7f8c8d'}} width={100} />
                        <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}} formatter={(val) => [`${val.toLocaleString()}đ`, 'Doanh thu']} />
                        <Bar dataKey="value" fill="#2c3e50" barSize={24} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400 text-center italic">
                    * Chỉ tính dựa trên 3 danh mục chính
                  </div>
                </div>

              </div>
            </div>
          )
        ) : activeMenu === 'orders' ? (
          <AdminOrders />
        ) : activeMenu === 'products' ? (
          <AdminProducts />
        ) : activeMenu === 'vouchers' ? (
          <AdminVouchers />
        ) : activeMenu === 'users' ? (
          <AdminUsers />
        ) : activeMenu === 'categories' ? (
          <AdminCategory />
        ) : (
          <div className="px-8 pb-8 text-gray-500">Chức năng đang phát triển...</div>
        )}
      </main>
    </div>
  );
}