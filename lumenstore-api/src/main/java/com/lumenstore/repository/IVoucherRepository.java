package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Voucher;
import java.util.Optional;

@Repository
public interface IVoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findBySaleId(Long saleId);
}
