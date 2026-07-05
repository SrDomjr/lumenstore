package com.lumenstore.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantResponseDTO {
    private Long id;
    private String sku;
    private String sizeName;
    private String colorName;
    private String colorHex;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private Integer stock;
    private Boolean isActive;
}