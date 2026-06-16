package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductVariantDto {
    private Long id;
    private String colorName;
    private String images;
    private Integer stockQuantity;
    private Boolean isActive;
}