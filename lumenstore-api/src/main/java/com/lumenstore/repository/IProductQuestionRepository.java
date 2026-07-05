package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.ProductQuestion;
import java.util.List;

@Repository
public interface IProductQuestionRepository extends JpaRepository<ProductQuestion, Long> {
    List<ProductQuestion> findByProductId(Long productId);
    List<ProductQuestion> findByProductIdAndAnswerIsNotNull(Long productId);
}
