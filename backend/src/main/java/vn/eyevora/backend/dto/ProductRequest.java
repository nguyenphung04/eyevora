package vn.eyevora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotNull(message = "ID Danh mục không được để trống")
    private Integer categoryId;

    @NotNull(message = "Giá gốc không được để trống")
    private BigDecimal basePrice;

    private String material;
    private String shape;
    private String brand;
    private String description;

    private List<ProductVariantDto> variants;
}