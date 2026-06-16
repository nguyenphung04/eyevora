package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.eyevora.backend.dto.DashboardResponse;
import vn.eyevora.backend.dto.LowStockDto;
import vn.eyevora.backend.dto.StatisticDto;
import vn.eyevora.backend.dto.TopProductDto;
import vn.eyevora.backend.repository.OrderItemRepository;
import vn.eyevora.backend.repository.OrderRepository;
import vn.eyevora.backend.repository.UserRepository;
import vn.eyevora.backend.repository.VoucherRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final VoucherRepository voucherRepository;
    public DashboardResponse getDashboardOverview() {
        BigDecimal revenue = orderRepository.calculateTotalRevenue();
        if (revenue == null) revenue = BigDecimal.ZERO;

        List<StatisticDto> revenue7Days = orderRepository.getRevenueLast7DaysNative().stream()
                .map(obj -> new StatisticDto(obj[0].toString(), obj[1]))
                .collect(Collectors.toList());

        List<StatisticDto> monthlyRev = orderRepository.getMonthlyRevenueNative().stream()
                .map(obj -> new StatisticDto(obj[0].toString(), obj[1]))
                .collect(Collectors.toList());
        List<StatisticDto> categoryRev = orderRepository.getRevenueByCategoryNative().stream()
                .map(obj -> new StatisticDto(obj[0].toString(), obj[1])).collect(Collectors.toList());

        List<LowStockDto> lowStockAlerts = orderItemRepository.getLowStockProductsRaw(PageRequest.of(0, 5))
                .stream().map(obj -> new LowStockDto((String) obj[0], ((Number) obj[1]).intValue())).collect(Collectors.toList());

        List<TopProductDto> topProducts = orderItemRepository.getTopSellingProductsRaw(PageRequest.of(0, 5))
                .stream()
                .map(obj -> new TopProductDto(
                        (String) obj[0],
                        ((Number) obj[1]).longValue(),
                        new BigDecimal(obj[2].toString()),
                        ((Number) obj[3]).intValue()
                ))
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalRevenue(revenue)
                .totalOrders(orderRepository.countValidOrders())
                .totalCustomers(userRepository.countTotalCustomers())
                .pendingOrders(orderRepository.countPendingOrders())
                .topProducts(topProducts)
                .revenueLast7Days(revenue7Days)
                .orderStatusStats(orderRepository.countOrdersByStatus())
                .monthlyRevenue(monthlyRev)
                .awaitingRefundOrders(orderRepository.countAwaitingRefundOrders())
                .revenueByCategory(categoryRev)
                .lowStockProducts(lowStockAlerts)
                .build();
    }
    public java.util.Map<String, Object> getExportData() {
        java.util.Map<String, Object> result = new java.util.HashMap<>();

        // 1. Sheet Sản Phẩm
        List<java.util.Map<String, Object>> products = orderRepository.getExportProductData().stream().map(obj -> {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>(); // Dùng LinkedHashMap để giữ nguyên thứ tự cột Excel
            map.put("Tên Sản Phẩm", obj[0]);
            map.put("Tổng Tồn Kho", obj[1] != null ? obj[1] : 0);
            map.put("Tổng Doanh Thu (VNĐ)", obj[2] != null ? obj[2] : 0);
            return map;
        }).collect(Collectors.toList());
        result.put("products", products);

        // 2. Sheet Khách Hàng
        List<java.util.Map<String, Object>> customers = orderRepository.getExportCustomerData().stream().map(obj -> {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("Tên Khách Hàng", obj[0]);
            map.put("Email", obj[1]);
            map.put("Số Điện Thoại", obj[2]);
            map.put("Tổng Đơn Hàng", obj[3]);
            map.put("Tổng Tiền Đã Mua (VNĐ)", obj[4]);
            map.put("Tổng SP Đã Mua", obj[5] != null ? obj[5] : 0);
            return map;
        }).collect(Collectors.toList());
        result.put("customers", customers);

        // 3. Sheet Danh Mục
        List<java.util.Map<String, Object>> categories = orderRepository.getExportCategoryData().stream().map(obj -> {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("Tên Danh Mục", obj[0]);
            map.put("Số Sản Phẩm Trực Thuộc", obj[1]);
            return map;
        }).collect(Collectors.toList());
        result.put("categories", categories);

        // 4. Sheet Hóa Đơn
        List<java.util.Map<String, Object>> orders = orderRepository.getExportOrderData().stream().map(obj -> {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("Mã Đơn", obj[0]);
            map.put("Khách Hàng", obj[1]);
            map.put("Trạng Thái Đơn", obj[2]);
            map.put("Thanh Toán", obj[3]);
            map.put("Tiền Hàng (Gốc)", obj[4]);
            map.put("Phí Vận Chuyển", obj[5]);
            map.put("Giảm Giá Voucher", obj[6]);
            map.put("Thanh Toán Cuối", obj[7]);
            map.put("Ngày Đặt", obj[8]);
            return map;
        }).collect(Collectors.toList());
        result.put("orders", orders);

        List<java.util.Map<String, Object>> vouchers = voucherRepository.findAll().stream().map(v -> {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("Mã Voucher", v.getCode());
            map.put("Loại Giảm Giá", v.getDiscountType());
            map.put("Giá Trị Giảm", v.getDiscountValue());
            map.put("Đơn Tối Thiểu", v.getMinOrderValue());
            map.put("Giảm Tối Đa", v.getMaxDiscountAmount());
            map.put("Ngày Kết Thúc", v.getEndDate());
            map.put("Giới Hạn Lượt", v.getUsageLimit());
            map.put("Tổng Lượt Đã Dùng", v.getUsedCount());
            map.put("Mô Tả", v.getDescription());
            return map;
        }).collect(Collectors.toList());
        result.put("vouchers", vouchers);
        return result;
    }
}