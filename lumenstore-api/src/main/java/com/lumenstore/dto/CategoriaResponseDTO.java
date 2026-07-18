package com.lumenstore.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoriaResponseDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private Boolean isActive;
    private Long parentId;
    private Integer sortOrder;
    private List<CategoriaResponseDTO> children;
}