package com.lumenstore.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductReviewResponseDTO {
    private Long id;
    private String productName;
    private String customerName;
    private Byte rating;
    private String title;
    private String comment;
    private Boolean isApproved;
    private LocalDateTime createdAt;
}
