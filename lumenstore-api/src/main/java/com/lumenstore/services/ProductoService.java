package com.lumenstore.services;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.dto.ProductoRequestDTO;
import com.lumenstore.dto.ProductImageResponseDTO;


public interface ProductoService {
    // Obtener todos los productos activos con paginación
    Page<ProductoResponseDTO> getProducts(Pageable pageable);

    Page<ProductoResponseDTO> getProducts(Pageable pageable, Long categoryId, Long brandId, String query, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice);
    
    // Obtener TODOS los productos (activos e inactivos) — solo admin
    Page<ProductoResponseDTO> getAdminProducts(Pageable pageable, Long categoryId, Long brandId, String query);
    
    // Obtener productos filtrados por categoría con paginación
    Page<ProductoResponseDTO> getProductsByCategory(Long categoryId, Pageable pageable);
    
    // Buscar un único producto por su ID
    ProductoResponseDTO getProductById(Long id);

    // Buscar un único producto por su URL amigable (slug)
    ProductoResponseDTO getProductBySlug(String slug);

    // Productos destacados para la página principal
    List<ProductoResponseDTO> getTrendingProducts();
    List<ProductoResponseDTO> getNewProducts();
    List<ProductoResponseDTO> getDiscountedProducts();

    // Variantes de un producto
    List<ProductVariantResponseDTO> getProductVariants(Long productId);

    // CRUD de productos (admin)
    ProductoResponseDTO createProduct(ProductoRequestDTO request);
    ProductoResponseDTO updateProduct(Long id, ProductoRequestDTO request);
    void deleteProduct(Long id);

    // Variant CRUD
    ProductVariantResponseDTO createVariant(Long productId, Map<String, Object> body);
    ProductVariantResponseDTO updateVariant(Long variantId, Map<String, Object> body);
    void deleteVariant(Long variantId);

    // Images
    List<ProductImageResponseDTO> uploadImages(Long productId, List<MultipartFile> files, Long variantId);
    void setMainImage(Long productId, Long imageId);

    // Tags
    List<String> getProductTags(Long productId);
    void updateProductTags(Long productId, List<String> tags);

    // Uniqueness checks
    boolean slugExists(String slug);
    boolean slugExistsForOther(String slug, Long excludeId);
    boolean skuExists(String sku);
    boolean skuExistsForOther(String sku, Long excludeId);
}
