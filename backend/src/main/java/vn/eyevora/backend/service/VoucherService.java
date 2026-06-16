package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.eyevora.backend.dto.VoucherRequest;
import vn.eyevora.backend.entity.Voucher;
import vn.eyevora.backend.repository.VoucherRepository;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public Voucher validateVoucher(String code, BigDecimal orderTotal) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại!"));

        if (!voucher.getIsActive()) {
            throw new RuntimeException("Mã giảm giá đã bị khóa!");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Mã giảm giá chưa đến thời gian sử dụng!");
        }
        if (now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn!");
        }

        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng!");
        }

        if (orderTotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu (" + voucher.getMinOrderValue() + "đ) để áp dụng mã này!");
        }

        return voucher;
    }

    public BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderTotal) {
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (voucher.getDiscountType() == Voucher.DiscountType.FIXED_AMOUNT) {
            discountAmount = voucher.getDiscountValue();
        }
        else if (voucher.getDiscountType() == Voucher.DiscountType.PERCENTAGE) {
            BigDecimal percentage = voucher.getDiscountValue().divide(BigDecimal.valueOf(100));
            discountAmount = orderTotal.multiply(percentage);

            if (voucher.getMaxDiscountAmount() != null && discountAmount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discountAmount = voucher.getMaxDiscountAmount();
            }
        }

        if (discountAmount.compareTo(orderTotal) > 0) {
            return orderTotal;
        }

        return discountAmount;
    }
    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAllByOrderByIdDesc();
    }

    @Transactional
    public Voucher createVoucher(VoucherRequest request) {
        if (voucherRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Mã Voucher đã tồn tại trong hệ thống!");
        }

        if ("PERCENTAGE".equals(request.getDiscountType()) && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new RuntimeException("Giảm giá phần trăm không được vượt quá 100%!");
        }
        if ("FIXED_AMOUNT".equals(request.getDiscountType()) && request.getDiscountValue().compareTo(BigDecimal.valueOf(10000)) < 0) {
            throw new RuntimeException("Giá trị giảm tiền mặt tối thiểu nên là 10.000đ.");
        }

        Voucher voucher = new Voucher();
        voucher.setCode(request.getCode().toUpperCase());
        voucher.setDiscountType(Voucher.DiscountType.valueOf(request.getDiscountType()));
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setMinOrderValue(request.getMinOrderValue() == null ? BigDecimal.ZERO : request.getMinOrderValue());
        voucher.setDescription(request.getDescription());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());

        voucher.setUsedCount(0);
        voucher.setIsActive(true);

        return voucherRepository.save(voucher);
    }

    public Voucher toggleVoucherStatus(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Voucher"));
        voucher.setIsActive(!voucher.getIsActive());
        return voucherRepository.save(voucher);
    }
    @Transactional
    public Voucher updateVoucher(Integer id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Voucher"));

        if ("PERCENTAGE".equals(request.getDiscountType()) && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new RuntimeException("Giảm giá phần trăm không được vượt quá 100%!");
        }
        if ("FIXED_AMOUNT".equals(request.getDiscountType()) && request.getDiscountValue().compareTo(BigDecimal.valueOf(10000)) < 0) {
            throw new RuntimeException("Giá trị giảm tiền mặt tối thiểu nên là 10.000đ.");
        }

        voucher.setDiscountType(Voucher.DiscountType.valueOf(request.getDiscountType()));
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        voucher.setMinOrderValue(request.getMinOrderValue() == null ? BigDecimal.ZERO : request.getMinOrderValue());
        voucher.setDescription(request.getDescription());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());

        return voucherRepository.save(voucher);
    }
}