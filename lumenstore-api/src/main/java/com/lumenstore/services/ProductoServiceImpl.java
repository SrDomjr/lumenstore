package com.lumenstore.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumenstore.dto.ProductoRequestDTO;
import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.models.Categoria;
import com.lumenstore.models.Descuento;
import com.lumenstore.models.Marca;
import com.lumenstore.models.Producto;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.repository.ICategoriaRepository;
import com.lumenstore.repository.IMarcaRepository;
import com.lumenstore.repository.IProductoRepository;
import com.lumenstore.repository.IProductVariantRepository;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final IProductoRepository productoRepository;
    private final IProductVariantRepository productVariantRepository;
    private final IMarcaRepository marcaRepository;
    private final ICategoriaRepository categoriaRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProducts(Pageable pageable) {
        return productoRepository.findByIsActiveTrue(pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProducts(Pageable pageable, Long categoryId, Long brandId, String query, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        return productoRepository.findByFilters(categoryId, brandId, query, minPrice, maxPrice, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productoRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponseDTO getProductById(Long id) {
        Producto product = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con el id: " + id));
        return convertToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponseDTO getProductBySlug(String slug) {
        Producto product = productoRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con el slug: " + slug));
        return convertToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> getTrendingProducts() {
        return productoRepository.findTop12ByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> getNewProducts() {
        return productoRepository.findTop12ByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> getDiscountedProducts() {
        return productoRepository.findDistinctByIsActiveTrueAndDiscountsIsNotEmpty(Pageable.ofSize(12))
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponseDTO> getProductVariants(Long productId) {
        return productVariantRepository.findByProductIdAndIsActiveTrue(productId)
                .stream()
                .map(this::convertVariantToDTO)
                .toList();
    }

    @Override
    @Transactional
    public ProductoResponseDTO createProduct(ProductoRequestDTO request) {
        Marca brand = null;
        if (request.getBrandId() != null) {
            brand = marcaRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Marca no encontrada con id: " + request.getBrandId()));
        }

        Categoria category = null;
        if (request.getCategoryId() != null) {
            category = categoriaRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + request.getCategoryId()));
        }

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }

        Producto product = Producto.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .sku(request.getSku())
                .brand(brand)
                .category(category)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .build();

        product = productoRepository.save(product);

        // Create a default variant if basePrice or stock is provided
        if (request.getBasePrice() != null || request.getStock() != null) {
            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .price(request.getBasePrice() != null ? request.getBasePrice() : BigDecimal.ZERO)
                    .stock(request.getStock() != null ? request.getStock() : 0)
                    .isActive(true)
                    .build();
            productVariantRepository.save(variant);
        }

        return convertToDTO(product);
    }

    @Override
    @Transactional
    public ProductoResponseDTO updateProduct(Long id, ProductoRequestDTO request) {
        Producto product = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getSlug() != null) product.setSlug(request.getSlug());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getShortDescription() != null) product.setShortDescription(request.getShortDescription());
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getIsActive() != null) product.setIsActive(request.getIsActive());
        if (request.getFeatured() != null) product.setFeatured(request.getFeatured());

        if (request.getBrandId() != null) {
            Marca brand = marcaRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new RuntimeException("Marca no encontrada con id: " + request.getBrandId()));
            product.setBrand(brand);
        }

        if (request.getCategoryId() != null) {
            Categoria category = categoriaRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + request.getCategoryId()));
            product.setCategory(category);
        }

        product = productoRepository.save(product);

        // Update price/stock on first variant if provided
        if (request.getBasePrice() != null || request.getStock() != null) {
            List<ProductVariant> variants = productVariantRepository.findByProductIdAndIsActiveTrue(product.getId());
            if (!variants.isEmpty()) {
                ProductVariant variant = variants.get(0);
                if (request.getBasePrice() != null) variant.setPrice(request.getBasePrice());
                if (request.getStock() != null) variant.setStock(request.getStock());
                productVariantRepository.save(variant);
            } else {
                // Create default variant if none exists
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .price(request.getBasePrice() != null ? request.getBasePrice() : BigDecimal.ZERO)
                        .stock(request.getStock() != null ? request.getStock() : 0)
                        .isActive(true)
                        .build();
                productVariantRepository.save(variant);
            }
        }

        return convertToDTO(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Producto product = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
        product.setIsActive(false); // Soft delete
        productoRepository.save(product);
    }

    private ProductVariantResponseDTO convertVariantToDTO(ProductVariant variant) {
        return ProductVariantResponseDTO.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .sizeName(variant.getSize() != null ? variant.getSize().getName() : null)
                .colorName(variant.getColor() != null ? variant.getColor().getName() : null)
                .colorHex(variant.getColor() != null ? variant.getColor().getHexCode() : null)
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .stock(variant.getStock())
                .isActive(variant.getIsActive())
                .build();
    }

    private ProductoResponseDTO convertToDTO(Producto product) {
        BigDecimal basePrice = BigDecimal.ZERO;
        Integer stock = 0;

        // Get price and stock from the first active variant
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            ProductVariant firstVariant = product.getVariants().stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                    .findFirst()
                    .orElse(product.getVariants().get(0));
            basePrice = firstVariant.getPrice() != null ? firstVariant.getPrice() : BigDecimal.ZERO;
            stock = firstVariant.getStock() != null ? firstVariant.getStock() : 0;
        }

        return ProductoResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .shortDescription(product.getShortDescription())
                .sku(product.getSku())
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .basePrice(basePrice)
                .stock(stock)
                .discount(0)
                .featured(product.getFeatured() != null ? product.getFeatured() : false)
                .isActive(product.getIsActive() != null ? product.getIsActive() : true)
                .images(Collections.emptyList())
                .build();
    }
}