package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.eyevora.backend.dto.OrderRequest;
import vn.eyevora.backend.dto.OrderResponse;
import vn.eyevora.backend.entity.*;
import vn.eyevora.backend.repository.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository variantRepository;
    private final VoucherService voucherService;
    private final VoucherRepository voucherRepository;
    private final VnpayTransactionRepository vnpayTransactionRepository;
    private final EmailService emailService;
    private final ReviewRepository reviewRepository;

    @Transactional
    public String createGuestOrder(OrderRequest request, User user) {
        String orderCode = "EYE-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (var itemReq : request.getItems()) {
            ProductVariant variant = variantRepository.findById(itemReq.getVariantId())
                    .orElseGet(() -> {
                        List<ProductVariant> variants = variantRepository.findByProductId(itemReq.getVariantId());
                        if (variants != null && !variants.isEmpty()) {
                            return variants.get(0);
                        }
                        throw new RuntimeException("Không tìm thấy hàng hóa với ID: " + itemReq.getVariantId());
                    });

            if (variant.getProduct() != null && !variant.getProduct().getIsActive()) {
                throw new RuntimeException("Sản phẩm '" + variant.getProduct().getName() + "' hiện đã ngừng kinh doanh. Vui lòng gỡ khỏi giỏ hàng!");
            }
            if (variant.getStockQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException("Sản phẩm '" + variant.getProduct().getName() + "' không đủ số lượng trong kho!");
            }

            variant.setStockQuantity(variant.getStockQuantity() - itemReq.getQuantity());
            variantRepository.save(variant);

            BigDecimal price = variant.getProduct().getBasePrice();
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .variant(variant)
                    .quantity(itemReq.getQuantity())
                    .price(price)
                    .build();

            orderItems.add(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        Voucher appliedVoucher = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            appliedVoucher = voucherService.validateVoucher(request.getVoucherCode(), totalAmount);
            discountAmount = voucherService.calculateDiscount(appliedVoucher, totalAmount);

            appliedVoucher.setUsedCount(appliedVoucher.getUsedCount() + 1);
            voucherRepository.save(appliedVoucher);
        }

//        BigDecimal finalAmountBeforeShipping = totalAmount.subtract(discountAmount);
//        BigDecimal shippingFee = finalAmountBeforeShipping.compareTo(BigDecimal.valueOf(50000)) >= 0
//                ? BigDecimal.ZERO
//                : BigDecimal.valueOf(10000);
//        BigDecimal finalAmount = finalAmountBeforeShipping.add(shippingFee);
        BigDecimal shippingFee = totalAmount.compareTo(BigDecimal.valueOf(50000)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(10000);

        BigDecimal finalAmount = totalAmount.add(shippingFee).subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .receiverEmail(request.getReceiverEmail())
                .shippingAddress(request.getShippingAddress())
                .note(request.getNote())
                .paymentMethod(request.getPaymentMethod())
                .orderStatus(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .shippingFee(shippingFee)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .voucher(appliedVoucher)
                .build();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }

        order.setOrderItems(orderItems);
        orderRepository.save(order);
        if (request.getPaymentMethod() == Order.PaymentMethod.COD) {
            emailService.sendOrderConfirmation(request.getReceiverEmail(), orderCode, request.getReceiverName());
        }
        return orderCode;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        var itemResponses = order.getOrderItems().stream()
                .map(item -> {
                    Long productId = null;
                    String productName = "Sản phẩm đã bị xóa";
                    String colorName = "Phân loại đã bị xóa";
                    String thumbnail = "https://via.placeholder.com/150?text=Eyevora+Deleted";
                    boolean isReviewed = false;
                    Integer myRating = null;
                    String myComment = null;

                    if (item.getVariant() != null) {
                        colorName = item.getVariant().getColorName();

                        String rawImages = item.getVariant().getImages();
                        if (rawImages != null && !rawImages.isEmpty()) {
                            thumbnail = rawImages.contains(",") ? rawImages.split(",")[0] : rawImages;
                        }

                        if (item.getVariant().getProduct() != null) {
                            productId = item.getVariant().getProduct().getId();
                            productName = item.getVariant().getProduct().getName();


                            Optional<Review> reviewOpt = reviewRepository.findByOrderIdAndProductId(
                                    order.getId(), productId
                            );
                            isReviewed = reviewOpt.isPresent();
                            myRating = isReviewed ? reviewOpt.get().getRating() : null;
                            myComment = isReviewed ? reviewOpt.get().getComment() : null;
                        }
                    }

                    return OrderResponse.OrderItemResponse.builder()
                            .productId(productId)
                            .productName(productName)
                            .colorName(colorName)
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .imageUrl(thumbnail)
                            .isReviewed(isReviewed)
                            .myRating(myRating)
                            .myComment(myComment)
                            .build();
                })
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .receiverEmail(order.getReceiverEmail())
                .shippingAddress(order.getShippingAddress())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .shippingFee(order.getShippingFee())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    public List<OrderResponse> getMyOrders(Long userId) {
        return orderRepository.findByUserId(userId).stream().map(this::mapToOrderResponse).collect(Collectors.toList());
    }

    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với mã: " + orderCode));
        return mapToOrderResponse(order);
    }

    public List<OrderResponse> getAllOrdersForAdmin() {
        return orderRepository.findAll().stream().map(this::mapToOrderResponse).collect(Collectors.toList());
    }

    public OrderResponse trackGuestOrder(String orderCode, String phone) {
        Order order = orderRepository.findByOrderCodeAndReceiverPhone(orderCode, phone)
                .orElseThrow(() -> new RuntimeException("Mã đơn hàng hoặc số điện thoại không chính xác!"));
        return mapToOrderResponse(order);
    }

    @Transactional
    public void updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + orderId));

        if (newStatus == Order.OrderStatus.CANCELLED && order.getOrderStatus() != Order.OrderStatus.CANCELLED) {
            restoreStockForCancelledOrder(order);

            if (order.getPaymentStatus() == Order.PaymentStatus.PENDING) {
                order.setPaymentStatus(Order.PaymentStatus.FAILED);
            }
        }

        if (newStatus == Order.OrderStatus.COMPLETED && order.getPaymentMethod() == Order.PaymentMethod.COD) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
        }

        order.setOrderStatus(newStatus);
        orderRepository.save(order);
    }

    @Transactional
    public void processVnpayReturn(Map<String, String> vnpayData) {
        String orderCode = vnpayData.get("vnp_TxnRef");
        String responseCode = vnpayData.get("vnp_ResponseCode");

        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderCode));

        VnpayTransaction transaction = VnpayTransaction.builder()
                .order(order)
                .vnpTxnRef(orderCode)
                .vnpTransactionNo(vnpayData.get("vnp_TransactionNo"))
                .vnpAmount(new BigDecimal(vnpayData.get("vnp_Amount")).divide(BigDecimal.valueOf(100)))
                .vnpBankCode(vnpayData.get("vnp_BankCode"))
                .vnpPayDate(vnpayData.get("vnp_PayDate"))
                .vnpResponseCode(responseCode)
                .build();

        vnpayTransactionRepository.save(transaction);

        if ("00".equals(responseCode)) {
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setOrderStatus(Order.OrderStatus.CONFIRMED);
            emailService.sendOrderConfirmation(order.getReceiverEmail(), orderCode, order.getReceiverName());
        } else {
            if (order.getOrderStatus() != Order.OrderStatus.CANCELLED) {
                restoreStockForCancelledOrder(order);
            }
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            order.setOrderStatus(Order.OrderStatus.CANCELLED);
        }

        orderRepository.save(order);
    }

    private void restoreStockForCancelledOrder(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            ProductVariant variant = item.getVariant();
            if (variant != null) {
                variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                variantRepository.save(variant);
            }
        }
    }
    @Transactional
    public void refundVnpayOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (order.getPaymentMethod() == Order.PaymentMethod.VNPAY
                && order.getOrderStatus() == Order.OrderStatus.CANCELLED
                && order.getPaymentStatus() == Order.PaymentStatus.PAID) {

            order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
            orderRepository.save(order);
        } else {
            throw new RuntimeException("Đơn hàng không đủ điều kiện để hoàn tiền!");
        }
    }
}