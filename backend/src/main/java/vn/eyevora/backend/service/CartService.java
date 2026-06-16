package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.eyevora.backend.dto.CartItemRequest;
import vn.eyevora.backend.entity.Cart;
import vn.eyevora.backend.entity.CartItem;
import vn.eyevora.backend.entity.ProductVariant;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.repository.CartRepository;
import vn.eyevora.backend.repository.ProductVariantRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional
    public void syncCart(User user, List<CartItemRequest> localItems, String strategy) {
        Cart cart = cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
                    return cartRepository.save(newCart);
                });

        if ("KEEP_LOCAL".equalsIgnoreCase(strategy)) {
            cart.getItems().clear();
            addNewItemsToCart(cart, localItems);

        } else if ("MERGE".equalsIgnoreCase(strategy)) {
            for (CartItemRequest localItem : localItems) {
                Optional<CartItem> existingItem = cart.getItems().stream()
                        .filter(item -> item.getVariant().getId().equals(localItem.getVariantId()))
                        .findFirst();

                if (existingItem.isPresent()) {
                    existingItem.get().setQuantity(existingItem.get().getQuantity() + localItem.getQuantity());
                } else {
                    ProductVariant variant = variantRepository.findById(localItem.getVariantId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy phân loại hàng ID: " + localItem.getVariantId()));

                    cart.getItems().add(CartItem.builder()
                            .cart(cart)
                            .variant(variant)
                            .quantity(localItem.getQuantity())
                            .build());
                }
            }
        }

        cartRepository.save(cart);
    }

    private void addNewItemsToCart(Cart cart, List<CartItemRequest> items) {
        for (CartItemRequest itemReq : items) {
            ProductVariant variant = variantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phân loại hàng ID: " + itemReq.getVariantId()));

            cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(itemReq.getQuantity())
                    .build());
        }
    }
}