package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductPriceHistory;
import java.util.List;

@Repository
public interface IProductPriceHistoryRepository extends JpaRepository<ProductPriceHistory, Long> {
    List<ProductPriceHistory> findByVariantId(Long variantId);
    List<ProductPriceHistory> findByVariantIdOrderByChangedAtDesc(Long variantId);
}
