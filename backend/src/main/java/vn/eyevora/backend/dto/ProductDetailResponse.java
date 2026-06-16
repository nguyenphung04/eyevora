package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String categoryName;
    private BigDecimal basePrice;
    private String material;
    private String shape;
    private String brand;
    private String description;
    private Boolean isActive;
    private List<ProductVariantDto> variants;
}