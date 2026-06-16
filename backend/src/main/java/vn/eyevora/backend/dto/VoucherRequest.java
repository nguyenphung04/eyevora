package vn.eyevora.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherRequest {
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private String description;
    private Integer usageLimit;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}