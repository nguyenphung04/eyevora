package vn.eyevora.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.eyevora.backend.entity.Order.PaymentMethod;

import java.util.List;

@Data
public class OrderRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    private String receiverName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String receiverPhone;

    private String receiverEmail;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    private String shippingAddress;

    private String note;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    @NotEmpty(message = "Giỏ hàng không được để trống")
    @Valid
    private List<OrderItemRequest> items;
    private String voucherCode;
}