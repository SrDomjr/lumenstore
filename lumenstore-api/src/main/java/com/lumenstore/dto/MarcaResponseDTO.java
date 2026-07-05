package com.lumenstore.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MarcaResponseDTO {
    private Long id;
    private String name;
    private String slug;
    private String logoUrl;
}
