package vn.eyevora.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.OrderRequest;
import vn.eyevora.backend.dto.OrderResponse;
import vn.eyevora.backend.entity.Order;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.repository.UserRepository;
import vn.eyevora.backend.service.OrderService;
import vn.eyevora.backend.service.VNPayService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;
    private final VNPayService vnPayService;
    private final UserRepository userRepository;

    @PostMapping("/guest")
    public ResponseEntity<Map<String, String>> createGuestOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication // Thêm param hứng Token
    ) {
        User user = null;
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            user = (User) authentication.getPrincipal();
        }

        String orderCode = orderService.createGuestOrder(request, user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Đặt hàng thành công!");
        response.put("orderCode", orderCode);

        if (request.getPaymentMethod() == Order.PaymentMethod.VNPAY) {
            OrderResponse orderData = orderService.getOrderByCode(orderCode);
            try {
                String paymentUrl = vnPayService.createOrderUrl(orderCode, orderData.getFinalAmount().longValue());
                response.put("paymentUrl", paymentUrl);
            } catch (Exception e) {
                e.printStackTrace();
                response.put("error", "Lỗi tạo link thanh toán VNPay");
            }
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        String vnp_ResponseCode = request.getParameter("vnp_ResponseCode");
        String txnRef = request.getParameter("vnp_TxnRef");
        String amount = request.getParameter("vnp_Amount");

        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_TxnRef", txnRef);
        fields.put("vnp_ResponseCode", vnp_ResponseCode);
        fields.put("vnp_TransactionNo", request.getParameter("vnp_TransactionNo"));
        fields.put("vnp_Amount", amount);
        fields.put("vnp_BankCode", request.getParameter("vnp_BankCode"));
        fields.put("vnp_PayDate", request.getParameter("vnp_PayDate"));

        try {
            orderService.processVnpayReturn(fields);
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ trạng thái VNPay: " + e.getMessage());
        }

        String redirectUrl;
        if ("00".equals(vnp_ResponseCode)) {
            redirectUrl = String.format("http://localhost:5173/checkout/result?vnp_ResponseCode=00&vnp_TxnRef=%s&vnp_Amount=%s",
                    txnRef, amount);
        } else {
            redirectUrl = String.format("http://localhost:5173/checkout/result?vnp_ResponseCode=%s&vnp_TxnRef=%s",
                    vnp_ResponseCode, txnRef);
        }

        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/track")
    public ResponseEntity<OrderResponse> trackOrder(@RequestParam String orderCode, @RequestParam String phone) {
        OrderResponse orderResponse = orderService.trackGuestOrder(orderCode, phone);
        return ResponseEntity.ok(orderResponse);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        List<OrderResponse> orders = orderService.getMyOrders(user.getId());

        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelMyOrder(@PathVariable Long id) {
        orderService.updateOrderStatus(id, Order.OrderStatus.CANCELLED);
        return ResponseEntity.ok(Map.of("message", "Hủy đơn hàng thành công!"));
    }
}