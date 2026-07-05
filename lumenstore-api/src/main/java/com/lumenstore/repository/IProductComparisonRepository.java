package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductComparison;
import java.util.List;
import java.util.Optional;

@Repository
public interface IProductComparisonRepository extends JpaRepository<ProductComparison, Long> {
    List<ProductComparison> findByCustomerId(Long customerId);
    Optional<ProductComparison> findByCustomerIdAndProductId(Long customerId, Long productId);
}
