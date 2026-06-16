package vn.eyevora.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.ReviewRequest;
import vn.eyevora.backend.dto.ReviewResponse;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.service.ReviewService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    private final ReviewService reviewService;
    
    @PostMapping
    public ResponseEntity<Map<String, String>> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        reviewService.createReview(user, request);

        return ResponseEntity.ok(Map.of("message", "Đánh giá sản phẩm thành công"));
    }
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(@PathVariable Long productId) {
        List<ReviewResponse> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }
}