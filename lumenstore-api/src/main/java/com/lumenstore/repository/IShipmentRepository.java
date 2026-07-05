package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Shipment;
import java.util.List;
import java.util.Optional;

@Repository
public interface IShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findBySaleId(Long saleId);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    List<Shipment> findByStatusOrderByCreatedAtDesc(String status);
}
