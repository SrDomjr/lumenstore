package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductView;
import java.util.List;

@Repository
public interface IProductViewRepository extends JpaRepository<ProductView, Long> {
    List<ProductView> findByProductId(Long productId);
    List<ProductView> findByProductIdAndCustomerId(Long productId, Long customerId);

    @Query(value = "SELECT COUNT(*) FROM product_views WHERE DATE(viewed_at) = CURDATE()", nativeQuery = true)
    long countTodayViews();

    @Query(value = "SELECT COUNT(*) FROM product_views WHERE DATE(viewed_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)", nativeQuery = true)
    long countYesterdayViews();

    @Query(value = "SELECT COUNT(*) FROM product_views WHERE MONTH(viewed_at) = MONTH(CURDATE()) AND YEAR(viewed_at) = YEAR(CURDATE())", nativeQuery = true)
    long countMonthViews();

    @Query(value = "SELECT COUNT(*) FROM product_views WHERE MONTH(viewed_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(viewed_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))", nativeQuery = true)
    long countLastMonthViews();
}
