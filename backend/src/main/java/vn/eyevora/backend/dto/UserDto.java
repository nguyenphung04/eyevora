package vn.eyevora.backend.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Boolean isActive;
    private String role;

    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Double avgRating;
}