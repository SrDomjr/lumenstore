package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Direccion;
import java.util.List;

@Repository
public interface IDireccionRepository extends JpaRepository<Direccion, Long> {
    List<Direccion> findByCustomerId(Long customerId);
    List<Direccion> findByCustomerIdAndIsDefaultTrue(Long customerId);
}
