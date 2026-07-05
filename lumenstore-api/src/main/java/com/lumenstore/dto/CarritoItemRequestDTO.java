package com.lumenstore.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CarritoItemRequestDTO {

    @NotNull(message = "El ID de la variante de producto es obligatorio")
    private Long productVariantId;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad mínima a agregar es 1")
    private Integer quantity;
}