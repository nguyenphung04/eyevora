package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.eyevora.backend.dto.*;
import vn.eyevora.backend.entity.*;
import vn.eyevora.backend.repository.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;

    private String extractFirstImage(String imagesPath) {
        if (imagesPath == null || imagesPath.isEmpty()) return null;
        return imagesPath.contains(",") ? imagesPath.split(",")[0] : imagesPath;
    }

    private Integer calculateTotalStock(Product product) {
        if (product.getProductVariants() == null) return 0;
        return product.getProductVariants().stream()
                .mapToInt(ProductVariant::getStockQuantity)
                .sum();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Không phân loại")
                        .basePrice(product.getBasePrice())
                        .material(product.getMaterial())
                        .shape(product.getShape())
                        .brand(product.getBrand())
                        .description(product.getDescription())
                        .imageUrl((product.getProductVariants() != null && !product.getProductVariants().isEmpty())
                                ? extractFirstImage(product.getProductVariants().get(0).getImages())
                                : null)
                        .totalStock(calculateTotalStock(product))
                        .isActive(product.getIsActive() != null ? product.getIsActive() : true)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));

        List<ProductVariant> variants = variantRepository.findByProductId(id);

        List<ProductVariantDto> variantDtos = variants.stream()
                .map(v -> ProductVariantDto.builder()
                        .id(v.getId())
                        .colorName(v.getColorName())
                        .images(v.getImages())
                        .stockQuantity(v.getStockQuantity())
                        .isActive(product.getIsActive())
                        .build())
                .collect(Collectors.toList());

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Không phân loại")
                .basePrice(product.getBasePrice())
                .material(product.getMaterial())
                .shape(product.getShape())
                .brand(product.getBrand())
                .description(product.getDescription())
                .variants(variantDtos)
                .isActive(product.getIsActive())
                .build();
    }

    @Transactional
    public ProductDetailResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));

        Product product = Product.builder()
                .name(request.getName())
                .category(category)
                .basePrice(request.getBasePrice())
                .material(request.getMaterial())
                .shape(request.getShape())
                .brand(request.getBrand())
                .description(request.getDescription())
                .isActive(true)
                .build();

        Product savedProduct = productRepository.save(product);

        if (request.getVariants() != null) {
            List<ProductVariant> variants = request.getVariants().stream()
                    .map(vDto -> ProductVariant.builder()
                            .product(savedProduct)
                            .colorName(vDto.getColorName())
                            .images(vDto.getImages())
                            .stockQuantity(vDto.getStockQuantity())
                            .build())
                    .collect(Collectors.toList());
            variantRepository.saveAll(variants);
        }
        return getProductById(savedProduct.getId());
    }

    @Transactional
    public ProductDetailResponse updateProduct(Long id, ProductRequest request) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));

        existingProduct.setName(request.getName());
        existingProduct.setCategory(category);
        existingProduct.setBasePrice(request.getBasePrice());
        existingProduct.setMaterial(request.getMaterial());
        existingProduct.setShape(request.getShape());
        existingProduct.setBrand(request.getBrand());
        existingProduct.setDescription(request.getDescription());

        productRepository.save(existingProduct);

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<ProductVariant> existingVariants = variantRepository.findByProductId(id);
            ProductVariantDto vDto = request.getVariants().get(0);

            if (!existingVariants.isEmpty()) {
                ProductVariant variantToUpdate = existingVariants.get(0);
                variantToUpdate.setColorName(vDto.getColorName());
                variantToUpdate.setImages(vDto.getImages());
                variantToUpdate.setStockQuantity(vDto.getStockQuantity());
                variantRepository.save(variantToUpdate);
            } else {
                ProductVariant newVariant = ProductVariant.builder()
                        .product(existingProduct)
                        .colorName(vDto.getColorName())
                        .images(vDto.getImages())
                        .stockQuantity(vDto.getStockQuantity())
                        .build();
                variantRepository.save(newVariant);
            }
        }
        return getProductById(id);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive())
                .map(p -> ProductResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .categoryName(p.getCategory() != null ? p.getCategory().getName() : "Không phân loại")
                        .basePrice(p.getBasePrice())
                        .imageUrl((p.getProductVariants() != null && !p.getProductVariants().isEmpty())
                                ? extractFirstImage(p.getProductVariants().get(0).getImages())
                                : null)
                        .totalStock(calculateTotalStock(p))
                        .shape(p.getShape())
                        .material(p.getMaterial())
                        .isActive(p.getIsActive() != null ? p.getIsActive() : true)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id).orElseThrow();
        product.setIsActive(false);
        productRepository.save(product);
    }
    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProductsForHome() {
        return productRepository.findAll().stream()
                .filter(Product::getIsActive)
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Không phân loại")
                        .basePrice(product.getBasePrice())
                        .imageUrl(!product.getProductVariants().isEmpty() ? extractFirstImage(product.getProductVariants().get(0).getImages()) : null)
                        .totalStock(calculateTotalStock(product))
                        .shape(product.getShape())
                        .material(product.getMaterial())
                        .isActive(true)
                        .build())
                .collect(Collectors.toList());
    }
    @Transactional
    public void toggleProductStatus(Long id) {
        Product product = productRepository.findById(id).orElseThrow();
        product.setIsActive(product.getIsActive() == null ? false : !product.getIsActive());
        productRepository.save(product);
    }
}