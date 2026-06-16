package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.OrderResponse;
import vn.eyevora.backend.entity.Order;
import vn.eyevora.backend.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(request.get("status"));
        orderService.updateOrderStatus(id, newStatus);

        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái đơn hàng thành công"));
    }
    @PutMapping("/{id}/refund")
    public ResponseEntity<Map<String, String>> refundOrder(@PathVariable Long id) {
        orderService.refundVnpayOrder(id);
        return ResponseEntity.ok(Map.of("message", "Đã xác nhận hoàn tiền cho khách!"));
    }
}