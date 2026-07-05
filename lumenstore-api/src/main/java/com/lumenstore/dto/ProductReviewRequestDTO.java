package com.lumenstore.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductReviewRequestDTO {
    private Long productId;
    private Long customerId;
    private Byte rating;
    private String title;
    private String comment;
}
