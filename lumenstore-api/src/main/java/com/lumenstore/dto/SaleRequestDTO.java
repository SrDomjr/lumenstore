package com.lumenstore.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleRequestDTO {
    private Long customerId;
    private List<SaleDetailItemDTO> items;
    private BigDecimal discountAmount;
    private BigDecimal shippingCost;
    private String paymentMethod;
    private String notes;
}
