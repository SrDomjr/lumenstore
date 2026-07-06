package com.lumenstore.controller;


import com.lumenstore.dto.ProductoRequestDTO;
import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.services.ProductoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productService;

    // GET /api/v1/products?page=0&size=10
    @GetMapping
    public ResponseEntity<Page<ProductoResponseDTO>> getAllProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(productService.getProducts(pageable, categoryId, brandId, q, minPrice, maxPrice));
    }

    // GET /api/v1/products/category/5
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ProductoResponseDTO>> getProductsByCategory(
            @PathVariable Long categoryId,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, pageable));
    }

    // GET /api/v1/products/5
    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // GET /api/v1/products/slug/smartphone-samsung-s24
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ProductoResponseDTO> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<ProductoResponseDTO>> getTrendingProducts() {
        return ResponseEntity.ok(productService.getTrendingProducts());
    }

    @GetMapping("/new")
    public ResponseEntity<List<ProductoResponseDTO>> getNewProducts() {
        return ResponseEntity.ok(productService.getNewProducts());
    }

    @GetMapping("/discounted")
    public ResponseEntity<List<ProductoResponseDTO>> getDiscountedProducts() {
        return ResponseEntity.ok(productService.getDiscountedProducts());
    }

    // GET /api/v1/products/{productId}/variants
    @GetMapping("/{productId}/variants")
    public ResponseEntity<List<ProductVariantResponseDTO>> getProductVariants(
            @PathVariable Long productId) {
        return ResponseEntity.ok(productService.getProductVariants(productId));
    }

    // ========== ADMIN CRUD ==========

    // POST /api/v1/products
    @PostMapping
    public ResponseEntity<ProductoResponseDTO> createProduct(@Valid @RequestBody ProductoRequestDTO request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    // PUT /api/v1/products/5
    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductoRequestDTO request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    // DELETE /api/v1/products/5
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}