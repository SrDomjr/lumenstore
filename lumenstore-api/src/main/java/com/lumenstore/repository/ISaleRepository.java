package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Sale;
import java.util.List;
import java.util.Optional;

@Repository
public interface ISaleRepository extends JpaRepository<Sale, Long> {
    Optional<Sale> findByOrderNumber(String orderNumber);
    List<Sale> findByCustomerId(Long customerId);
    List<Sale> findByStatusOrderByCreatedAtDesc(String status);
    List<Sale> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
