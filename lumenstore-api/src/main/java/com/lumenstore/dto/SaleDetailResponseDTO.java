package com.lumenstore.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleDetailResponseDTO {
    private Long id;
    private Long saleId;
    private Long variantId;
    private String productName;
    private String variantSku;
    private String colorName;
    private String sizeName;
    private String imageUrl;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
}
