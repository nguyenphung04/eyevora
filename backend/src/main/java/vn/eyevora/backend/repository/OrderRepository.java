package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.eyevora.backend.entity.Order;
import vn.eyevora.backend.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
    List<Order> findByUserId(Long userId);
    Optional<Order> findByOrderCode(String orderCode);

    Optional<Order> findByOrderCodeAndReceiverPhone(String orderCode, String receiverPhone);

    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(o) FROM Order o JOIN o.orderItems oi WHERE o.user.id = :userId AND oi.variant.product.id = :productId AND o.orderStatus = 'COMPLETED'")
    long countCompletedOrdersForProduct(@Param("userId") Long userId, @Param("productId") Long productId);
    @Query("SELECT SUM(o.finalAmount) FROM Order o WHERE o.orderStatus = 'COMPLETED'")
    java.math.BigDecimal calculateTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus != 'CANCELLED'")
    Long countValidOrders();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = 'PENDING'")
    Long countPendingOrders();

    @Query("SELECT new vn.eyevora.backend.dto.StatisticDto(CAST(o.orderStatus AS string), COUNT(o)) " +
            "FROM Order o GROUP BY o.orderStatus")
    java.util.List<vn.eyevora.backend.dto.StatisticDto> countOrdersByStatus();

    @Query(value = "SELECT DATE_FORMAT(created_at, '%d/%m') as label, SUM(final_amount) as value " +
            "FROM orders WHERE order_status = 'COMPLETED' " +
            "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) " +
            "GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d/%m') " +
            "ORDER BY DATE(created_at) ASC", nativeQuery = true)
    java.util.List<Object[]> getRevenueLast7DaysNative();

    @Query(value = "SELECT DATE_FORMAT(created_at, 'Tháng %m') as label, SUM(final_amount) as value " +
            "FROM orders WHERE order_status = 'COMPLETED' " +
            "AND YEAR(created_at) = YEAR(CURDATE()) " +
            "GROUP BY MONTH(created_at), DATE_FORMAT(created_at, 'Tháng %m') " +
            "ORDER BY MONTH(created_at) ASC", nativeQuery = true)
    java.util.List<Object[]> getMonthlyRevenueNative();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.paymentMethod = 'VNPAY' AND o.paymentStatus = 'PAID' AND o.orderStatus = 'CANCELLED'")
    Long countAwaitingRefundOrders();
    @Query("SELECT c.name, SUM(oi.price * oi.quantity) " +
            "FROM OrderItem oi JOIN oi.variant v JOIN v.product p JOIN p.category c JOIN oi.order o " +
            "WHERE o.orderStatus = 'COMPLETED' " +
            "AND c.name IN ('Kính thời trang', 'Kính râm', 'Kính cận') " +
            "GROUP BY c.name")
    List<Object[]> getRevenueByCategoryNative();

    @Query("SELECT p.name, " +
            "(SELECT COALESCE(SUM(v.stockQuantity), 0) FROM ProductVariant v WHERE v.product.id = p.id), " +
            "(SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM OrderItem oi JOIN oi.order o WHERE oi.variant.product.id = p.id AND o.orderStatus = 'COMPLETED') " +
            "FROM Product p")
    List<Object[]> getExportProductData();

    @Query("SELECT u.fullName, u.email, u.phone, " +
            "(SELECT COUNT(o) FROM Order o WHERE o.receiverEmail = u.email AND o.orderStatus = 'COMPLETED'), " +
            "(SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.receiverEmail = u.email AND o.orderStatus = 'COMPLETED'), " +
            "(SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi JOIN oi.order o WHERE o.receiverEmail = u.email AND o.orderStatus = 'COMPLETED') " +
            "FROM User u WHERE u.role <> 'ADMIN'")
    List<Object[]> getExportCustomerData();

    // 3. Thống kê Danh mục
    @Query("SELECT c.name, (SELECT COUNT(p.id) FROM Product p WHERE p.category.id = c.id) FROM Category c")
    List<Object[]> getExportCategoryData();

    // 4. Thống kê Hóa đơn tổng
    @Query("SELECT o.orderCode, o.receiverName, CAST(o.orderStatus AS string), CAST(o.paymentStatus AS string), " +
            "o.totalAmount, o.shippingFee, o.discountAmount, o.finalAmount, o.createdAt " +
            "FROM Order o ORDER BY o.createdAt DESC")
    List<Object[]> getExportOrderData();

}