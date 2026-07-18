package com.lumenstore.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO compartido para crear y actualizar productos. Se usa también para
 * actualizaciones parciales (p. ej. solo cambiar isActive), por lo que aquí
 * SOLO se validan formato/rango de los campos que vienen informados
 * (Bean Validation no falla sobre valores null, salvo @NotNull/@NotBlank).
 * La obligatoriedad de campos en la creación se valida en ProductoServiceImpl,
 * donde sí sabemos si es un alta o una edición parcial.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoRequestDTO {

    @Size(min = 2, max = 255, message = "El nombre debe tener entre 2 y 255 caracteres")
    private String name;

    @Pattern(regexp = "^$|^[a-z0-9]+(-[a-z0-9]+)*$", message = "El slug solo puede contener minúsculas, números y guiones")
    private String slug;

    private String description;

    @Size(max = 500, message = "La descripción corta no puede superar los 500 caracteres")
    private String shortDescription;

    @Size(max = 50, message = "El SKU no puede superar los 50 caracteres")
    private String sku;

    private Long brandId;
    private Long categoryId;

    @DecimalMin(value = "0.0", inclusive = true, message = "El precio no puede ser negativo")
    private BigDecimal basePrice;

    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock;

    @Min(value = 0, message = "El descuento no puede ser negativo")
    private Integer discount;

    private Boolean featured;
    private Boolean isActive;
    private List<String> tags;

    // ─── SEO ─────────────────────────────────────────────
    @Size(max = 255, message = "El meta título no puede superar los 255 caracteres")
    private String metaTitle;

    @Size(max = 500, message = "La meta descripción no puede superar los 500 caracteres")
    private String metaDescription;

    @Size(max = 500, message = "Las meta keywords no pueden superar los 500 caracteres")
    private String metaKeywords;

    // ─── Atributos adicionales ────────────────────────────
    @Size(max = 255, message = "El material no puede superar los 255 caracteres")
    private String material;

    @DecimalMin(value = "0.0", inclusive = true, message = "El peso no puede ser negativo")
    private BigDecimal weight;

    @Size(max = 100, message = "Las dimensiones no pueden superar los 100 caracteres")
    private String dimensions;

    @Size(max = 50, message = "El género no puede superar los 50 caracteres")
    private String gender;

    @Size(max = 255, message = "La garantía no puede superar los 255 caracteres")
    private String warranty;

    @Size(max = 255, message = "El fabricante no puede superar los 255 caracteres")
    private String manufacturer;

    @Size(max = 100, message = "El país de origen no puede superar los 100 caracteres")
    private String countryOfOrigin;

    // ─── Configuraciones ─────────────────────────────────
    private Boolean freeShipping;
    private Boolean isNew;
    private String visibility;
}