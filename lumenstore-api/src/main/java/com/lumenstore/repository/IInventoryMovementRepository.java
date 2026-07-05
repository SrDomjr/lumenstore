package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.InventoryMovement;
import java.util.List;

@Repository
public interface IInventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByVariantId(Long variantId);
    List<InventoryMovement> findByVariantIdOrderByCreatedAtDesc(Long variantId);
}
