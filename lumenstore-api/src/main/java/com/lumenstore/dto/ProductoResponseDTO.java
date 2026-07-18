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
    private Long brandId;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private BigDecimal basePrice;
    private Integer stock;
    private Integer discount;
    private Boolean featured;
    private Boolean isActive;
    private List<String> images;

    // ─── SEO ─────────────────────────────────────────────
    private String metaTitle;
    private String metaDescription;
    private String metaKeywords;

    // ─── Atributos adicionales ────────────────────────────
    private String material;
    private BigDecimal weight;
    private String dimensions;
    private String gender;
    private String warranty;
    private String manufacturer;
    private String countryOfOrigin;

    // ─── Configuraciones ─────────────────────────────────
    private Boolean freeShipping;
    private Boolean isNew;
    private String visibility;
}