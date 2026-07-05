package com.lumenstore.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistResponseDTO {
    private Long id;
    private String name;
    private Boolean isDefault;
    private Integer itemCount;
    private LocalDateTime createdAt;
}
