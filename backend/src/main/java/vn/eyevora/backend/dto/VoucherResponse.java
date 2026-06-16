package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class VoucherResponse {
    private String code;
    private String description;
    private BigDecimal discountAmount;
}