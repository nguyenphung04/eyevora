package vn.eyevora.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Integer id;
    private String name;
    private Integer parentId;
}