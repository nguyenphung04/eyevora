package vn.eyevora.backend.dto;

import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private Integer parentId;
}