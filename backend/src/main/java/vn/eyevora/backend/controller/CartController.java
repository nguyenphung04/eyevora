package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.CartItemRequest;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.service.CartService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartService cartService;

    @PostMapping("/sync")
    public ResponseEntity<Map<String, String>> syncCart(
            @RequestBody List<CartItemRequest> localItems,
            @RequestParam(defaultValue = "MERGE") String strategy,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();

        cartService.syncCart(user, localItems, strategy);

        return ResponseEntity.ok(Map.of("message", "Đồng bộ giỏ hàng thành công với chiến lược: " + strategy));
    }
}