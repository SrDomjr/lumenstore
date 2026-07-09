package com.lumenstore.controller;


import com.lumenstore.dto.ProductoRequestDTO;
import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.models.ProductImage;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.repository.IProductImageRepository;
import com.lumenstore.repository.IProductVariantRepository;
import com.lumenstore.services.ProductoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productService;
    private final IProductVariantRepository variantRepository;
    private final IProductImageRepository imageRepository;

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

    // ENDPOINT DEDICADO para admin - NO hay conflicto con /{id} porque Spring
    // distingue rutas con longitud fija vs variables de path
    @GetMapping("/admin")
    public ResponseEntity<Page<ProductoResponseDTO>> getAdminProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 100) Pageable pageable) {
        return ResponseEntity.ok(productService.getAdminProducts(pageable, categoryId, brandId, q));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ProductoResponseDTO>> getProductsByCategory(
            @PathVariable Long categoryId,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId, pageable));
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

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ProductoResponseDTO> getProductBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductBySlug(slug));
    }

    @GetMapping("/{productId}/variants")
    public ResponseEntity<List<ProductVariantResponseDTO>> getProductVariants(
            @PathVariable Long productId) {
        return ResponseEntity.ok(productService.getProductVariants(productId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductoResponseDTO> createProduct(@Valid @RequestBody ProductoRequestDTO request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductoRequestDTO request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Variant CRUD ─────────────────────────────────────────

    @PostMapping("/{productId}/variants")
    public ResponseEntity<ProductVariantResponseDTO> createVariant(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(productService.createVariant(productId, body));
    }

    @PutMapping("/variants/{variantId}")
    public ResponseEntity<ProductVariantResponseDTO> updateVariant(
            @PathVariable Long variantId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(productService.updateVariant(variantId, body));
    }

    // ─── Images ───────────────────────────────────────────────

    @GetMapping("/{productId}/images")
    public ResponseEntity<List<ProductImage>> getProductImages(@PathVariable Long productId) {
        return ResponseEntity.ok(imageRepository.findByProductIdOrderBySortOrderAsc(productId));
    }

    @PostMapping("/{productId}/images")
    public ResponseEntity<List<ProductImage>> uploadImages(
            @PathVariable Long productId,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(productService.uploadImages(productId, files));
    }

    @PutMapping("/{productId}/images/{imageId}/main")
    public ResponseEntity<Void> setMainImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        productService.setMainImage(productId, imageId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        imageRepository.deleteById(imageId);
        return ResponseEntity.noContent().build();
    }

    // ─── Tags ─────────────────────────────────────────────────

    @GetMapping("/{productId}/tags")
    public ResponseEntity<List<String>> getProductTags(@PathVariable Long productId) {
        return ResponseEntity.ok(productService.getProductTags(productId));
    }

    @PutMapping("/{productId}/tags")
    public ResponseEntity<Void> updateProductTags(
            @PathVariable Long productId,
            @RequestBody List<String> tags) {
        productService.updateProductTags(productId, tags);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}/tags")
    public ResponseEntity<Void> deleteProductTags(@PathVariable Long productId) {
        productService.updateProductTags(productId, List.of());
        return ResponseEntity.noContent().build();
    }
}
