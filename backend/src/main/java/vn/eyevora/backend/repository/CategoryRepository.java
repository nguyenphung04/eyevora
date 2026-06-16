package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.eyevora.backend.dto.CategoryStatResponse;
import vn.eyevora.backend.entity.Category;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    @Query("SELECT new vn.eyevora.backend.dto.CategoryStatResponse(c.id, c.name, COUNT(p.id), c.isActive) " +
            "FROM Category c LEFT JOIN Product p ON p.category.id = c.id " +
            "GROUP BY c.id, c.name, c.isActive")
    List<CategoryStatResponse> getCategoryStatistics();
}