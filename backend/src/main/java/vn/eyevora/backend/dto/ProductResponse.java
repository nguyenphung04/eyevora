package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String categoryName;
    private BigDecimal basePrice;
    private String material;
    private String shape;
    private String brand;
    private String description;
}