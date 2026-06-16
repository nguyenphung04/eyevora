package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.eyevora.backend.entity.Product;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);
    //Phần dành cho Chatbot AI
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Product p LEFT JOIN p.category c LEFT JOIN p.productVariants v WHERE " +
            "p.isActive = true AND v.stockQuantity > 0 AND " +
            "(:shape IS NULL OR LOWER(p.shape) LIKE LOWER(CONCAT('%', :shape, '%'))) AND " +
            "(:material IS NULL OR LOWER(p.material) LIKE LOWER(CONCAT('%', :material, '%'))) AND " +
            "(:minPrice IS NULL OR p.basePrice >= :minPrice) AND " +
            "(:maxPrice IS NULL OR p.basePrice <= :maxPrice) AND " +
            "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    java.util.List<Product> findByAiCriteria(
            @org.springframework.data.repository.query.Param("shape") String shape,
            @org.springframework.data.repository.query.Param("material") String material,
            @org.springframework.data.repository.query.Param("minPrice") java.math.BigDecimal minPrice,
            @org.springframework.data.repository.query.Param("maxPrice") java.math.BigDecimal maxPrice,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            org.springframework.data.domain.Sort sort);
    long countByCategoryId(Integer categoryId);
}