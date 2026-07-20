package com.lumenstore.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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

    @EntityGraph(attributePaths = {
        "brand", "category",
        "variants", "variants.size", "variants.color",
        "discounts"
    })
    Page<Producto> findByIsActiveTrue(Pageable pageable);

    @EntityGraph(attributePaths = {
        "brand", "category",
        "variants", "variants.size", "variants.color",
        "discounts"
    })
    Page<Producto> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN FETCH p.brand " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.variants v " +
           "LEFT JOIN FETCH v.size " +
           "LEFT JOIN FETCH v.color " +
           "LEFT JOIN FETCH p.discounts " +
           "WHERE p.isActive = true " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:brandId IS NULL OR p.brand.id = :brandId) " +
           "AND (:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:minPrice IS NULL OR EXISTS (SELECT 1 FROM ProductVariant pv WHERE pv.product = p AND pv.price >= :minPrice)) " +
           "AND (:maxPrice IS NULL OR EXISTS (SELECT 1 FROM ProductVariant pv WHERE pv.product = p AND pv.price <= :maxPrice))")
    Page<Producto> findByFilters(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("query") String query,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Query("SELECT DISTINCT p FROM Producto p " +
           "LEFT JOIN FETCH p.brand " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.variants " +
           "LEFT JOIN FETCH p.discounts " +
           "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:brandId IS NULL OR p.brand.id = :brandId) " +
           "AND (:isActive IS NULL OR p.isActive = :isActive) " +
           "AND (:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Producto> findByFiltersAdmin(
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("query") String query,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    @EntityGraph(attributePaths = {
        "brand", "category",
        "variants", "variants.size", "variants.color",
        "discounts"
    })
    List<Producto> findTop12ByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
        "brand", "category",
        "variants", "variants.size", "variants.color",
        "discounts"
    })
    List<Producto> findTop12ByIsActiveTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {
        "brand", "category",
        "variants", "variants.size", "variants.color",
        "discounts"
    })
    List<Producto> findDistinctByIsActiveTrueAndDiscountsIsNotEmpty(Pageable pageable);
    
    Optional<Producto> findBySlug(String slug);

    long countByCategoryIdAndIsActiveTrue(Long categoryId);

    long countByBrandIdAndIsActiveTrue(Long brandId);

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

}
