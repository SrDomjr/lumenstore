package com.lumenstore.controller;

import com.lumenstore.dto.WishlistRequestDTO;
import com.lumenstore.dto.WishlistResponseDTO;
import com.lumenstore.models.Wishlist;
import com.lumenstore.services.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping
    public ResponseEntity<Wishlist> createWishlist(
            @PathVariable Long customerId,
            @RequestBody WishlistRequestDTO request) {
        Wishlist wishlist = wishlistService.createWishlist(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(wishlist);
    }

    @GetMapping("/default")
    public ResponseEntity<WishlistResponseDTO> getDefaultWishlist(
            @PathVariable Long customerId) {
        WishlistResponseDTO wishlist = wishlistService.getDefaultWishlist(customerId);
        return ResponseEntity.ok(wishlist);
    }

    @GetMapping("/{wishlistId}")
    public ResponseEntity<WishlistResponseDTO> getWishlist(
            @PathVariable Long customerId,
            @PathVariable Long wishlistId) {
        WishlistResponseDTO wishlist = wishlistService.getWishlistById(customerId, wishlistId);
        return ResponseEntity.ok(wishlist);
    }

    @PostMapping("/{wishlistId}/products/{productId}")
    public ResponseEntity<Void> addProductToWishlist(
            @PathVariable Long customerId,
            @PathVariable Long wishlistId,
            @PathVariable Long productId) {
        wishlistService.addProductToWishlist(customerId, wishlistId, productId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{wishlistId}/products/{productId}")
    public ResponseEntity<Void> removeProductFromWishlist(
            @PathVariable Long customerId,
            @PathVariable Long wishlistId,
            @PathVariable Long productId) {
        wishlistService.removeProductFromWishlist(customerId, wishlistId, productId);
        return ResponseEntity.noContent().build();
    }
}
