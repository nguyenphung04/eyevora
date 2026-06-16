package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.eyevora.backend.dto.CategoryRequest;
import vn.eyevora.backend.dto.CategoryResponse;
import vn.eyevora.backend.dto.CategoryStatResponse;
import vn.eyevora.backend.entity.Category;
import vn.eyevora.backend.repository.CategoryRepository;
import vn.eyevora.backend.repository.ProductRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryRepository.findAll().stream()
                .filter(Category::getIsActive)
                .map(c -> CategoryResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .parentId(c.getParentCategory() != null ? c.getParentCategory().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryStatResponse> getCategoryStats() {
        return categoryRepository.getCategoryStatistics();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = new Category();
        category.setName(request.getName());
        category.setIsActive(true);

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục cha"));
            category.setParentCategory(parent);
        }

        Category saved = categoryRepository.save(category);
        return CategoryResponse.builder().id(saved.getId()).name(saved.getName()).build();
    }

    @Transactional
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
        category.setName(request.getName());

        Category updated = categoryRepository.save(category);
        return CategoryResponse.builder().id(updated.getId()).name(updated.getName()).build();
    }

    @Transactional
    public void deleteCategory(Integer id) {
        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new RuntimeException("CẢNH BÁO: Không thể xóa danh mục đang có " + productCount + " sản phẩm!");
        }

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        categoryRepository.deleteById(id);
    }
    @Transactional
    public void toggleCategoryStatus(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        if (category.getIsActive()) {
            long productCount = productRepository.countByCategoryId(id);
            if (productCount > 0) {
                throw new RuntimeException("CẢNH BÁO: Không thể khóa danh mục đang có " + productCount + " sản phẩm!");
            }
        }

        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
    }
}