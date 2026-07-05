package com.lumenstore.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.ProductVariant;

import java.util.List;
import java.util.Optional;

@Repository
public interface IProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    // Recuperar todas las variantes disponibles (tallas/colores) de un producto específico
    List<ProductVariant> findByProductIdAndIsActiveTrue(Long productId);
    
    // Buscar variante por su código único de inventario (SKU)
    Optional<ProductVariant> findBySku(String sku);

}
