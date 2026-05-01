package vn.eyevora.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "color_name", nullable = false, length = 50)
    private String colorName;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "stock_quantity")
    private Integer stockQuantity = 0;
}