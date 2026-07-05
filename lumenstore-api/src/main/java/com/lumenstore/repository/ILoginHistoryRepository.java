package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.LoginHistory;
import java.util.List;

@Repository
public interface ILoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    List<LoginHistory> findByUserId(Long userId);
    List<LoginHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
