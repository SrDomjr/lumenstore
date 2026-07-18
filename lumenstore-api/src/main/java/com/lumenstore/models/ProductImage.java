package com.lumenstore.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entidad que mapea la tabla {@code product_images}.
 * <p>
 * La columna {@code image_url} almacena ÚNICAMENTE el {@code public_id}
 * devuelto por Cloudinary (ej: {@code lumenstore/products/12/34/5_main}).
 * La URL completa de Cloudinary se construye al vuelo desde el frontend
 * usando el {@code public_id} y el {@code cloud_name} de la configuración.
 */
@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Producto product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ProductVariant variant;

    /**
     * Almacena el {@code public_id} de Cloudinary (NO la URL completa).
     * Ejemplo: {@code lumenstore/products/12/34/5_main}
     */
    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "is_main")
    private Boolean isMain = false;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;
}