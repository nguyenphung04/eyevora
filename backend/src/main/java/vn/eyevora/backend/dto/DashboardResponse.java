package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalCustomers;
    private Long pendingOrders;

    private List<TopProductDto> topProducts;
    private List<StatisticDto> revenueLast7Days;
    private List<StatisticDto> orderStatusStats;
    private List<StatisticDto> monthlyRevenue;
    private Long awaitingRefundOrders;
    private List<LowStockDto> lowStockProducts;
    private List<StatisticDto> revenueByCategory;
}