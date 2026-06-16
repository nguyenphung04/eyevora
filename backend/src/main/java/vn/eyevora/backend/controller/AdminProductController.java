package vn.eyevora.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.ProductDetailResponse;
import vn.eyevora.backend.dto.ProductRequest;
import vn.eyevora.backend.dto.ProductResponse;
import vn.eyevora.backend.service.ProductService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AdminProductController {

    private final ProductService productService;
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProductsForAdmin() {
        return ResponseEntity.ok(productService.getAllProducts());
    }
    @PostMapping
    public ResponseEntity<ProductDetailResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<java.util.Map<String, String>> toggleProductStatus(@PathVariable Long id) {
        productService.toggleProductStatus(id);
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "Đã cập nhật trạng thái sản phẩm!");
        return ResponseEntity.ok(response);
    }
}