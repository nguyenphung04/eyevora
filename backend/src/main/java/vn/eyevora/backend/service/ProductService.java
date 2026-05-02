package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.eyevora.backend.dto.ProductResponse;
import vn.eyevora.backend.repository.ProductRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : "Không phân loại")
                        .basePrice(product.getBasePrice())
                        .material(product.getMaterial())
                        .shape(product.getShape())
                        .brand(product.getBrand())
                        .description(product.getDescription())
                        .build())
                .collect(Collectors.toList());
    }
}