package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Descuento;
import java.util.List;

@Repository
public interface IDescuentoRepository extends JpaRepository<Descuento, Long> {
    List<Descuento> findByIsActiveTrueOrderByCreatedAtDesc();
    List<Descuento> findByProductsIdAndIsActiveTrue(Long productId);
}
