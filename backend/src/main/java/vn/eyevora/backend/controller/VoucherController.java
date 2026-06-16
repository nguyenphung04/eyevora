package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.VoucherResponse;
import vn.eyevora.backend.entity.Voucher;
import vn.eyevora.backend.service.VoucherService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class VoucherController {

    private final VoucherService voucherService;

    @PostMapping("/apply")
    public ResponseEntity<?> applyVoucher(@RequestBody Map<String, Object> request) {
        try {
            String code = (String) request.get("code");
            BigDecimal orderTotal = new BigDecimal(request.get("orderTotal").toString());

            Voucher voucher = voucherService.validateVoucher(code, orderTotal);

            BigDecimal discountAmount = voucherService.calculateDiscount(voucher, orderTotal);

            return ResponseEntity.ok(VoucherResponse.builder()
                    .code(voucher.getCode())
                    .description(voucher.getDescription())
                    .discountAmount(discountAmount)
                    .build());

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi xử lý hệ thống!"));
        }
    }
}