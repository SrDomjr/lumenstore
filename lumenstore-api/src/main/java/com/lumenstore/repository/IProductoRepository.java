package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import com.lumenstore.models.Producto;

@Repository
public interface IProductoRepository extends JpaRepository<Producto, Long> {

    // Paginación automática: Fundamental para no saturar la app si hay miles de productos
    Page<Producto> findByIsActiveTrue(Pageable pageable);
    
    // Filtrar productos por categoría usando paginación
    Page<Producto> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

    // Productos destacados
    List<Producto> findTop12ByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc();

    // Nuevos productos basados en fecha de creación
    List<Producto> findTop12ByIsActiveTrueOrderByCreatedAtDesc();

    // Productos con descuento
    List<Producto> findDistinctByIsActiveTrueAndDiscountsIsNotEmpty(Pageable pageable);
    
    Optional<Producto> findBySlug(String slug);

}
