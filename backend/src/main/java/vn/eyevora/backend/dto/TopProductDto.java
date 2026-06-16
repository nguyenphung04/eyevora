package vn.eyevora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopProductDto {
    private String productName;
    private Long totalSold;
    private BigDecimal revenue;
    private Integer stockLeft;
}