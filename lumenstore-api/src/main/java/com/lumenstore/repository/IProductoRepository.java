package com.lumenstore.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import com.lumenstore.models.Producto;

@Repository
public interface IProductoRepository extends JpaRepository<Producto, Long> {

    // Paginación automática: Fundamental para no saturar la app si hay miles de productos
    Page<Producto> findByIsActiveTrue(Pageable pageable);
    
    // Filtrar productos por categoría usando paginación
    Page<Producto> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN p.variants v " +
           "WHERE p.isActive = true " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:brandId IS NULL OR p.brand.id = :brandId) " +
           "AND (:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:minPrice IS NULL OR v.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR v.price <= :maxPrice)")
    Page<Producto> findByFilters(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("query") String query,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    // Admin: mostrar TODOS los productos (sin filtrar por isActive)
    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN p.variants v " +
           "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:brandId IS NULL OR p.brand.id = :brandId) " +
           "AND (:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Producto> findByFiltersAdmin(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("query") String query,
            Pageable pageable);

    // Productos destacados
    List<Producto> findTop12ByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc();

    // Nuevos productos basados en fecha de creación
    List<Producto> findTop12ByIsActiveTrueOrderByCreatedAtDesc();

    // Productos con descuento
    List<Producto> findDistinctByIsActiveTrueAndDiscountsIsNotEmpty(Pageable pageable);
    
    Optional<Producto> findBySlug(String slug);

}
