package vn.eyevora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryStatResponse {
    private Integer id;
    private String name;
    private Long productCount;
    private Boolean isActive;
}