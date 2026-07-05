package com.lumenstore.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleDetailItemDTO {
    private Long variantId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
}
