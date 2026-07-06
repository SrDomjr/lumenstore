package com.lumenstore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CarritoResponseDTO {

    private Long id;
    private Long clienteId;
    private List<CarritoItemResponseDTO> items;
    private String createdAt;
    private String updatedAt;
}
