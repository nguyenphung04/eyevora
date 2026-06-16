package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;
import vn.eyevora.backend.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderCode;
    private String receiverName;
    private String receiverPhone;
    private String receiverEmail;
    private String shippingAddress;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private BigDecimal shippingFee;
    private Order.OrderStatus orderStatus;

    private Order.PaymentStatus paymentStatus;

    private String paymentMethod;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long productId;
        private String productName;
        private String colorName;
        private Integer quantity;
        private BigDecimal price;
        private String imageUrl;
        private Boolean isReviewed;
        private Integer myRating;
        private String myComment;
    }
}