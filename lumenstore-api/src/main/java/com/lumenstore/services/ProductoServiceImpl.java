package com.lumenstore.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.lumenstore.dto.ProductoRequestDTO;
import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.models.Categoria;
import com.lumenstore.models.Color;
import com.lumenstore.models.Descuento;
import com.lumenstore.models.Etiqueta;
import com.lumenstore.models.Marca;
import com.lumenstore.models.ProductImage;
import com.lumenstore.models.Producto;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.models.Talla;
import com.lumenstore.repository.ICategoriaRepository;
import com.lumenstore.repository.IColorRepository;
import com.lumenstore.repository.IEtiquetaRepository;
import com.lumenstore.repository.IMarcaRepository;
import com.lumenstore.repository.IProductImageRepository;
import com.lumenstore.repository.IProductoRepository;
import com.lumenstore.repository.IProductVariantRepository;
import com.lumenstore.repository.ITallaRepository;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final IProductoRepository productoRepository;
    private final IProductVariantRepository productVariantRepository;
    private final IMarcaRepository marcaRepository;
    private final ICategoriaRepository categoriaRepository;
    private final IProductImageRepository productImageRepository;
    private final IEtiquetaRepository etiquetaRepository;
    private final ITallaRepository tallaRepository;
    private final IColorRepository colorRepository;

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
    public Page<ProductoResponseDTO> getAdminProducts(Pageable pageable, Long categoryId, Long brandId, String query) {
        return productoRepository.findByFiltersAdmin(categoryId, brandId, query, pageable)
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
        product.setIsActive(false);
        productoRepository.save(product);
    }

    // ─── Variant CRUD ─────────────────────────────────────────

    @Override
    @Transactional
    public ProductVariantResponseDTO createVariant(Long productId, Map<String, Object> body) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + productId));

        Talla size = null;
        if (body.get("sizeId") != null) {
            size = tallaRepository.findById(((Number) body.get("sizeId")).longValue()).orElse(null);
        }

        Color color = null;
        if (body.get("colorId") != null) {
            color = colorRepository.findById(((Number) body.get("colorId")).longValue()).orElse(null);
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .size(size)
                .color(color)
                .sku((String) body.get("sku"))
                .price(body.get("price") != null ? new BigDecimal(body.get("price").toString()) : BigDecimal.ZERO)
                .compareAtPrice(body.get("compareAtPrice") != null ? new BigDecimal(body.get("compareAtPrice").toString()) : null)
                .stock(body.get("stock") != null ? ((Number) body.get("stock")).intValue() : 0)
                .isActive(true)
                .build();

        variant = productVariantRepository.save(variant);
        return convertVariantToDTO(variant);
    }

    @Override
    @Transactional
    public ProductVariantResponseDTO updateVariant(Long variantId, Map<String, Object> body) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variante no encontrada con id: " + variantId));

        if (body.containsKey("sku")) variant.setSku((String) body.get("sku"));
        if (body.containsKey("price")) variant.setPrice(new BigDecimal(body.get("price").toString()));
        if (body.containsKey("compareAtPrice")) {
            variant.setCompareAtPrice(body.get("compareAtPrice") != null ? new BigDecimal(body.get("compareAtPrice").toString()) : null);
        }
        if (body.containsKey("stock")) variant.setStock(((Number) body.get("stock")).intValue());

        variant = productVariantRepository.save(variant);
        return convertVariantToDTO(variant);
    }

    // ─── Images ───────────────────────────────────────────────

    @Override
    @Transactional
    public List<ProductImage> uploadImages(Long productId, List<MultipartFile> files) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + productId));

        try {
            String uploadDir = "uploads/products/" + productId;
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            int currentSortOrder = productImageRepository.findByProductId(productId).size();

            for (MultipartFile file : files) {
                String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                String imageUrl = "/" + uploadDir + "/" + fileName;

                boolean isMain = currentSortOrder == 0 && productImageRepository.findByProductId(productId).isEmpty();

                ProductImage image = ProductImage.builder()
                        .product(product)
                        .imageUrl(imageUrl)
                        .altText("")
                        .sortOrder(currentSortOrder++)
                        .isMain(isMain)
                        .build();

                productImageRepository.save(image);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al subir imágenes: " + e.getMessage());
        }

        return productImageRepository.findByProductIdOrderBySortOrderAsc(productId);
    }

    @Override
    @Transactional
    public void setMainImage(Long productId, Long imageId) {
        // Unset all main images for this product
        List<ProductImage> currentMain = productImageRepository.findByProductIdAndIsMainTrue(productId);
        currentMain.forEach(img -> img.setIsMain(false));
        productImageRepository.saveAll(currentMain);

        // Set the new main image
        ProductImage newMain = productImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Imagen no encontrada con id: " + imageId));
        newMain.setIsMain(true);
        productImageRepository.save(newMain);
    }

    // ─── Tags ─────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<String> getProductTags(Long productId) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + productId));

        if (product.getTags() == null) return List.of();
        return product.getTags().stream()
                .map(Etiqueta::getName)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateProductTags(Long productId, List<String> tags) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + productId));

        if (tags == null || tags.isEmpty()) {
            product.setTags(Collections.emptySet());
        } else {
            java.util.Set<Etiqueta> tagEntities = tags.stream().map(tagName -> {
                String tagSlug = tagName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
                return etiquetaRepository.findBySlug(tagSlug)
                        .orElseGet(() -> {
                            Etiqueta newTag = Etiqueta.builder()
                                    .name(tagName)
                                    .slug(tagSlug)
                                    .build();
                            return etiquetaRepository.save(newTag);
                        });
            }).collect(Collectors.toSet());
            product.setTags(tagEntities);
        }

        productoRepository.save(product);
    }

    // ─── DTO Converters ───────────────────────────────────────

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

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            ProductVariant firstVariant = product.getVariants().stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                    .findFirst()
                    .orElse(product.getVariants().get(0));
            basePrice = firstVariant.getPrice() != null ? firstVariant.getPrice() : BigDecimal.ZERO;
            stock = firstVariant.getStock() != null ? firstVariant.getStock() : 0;
        }

        List<String> imageUrls = Collections.emptyList();
        try {
            imageUrls = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId())
                    .stream()
                    .map(ProductImage::getImageUrl)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // ignore
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
                .images(imageUrls)
                .build();
    }
}