package com.lumenstore.dto;

import lombok.*;

/**
 * DTO para imágenes de producto.
 * <p>
 * El campo {@code imageUrl} contiene el {@code public_id} de Cloudinary
 * (NO la URL completa). Ejemplo: {@code lumenstore/products/12/34/5_main}.
 * El frontend construye la URL completa usando el pipe {@code cloudinaryUrl}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImageResponseDTO {
    private Long id;
    /** public_id de Cloudinary (NO la URL completa) */
    private String imageUrl;
    private String altText;
    private Integer sortOrder;
    private Boolean isMain;
    private Long variantId;
}