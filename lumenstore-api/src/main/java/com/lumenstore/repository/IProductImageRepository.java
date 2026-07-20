package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductImage;
import java.util.List;

@Repository
public interface IProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductId(Long productId);
    List<ProductImage> findByProductIdOrderBySortOrder(Long productId);
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);
    List<ProductImage> findByProductIdAndIsMainTrue(Long productId);

    @Query("SELECT i FROM ProductImage i WHERE i.product.id IN :productIds ORDER BY i.product.id, i.sortOrder ASC")
    List<ProductImage> findByProductIdInOrderByProductIdSortOrderAsc(@Param("productIds") List<Long> productIds);
}
