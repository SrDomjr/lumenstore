package com.lumenstore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CarritoItemResponseDTO {

    private Long id;
    private Long variantId;
    private String productName;
    private BigDecimal price;
    private String imageUrl;
    private String color;
    private String size;
    private Integer quantity;
    private String addedAt;
}
