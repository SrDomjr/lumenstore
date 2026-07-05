package com.lumenstore.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponRequestDTO {
    private String code;
    private String discountType;
    private String value;
    private String minPurchase;
    private String usageLimit;
}
