package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductView;
import java.util.List;

@Repository
public interface IProductViewRepository extends JpaRepository<ProductView, Long> {
    List<ProductView> findByProductId(Long productId);
    List<ProductView> findByProductIdAndCustomerId(Long productId, Long customerId);
}
