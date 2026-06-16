package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.eyevora.backend.dto.ReviewRequest;
import vn.eyevora.backend.dto.ReviewResponse;
import vn.eyevora.backend.entity.Order;
import vn.eyevora.backend.entity.Product;
import vn.eyevora.backend.entity.Review;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.repository.OrderRepository;
import vn.eyevora.backend.repository.ProductRepository;
import vn.eyevora.backend.repository.ReviewRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public void createReview(User user, ReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền đánh giá đơn hàng này");
        }

        if (order.getOrderStatus() != Order.OrderStatus.COMPLETED) {
            throw new RuntimeException("Chỉ có thể đánh giá khi đơn hàng đã hoàn tất (COMPLETED)");
        }

        boolean hasPurchased = order.getOrderItems().stream()
                .anyMatch(item -> item.getVariant().getProduct().getId().equals(product.getId()));

        if (!hasPurchased) {
            throw new RuntimeException("Bạn chưa mua sản phẩm này trong đơn hàng");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .order(order)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);
    }
    public List<ReviewResponse> getReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);

        return reviews.stream().map(review -> ReviewResponse.builder()
                .id(review.getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }
}