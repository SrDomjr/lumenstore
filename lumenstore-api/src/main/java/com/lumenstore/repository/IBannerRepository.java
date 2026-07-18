package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Banner;
import java.util.List;

@Repository
public interface IBannerRepository extends JpaRepository<Banner, Long> {
    List<Banner> findByIsActiveTrueOrderBySortOrder();
    List<Banner> findByPositionAndIsActiveTrueOrderBySortOrder(Banner.Position position);
}
