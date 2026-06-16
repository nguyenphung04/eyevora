package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.VoucherRequest;
import vn.eyevora.backend.entity.Voucher;
import vn.eyevora.backend.service.VoucherService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/vouchers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<List<Voucher>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody VoucherRequest request) {
        try {
            return ResponseEntity.ok(voucherService.createVoucher(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody VoucherRequest request) {
        try {
            return ResponseEntity.ok(voucherService.updateVoucher(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<Map<String, String>> toggleStatus(@PathVariable Integer id) {
        voucherService.toggleVoucherStatus(id);
        return ResponseEntity.ok(Map.of("message", "Đã thay đổi trạng thái Voucher"));
    }

}