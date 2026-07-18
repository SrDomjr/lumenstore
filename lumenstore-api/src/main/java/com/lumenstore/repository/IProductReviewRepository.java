package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductReview;
import java.util.List;

@Repository
public interface IProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductId(Long productId);
    List<ProductReview> findByProductIdAndIsApprovedTrue(Long productId);
    List<ProductReview> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId);
    List<ProductReview> findTop5ByIsApprovedFalseOrderByCreatedAtDesc();
}
