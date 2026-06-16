package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.eyevora.backend.dto.TopProductDto;
import vn.eyevora.backend.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("SELECT v.product.name, SUM(oi.quantity), SUM(oi.price * oi.quantity), MAX(v.stockQuantity) " +
            "FROM OrderItem oi JOIN oi.variant v JOIN oi.order o " +
            "WHERE o.orderStatus = 'COMPLETED' " +
            "GROUP BY v.product.name " +
            "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> getTopSellingProductsRaw(Pageable pageable);
    @Query("SELECT v.product.name, MAX(v.stockQuantity) " +
            "FROM OrderItem oi JOIN oi.variant v " +
            "WHERE v.stockQuantity < 10 " +
            "GROUP BY v.product.name " +
            "ORDER BY MAX(v.stockQuantity) ASC")
    List<Object[]> getLowStockProductsRaw(Pageable pageable);
}