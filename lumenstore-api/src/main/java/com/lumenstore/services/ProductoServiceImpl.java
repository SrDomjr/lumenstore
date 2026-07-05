package com.lumenstore.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.models.Producto;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.models.Descuento;
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

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProducts(Pageable pageable) {
        return productoRepository.findByIsActiveTrue(pageable)
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

        // Calculate max discount percentage
        Integer discount = 0;
        if (product.getDiscounts() != null && !product.getDiscounts().isEmpty()) {
            discount = product.getDiscounts().stream()
                    .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                    .map(d -> {
                        if (d.getDiscountType() == Descuento.DiscountType.percentage) {
                            return d.getValue().intValue();
                        }
                        return 0;
                    })
                    .max(Integer::compareTo)
                    .orElse(0);
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
                .discount(discount)
                .featured(product.getFeatured() != null ? product.getFeatured() : false)
                .images(Collections.emptyList())
                .build();
    }
}