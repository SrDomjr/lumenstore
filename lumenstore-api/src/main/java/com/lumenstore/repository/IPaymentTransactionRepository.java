package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.PaymentTransaction;
import java.util.List;

@Repository
public interface IPaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findBySaleId(Long saleId);
    List<PaymentTransaction> findBySaleIdAndStatusOrderByCreatedAtDesc(Long saleId, String status);
}
