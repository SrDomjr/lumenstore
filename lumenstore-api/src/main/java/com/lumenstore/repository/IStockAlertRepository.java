package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.StockAlert;
import java.util.List;

@Repository
public interface IStockAlertRepository extends JpaRepository<StockAlert, Long> {
    List<StockAlert> findByVariantId(Long variantId);
    List<StockAlert> findByIsActiveTrueOrderByVariantId();
}
