package com.lumenstore.services;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.dto.ProductoRequestDTO;

public interface ProductoService {
    // Obtener todos los productos activos con paginación
    Page<ProductoResponseDTO> getProducts(Pageable pageable);

    Page<ProductoResponseDTO> getProducts(Pageable pageable, Long categoryId, Long brandId, String query, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice);
    
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
}
