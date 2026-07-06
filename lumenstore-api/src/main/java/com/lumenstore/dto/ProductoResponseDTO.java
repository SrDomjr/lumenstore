package com.lumenstore.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoResponseDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;
    private String sku;
    private String brandName;    // Solo enviamos el nombre de la marca
    private String categoryName; // Solo enviamos el nombre de la categoría
    private BigDecimal basePrice;
    private Integer stock;
    private Integer discount;
    private Boolean featured;
    private Boolean isActive;
    private List<String> images;
}