package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Sale;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ISaleRepository extends JpaRepository<Sale, Long> {
    Optional<Sale> findByOrderNumber(String orderNumber);
    List<Sale> findByCustomerId(Long customerId);
    List<Sale> findByStatusOrderByCreatedAtDesc(String status);
    List<Sale> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Sale> findTop5ByOrderByCreatedAtDesc();

    @Query(value = "SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled', 'refunded')", nativeQuery = true)
    BigDecimal sumTodaySales();

    @Query(value = "SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status NOT IN ('cancelled', 'refunded')", nativeQuery = true)
    BigDecimal sumYesterdaySales();

    @Query(value = "SELECT COALESCE(SUM(total), 0) FROM sales WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status NOT IN ('cancelled', 'refunded')", nativeQuery = true)
    BigDecimal sumMonthSales();

    @Query(value = "SELECT COALESCE(SUM(total), 0) FROM sales WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND status NOT IN ('cancelled', 'refunded')", nativeQuery = true)
    BigDecimal sumLastMonthSales();

    @Query(value = "SELECT COUNT(*) FROM sales WHERE status IN ('pending', 'paid', 'processing')", nativeQuery = true)
    long countPendingOrders();

    @Query(value = "SELECT COUNT(*) FROM sales WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status IN ('pending', 'paid', 'processing')", nativeQuery = true)
    long countPendingOrdersYesterday();

    @Query(value = "SELECT DATE(created_at) as day, COALESCE(SUM(total), 0) as revenue FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND status NOT IN ('cancelled', 'refunded') GROUP BY DATE(created_at) ORDER BY day", nativeQuery = true)
    List<Object[]> getDailyRevenueLast7Days();

    @Query(value = "SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled', 'refunded')", nativeQuery = true)
    long countTodayOrders();

    @Query(value = "SELECT COUNT(*) FROM sales WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status NOT IN ('cancelled', 'refunded')", nativeQuery = true)
    long countMonthOrders();
}
