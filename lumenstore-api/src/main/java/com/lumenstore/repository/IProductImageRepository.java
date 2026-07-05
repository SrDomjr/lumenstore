package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductImage;
import java.util.List;

@Repository
public interface IProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductId(Long productId);
    List<ProductImage> findByProductIdOrderBySortOrder(Long productId);
    List<ProductImage> findByProductIdAndIsMainTrue(Long productId);
}
