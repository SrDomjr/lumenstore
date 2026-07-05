package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Notification;
import java.util.List;

@Repository
public interface INotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    List<Notification> findByCustomerId(Long customerId);
    List<Notification> findByCustomerIdAndIsReadFalseOrderByCreatedAtDesc(Long customerId);
}
