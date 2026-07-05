package com.lumenstore.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistRequestDTO {
    private String name;
    private Boolean isDefault;
}
