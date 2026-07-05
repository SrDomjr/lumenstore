package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.WishlistItem;
import java.util.List;
import java.util.Optional;

@Repository
public interface IWishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByWishlistId(Long wishlistId);
    Optional<WishlistItem> findByWishlistIdAndProductId(Long wishlistId, Long productId);
}
